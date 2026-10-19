import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import { wsClient } from './services/websocket';
import { soundEffects } from './services/audio';
import { notificationService } from './services/notifications';
import { User, Conversation, Message, MessageReceipt, AuthResponse } from '@chat/shared-types';
import { ChatSidebar } from './features/chats/ChatSidebar';
import { ChatWindow } from './features/chats/ChatWindow';
import { AuthModal } from './features/auth/AuthModal';
import { NewChatModal } from './features/chats/NewChatModal';
import { CallModal } from './features/calls/CallModal';
import { NotificationModal } from './features/notifications/NotificationModal';
import { NotificationToastContainer } from './features/notifications/NotificationToastContainer';
import { generateUUID } from './utils/uuid';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(true);

  // Calling state
  const [activeCall, setActiveCall] = useState<{
    targetUserId: string;
    targetName: string;
    isVideo: boolean;
    isIncoming: boolean;
  } | null>(null);

  // Initialize theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Prompt notification allow popup on opening website if not yet granted
  useEffect(() => {
    if (
      notificationService.isSupported() &&
      notificationService.getPermissionStatus() === 'default' &&
      !notificationService.isDismissed()
    ) {
      const timer = setTimeout(() => {
        setShowNotificationModal(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  // Check existing session
  useEffect(() => {
    const token = localStorage.getItem('chat_access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api.getMe()
      .then((user) => {
        setCurrentUser(user);
        wsClient.connect(token);
        loadConversations();
        notificationService.syncDeviceToken();
      })
      .catch(() => {
        localStorage.removeItem('chat_access_token');
        localStorage.removeItem('chat_refresh_token');
      })
      .finally(() => setLoading(false));
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const list = await api.getConversations();
      setConversations(list);
    } catch (e) {
      console.error('Failed to load conversations', e);
    }
  }, []);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    api.getMessages(activeConversationId)
      .then((res) => {
        setMessages(res.messages);
        // Clear unread in list
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConversationId ? { ...c, unreadCount: 0 } : c))
        );
      })
      .catch((e) => console.error('Failed to load messages', e));
  }, [activeConversationId]);

  // WebSocket event listeners
  useEffect(() => {
    if (!currentUser) return;

    // 1. Message Created
    const unsubMsg = wsClient.onMessageCreated((msg: Message) => {
      // Check if belongs to current conversation
      if (msg.conversationId === activeConversationId) {
        setMessages((prev) => {
          const matchIndex = prev.findIndex(
            (m) =>
              (Boolean(msg.clientMessageId) && m.clientMessageId === msg.clientMessageId) ||
              (Boolean(msg.id) && m.id === msg.id)
          );
          if (matchIndex >= 0) {
            const next = [...prev];
            next[matchIndex] = { ...msg, status: 'sent' };
            return next;
          }
          return [...prev, msg];
        });
      }

      // Audio & delivery receipt for incoming messages
      if (msg.senderId !== currentUser.id) {
        soundEffects.playIncomingMessage();
        wsClient.markDelivered(msg.id, msg.conversationId);

        // Web Browser & Desktop Push Notification
        const senderName = msg.sender?.displayName || msg.sender?.username || 'New Message';
        const conv = conversations.find((c) => c.id === msg.conversationId);
        const title = conv?.type === 'GROUP' ? (conv.title || 'Group Chat') : senderName;
        const body = conv?.type === 'GROUP' ? `${senderName}: ${msg.content}` : msg.content;

        notificationService.showNotification(title, {
          body,
          tag: msg.conversationId,
          avatar: senderName.charAt(0).toUpperCase(),
          onClick: () => {
            setActiveConversationId(msg.conversationId);
            setIsMobileOpen(false);
          },
        });
      }

      // Update conversations sidebar lastMessage & unread count
      setConversations((prev) => {
        return prev.map((c) => {
          if (c.id === msg.conversationId) {
            const isCurrent = c.id === activeConversationId;
            return {
              ...c,
              lastMessage: msg,
              updatedAt: msg.createdAt,
              unreadCount: isCurrent ? 0 : (c.unreadCount || 0) + (msg.senderId !== currentUser.id ? 1 : 0),
            };
          }
          return c;
        });
      });
    });

    // 2. Receipt Updated
    const unsubReceipt = wsClient.onReceiptUpdated((receipt: MessageReceipt) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === receipt.messageId) {
            const receipts = m.receipts ? [...m.receipts] : [];
            const idx = receipts.findIndex((r) => r.userId === receipt.userId);
            if (idx >= 0) receipts[idx] = receipt;
            else receipts.push(receipt);
            return { ...m, receipts };
          }
          return m;
        })
      );

      setConversations((prev) =>
        prev.map((c) => {
          if (c.lastMessage && c.lastMessage.id === receipt.messageId) {
            const receipts = c.lastMessage.receipts ? [...c.lastMessage.receipts] : [];
            const idx = receipts.findIndex((r) => r.userId === receipt.userId);
            if (idx >= 0) receipts[idx] = receipt;
            else receipts.push(receipt);
            return { ...c, lastMessage: { ...c.lastMessage, receipts } };
          }
          return c;
        })
      );
    });

    // 3. Typing Updated
    const unsubTyping = wsClient.onTypingUpdated((event) => {
      if (event.conversationId === activeConversationId) {
        setTypingUsers((prev) => ({
          ...prev,
          [event.userId]: event.isTyping,
        }));
      }
    });

    // 4. Presence Updated
    const unsubPresence = wsClient.onPresenceUpdated((event) => {
      setConversations((prev) =>
        prev.map((c) => {
          const updatedMembers = c.members.map((m) => {
            if (m.userId === event.userId && m.user) {
              return {
                ...m,
                user: {
                  ...m.user,
                  isOnline: event.isOnline,
                  lastSeenAt: event.lastSeenAt || m.user.lastSeenAt,
                },
              };
            }
            return m;
          });
          return { ...c, members: updatedMembers };
        })
      );
    });

    // 5. Call Signal
    const unsubCall = wsClient.onCallSignal((signal) => {
      if (signal.signalType === 'offer' && signal.senderUserId) {
        const caller = conversations
          .flatMap((c) => c.members)
          .find((m) => m.userId === signal.senderUserId)?.user;

        setActiveCall({
          targetUserId: signal.senderUserId,
          targetName: caller?.displayName || 'Incoming Caller',
          isVideo: false,
          isIncoming: true,
        });
      } else if (signal.signalType === 'hangup') {
        setActiveCall(null);
      }
    });

    return () => {
      unsubMsg();
      unsubReceipt();
      unsubTyping();
      unsubPresence();
      unsubCall();
    };
  }, [currentUser, activeConversationId, conversations]);

  const handleAuthenticated = (res: AuthResponse) => {
    setCurrentUser(res.user);
    wsClient.connect(res.tokens.accessToken);
    loadConversations();
    notificationService.syncDeviceToken();
  };

  const handleLogout = () => {
    notificationService.unregister();
    wsClient.disconnect();
    localStorage.removeItem('chat_access_token');
    localStorage.removeItem('chat_refresh_token');
    setCurrentUser(null);
    setConversations([]);
    setActiveConversationId(null);
    setMessages([]);
  };

  const handleSendMessage = async (content: string) => {
    if (!currentUser || !activeConversationId) return;

    const clientMsgId = generateUUID();
    const optimisticMessage: Message = {
      id: clientMsgId,
      conversationId: activeConversationId,
      senderId: currentUser.id,
      clientMessageId: clientMsgId,
      type: 'TEXT',
      content,
      createdAt: new Date().toISOString(),
      sender: currentUser,
      receipts: [],
      status: 'sending',
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, optimisticMessage]);

    const payload = {
      conversationId: activeConversationId,
      clientMessageId: clientMsgId,
      messageType: 'TEXT' as const,
      content,
    };

    try {
      // Primary: Send via HTTP REST API (visible in DevTools Network tab)
      const saved = await api.sendMessage(payload);
      setMessages((prev) =>
        prev.map((m) =>
          (m.clientMessageId && m.clientMessageId === clientMsgId) || m.id === clientMsgId
            ? { ...saved, status: 'sent' }
            : m
        )
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, lastMessage: saved, updatedAt: saved.createdAt }
            : c
        )
      );
    } catch (err) {
      console.warn('[Chat] HTTP API send failed, trying WebSocket fallback:', err);
      // Fallback: try WebSocket if HTTP fails
      const sentWs = wsClient.sendMessage(payload);
      if (!sentWs) {
        console.error('[Chat] Both HTTP API and WebSocket failed to send');
        setMessages((prev) =>
          prev.map((m) =>
            (m.clientMessageId && m.clientMessageId === clientMsgId) || m.id === clientMsgId
              ? { ...m, status: 'failed' }
              : m
          )
        );
      }
    }
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setIsMobileOpen(false); // On mobile, show chat area
  };

  const handleStartCall = (targetUserId: string, isVideo: boolean) => {
    const activeConv = conversations.find((c) => c.id === activeConversationId);
    const targetMember = activeConv?.members.find((m) => m.userId === targetUserId);

    setActiveCall({
      targetUserId,
      targetName: targetMember?.user?.displayName || 'Contact',
      isVideo,
      isIncoming: false,
    });

    wsClient.sendCallSignal({
      targetUserId,
      signalType: 'offer',
      data: { isVideo },
    });
  };

  const handleHangupCall = () => {
    if (activeCall) {
      wsClient.sendCallSignal({
        targetUserId: activeCall.targetUserId,
        signalType: 'hangup',
        data: {},
      });
      setActiveCall(null);
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="typing-dots" style={{ transform: 'scale(1.5)', marginBottom: '16px' }}>
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </div>
          <div>Loading WhatsApp...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <AuthModal onAuthenticated={handleAuthenticated} />
        <NotificationModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
          onGranted={() => {
            notificationService.syncDeviceToken();
          }}
        />
        <NotificationToastContainer />
      </>
    );
  }

  return (
    <div className="app-container">
      <ChatSidebar
        currentUser={currentUser}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onOpenNewChat={() => setShowNewChatModal(true)}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        isMobileOpen={isMobileOpen}
      />

      <ChatWindow
        currentUser={currentUser}
        conversation={activeConversation}
        messages={messages}
        onSendMessage={handleSendMessage}
        onBackToSidebar={() => setIsMobileOpen(true)}
        typingUsers={typingUsers}
        onStartCall={handleStartCall}
      />

      {showNewChatModal && (
        <NewChatModal
          currentUser={currentUser}
          onClose={() => setShowNewChatModal(false)}
          onConversationCreated={(newConv) => {
            setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
            setActiveConversationId(newConv.id);
            setIsMobileOpen(false);
          }}
        />
      )}

      {activeCall && (
        <CallModal
          targetName={activeCall.targetName}
          isVideo={activeCall.isVideo}
          isIncoming={activeCall.isIncoming}
          onHangup={handleHangupCall}
          onAnswer={() => {
            wsClient.sendCallSignal({
              targetUserId: activeCall.targetUserId,
              signalType: 'answer',
              data: {},
            });
          }}
        />
      )}

      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onGranted={() => {
          notificationService.syncDeviceToken();
        }}
      />

      <NotificationToastContainer />
    </div>
  );
};
