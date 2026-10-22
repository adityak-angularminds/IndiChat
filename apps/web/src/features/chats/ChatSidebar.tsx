import React, { useState } from 'react';
import { User, Conversation, Message } from '@chat/shared-types';
import {
  MessageSquarePlus,
  Search,
  LogOut,
  Sun,
  Moon,
  Check,
  CheckCheck,
  Users,
  Bell,
  BellRing,
  BellOff,
  X,
  Settings
} from 'lucide-react';
import { notificationService, NotificationPermissionStatus } from '../../services/notifications';
import { SettingsView, SettingsSubView } from '../settings/SettingsView';

interface ChatSidebarProps {
  currentUser: User;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onOpenNewChat: () => void;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  isMobileOpen: boolean;
  messages?: Message[];
  onUpdateUser?: (updated: Partial<User>) => void;
  onClearAllMessages?: () => void;
  onDeleteAllChats?: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  currentUser,
  conversations,
  activeConversationId,
  onSelectConversation,
  onOpenNewChat,
  onLogout,
  theme,
  onToggleTheme,
  isMobileOpen,
  messages = [],
  onUpdateUser,
  onClearAllMessages,
  onDeleteAllChats,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsSubView, setSettingsSubView] = useState<SettingsSubView>('menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermissionStatus>(() =>
    notificationService.getPermissionStatus()
  );

  const handleToggleNotifications = async () => {
    if (!notificationService.isSupported()) {
      alert('Desktop notifications are not supported in this browser.');
      return;
    }

    if (notificationStatus === 'granted') {
      notificationService.showNotification('WhatsApp Notifications', {
        body: 'Push notifications are enabled and active!',
        username: currentUser.username || currentUser.displayName,
      });
      return;
    }

    if (notificationStatus === 'denied') {
      alert('Notifications are blocked in your browser settings. Please enable notifications for this site to receive message alerts.');
      return;
    }

    const res = await notificationService.requestPermission();
    setNotificationStatus(res);
    if (res === 'granted') {
      notificationService.showNotification('WhatsApp Notifications Active', {
        body: 'You will now receive desktop alerts for incoming messages.',
        username: currentUser.username || currentUser.displayName,
      });
    }
  };


  const filteredConversations = conversations.filter((c) => {
    const title = getConversationTitle(c, currentUser.id).toLowerCase();
    const query = searchQuery.toLowerCase();
    return title.includes(query);
  });

  function getConversationTitle(c: Conversation, currentUserId: string): string {
    if (c.type === 'GROUP' && c.title) return c.title;
    const otherMember = c.members.find((m) => m.userId !== currentUserId);
    return otherMember?.user?.displayName || otherMember?.user?.username || 'Chat';
  }

  function getOtherMember(c: Conversation, currentUserId: string) {
    if (c.type === 'GROUP') return null;
    return c.members.find((m) => m.userId !== currentUserId);
  }

  function formatTime(isoStr?: string): string {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function renderReceipt(lastMsg: Conversation['lastMessage']) {
    if (!lastMsg || lastMsg.senderId !== currentUser.id) return null;
    const isRead = lastMsg.receipts?.some((r) => r.readAt != null);
    const isDelivered = lastMsg.receipts?.some((r) => r.deliveredAt != null);

    if (isRead) {
      return <CheckCheck size={15} className="receipt-icon read" />;
    }
    if (isDelivered) {
      return <CheckCheck size={15} className="receipt-icon delivered" />;
    }
    return <Check size={15} className="receipt-icon sent" />;
  }

  function renderMessageSnippet(msg: Conversation['lastMessage']): string {
    if (!msg) return 'No messages yet';
    if (msg.type === 'STICKER') {
      return '🏷️ Sticker';
    }
    if (msg.type === 'IMAGE') {
      try {
        const data = JSON.parse(msg.content);
        if (data.isGif || data.fileName?.toLowerCase().endsWith('.gif') || data.fileUrl?.toLowerCase().includes('.gif')) {
          return '🎞️ GIF';
        }
        return data.caption ? `📷 ${data.caption}` : '📷 Photo';
      } catch {
        if (msg.content?.toLowerCase().includes('.gif')) {
          return '🎞️ GIF';
        }
        return '📷 Photo';
      }
    }
    if (msg.type === 'VIDEO') {
      try {
        const data = JSON.parse(msg.content);
        return data.caption ? `🎥 ${data.caption}` : '🎥 Video';
      } catch {
        return '🎥 Video';
      }
    }
    if (msg.type === 'AUDIO') {
      return '🎵 Audio';
    }
    if (msg.type === 'DOCUMENT') {
      try {
        const data = JSON.parse(msg.content);
        return `📄 ${data.fileName || 'Document'}`;
      } catch {
        return '📄 Document';
      }
    }
    return msg.content || '';
  }

  if (isSettingsOpen) {
    return (
      <aside className={`sidebar ${!isMobileOpen ? 'collapsed' : ''}`}>
        <SettingsView
          currentUser={currentUser}
          conversations={conversations}
          messages={messages}
          onClose={() => setIsSettingsOpen(false)}
          onLogout={onLogout}
          onUpdateUser={onUpdateUser}
          onClearAllMessages={onClearAllMessages}
          onDeleteAllChats={onDeleteAllChats}
          initialSubView={settingsSubView}
        />
      </aside>
    );
  }

  return (
    <aside className={`sidebar ${!isMobileOpen ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div
          className="sidebar-user"
          title={`${currentUser.displayName} — Click for Settings`}
          onClick={() => {
            setSettingsSubView('menu');
            setIsSettingsOpen(true);
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="avatar online">
            {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{currentUser.displayName}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{currentUser.username}</span>
          </div>
        </div>

        <div className="sidebar-actions">
          <button
            className={`icon-btn ${notificationStatus === 'granted' ? 'active-accent' : ''}`}
            onClick={handleToggleNotifications}
            title={
              notificationStatus === 'granted'
                ? 'Notifications Enabled (Click to test)'
                : notificationStatus === 'denied'
                ? 'Notifications Blocked in Browser'
                : 'Enable Desktop Notifications'
            }
            aria-label="Toggle Notifications"
          >
            {notificationStatus === 'granted' ? (
              <BellRing size={20} color="#00a884" />
            ) : notificationStatus === 'denied' ? (
              <BellOff size={20} color="#ea4335" />
            ) : (
              <Bell size={20} />
            )}
          </button>
          <button
            className="icon-btn"
            onClick={() => {
              setSettingsSubView('menu');
              setIsSettingsOpen(true);
            }}
            title="Settings"
            aria-label="Settings"
            id="sidebar-settings-btn"
          >
            <Settings size={20} />
          </button>
          <button className="icon-btn" onClick={onOpenNewChat} title="New Chat or Group" aria-label="New Chat">
            <MessageSquarePlus size={20} />
          </button>
          <button className="icon-btn" onClick={onToggleTheme} title="Toggle Theme" aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="icon-btn" onClick={onLogout} title="Sign Out" aria-label="Sign Out">
            <LogOut size={19} />
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notificationStatus === 'default' && !notificationService.isDismissed() && (
        <div className="sidebar-notification-banner" onClick={handleToggleNotifications}>
          <div className="sidebar-notification-banner-icon">
            <BellRing size={20} color="#00a884" />
          </div>
          <div className="sidebar-notification-banner-content">
            <span className="sidebar-notification-banner-title">Get notified of new messages</span>
            <span className="sidebar-notification-banner-link">
              Turn on desktop notifications &gt;
            </span>
          </div>
          <button
            className="sidebar-notification-banner-close"
            onClick={(e) => {
              e.stopPropagation();
              notificationService.setDismissed(true);
              setNotificationStatus(notificationService.getPermissionStatus());
            }}
            aria-label="Dismiss banner"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="sidebar-search">
        <div className="search-input-wrapper">
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="conversation-list">
        {filteredConversations.length === 0 ? (
          <div style={{
            padding: '32px 16px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem'
          }}>
            {searchQuery ? 'No chats found matching your search.' : (
              <div>
                <p>No conversations yet.</p>
                <button
                  className="btn-primary"
                  style={{ marginTop: '12px', padding: '8px 16px', fontSize: '0.85rem' }}
                  onClick={onOpenNewChat}
                >
                  Start a Chat
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const title = getConversationTitle(conv, currentUser.id);
            const other = getOtherMember(conv, currentUser.id);
            const isOnline = other?.user?.isOnline;
            const isActive = conv.id === activeConversationId;
            const unread = conv.unreadCount || 0;

            return (
              <div
                key={conv.id}
                className={`conversation-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectConversation(conv.id)}
              >
                <div className={`avatar ${isOnline ? 'online' : ''}`}>
                  {conv.type === 'GROUP' ? <Users size={20} /> : title.charAt(0).toUpperCase()}
                </div>

                <div className="conversation-content">
                  <div className="conversation-row">
                    <span className="conversation-title">{title}</span>
                    <span className="conversation-time">
                      {formatTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                    </span>
                  </div>

                  <div className="conversation-subtitle">
                    <div className="last-message-snippet">
                      {renderReceipt(conv.lastMessage)}
                      <span>
                        {renderMessageSnippet(conv.lastMessage)}
                      </span>
                    </div>

                    {unread > 0 && (
                      <span className="badge-unread">{unread}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
