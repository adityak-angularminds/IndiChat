import React, { useState, useEffect, useRef } from 'react';
import { User, Conversation, Message } from '@chat/shared-types';
import { wsClient } from '../../services/websocket';
import { soundEffects } from '../../services/audio';
import {
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  ChevronLeft,
  Check,
  CheckCheck,
  Users
} from 'lucide-react';

interface ChatWindowProps {
  currentUser: User;
  conversation: Conversation | null;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onBackToSidebar: () => void;
  typingUsers: Record<string, boolean>; // userId -> isTyping
  onStartCall: (targetUserId: string, isVideo: boolean) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  currentUser,
  conversation,
  messages,
  onSendMessage,
  onBackToSidebar,
  typingUsers,
  onStartCall
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark incoming messages as read when opening conversation
  useEffect(() => {
    if (conversation) {
      messages.forEach((msg) => {
        if (msg.senderId !== currentUser.id) {
          const isRead = msg.receipts?.some((r) => r.userId === currentUser.id && r.readAt != null);
          if (!isRead) {
            wsClient.markRead(msg.id, conversation.id);
          }
        }
      });
    }
  }, [conversation?.id, messages.length, currentUser.id]);

  if (!conversation) {
    return (
      <main className="chat-area">
        <div className="empty-chat-state">
          <div className="empty-chat-icon">
            <Users size={48} />
          </div>
          <h1 className="empty-chat-title">WhatsApp Web</h1>
          <p className="empty-chat-desc">
            Send and receive real-time messages with end-to-end reliability.
            Select a conversation on the left or click the new chat button to begin.
          </p>
        </div>
      </main>
    );
  }

  const otherMember = conversation.type === 'DIRECT'
    ? conversation.members.find((m) => m.userId !== currentUser.id)
    : null;

  const chatTitle = conversation.type === 'GROUP'
    ? (conversation.title || 'Group')
    : (otherMember?.user?.displayName || otherMember?.user?.username || 'Chat');

  const isOtherOnline = otherMember?.user?.isOnline;
  const isTyping = otherMember ? typingUsers[otherMember.userId] : false;

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);

    // Typing debounce
    wsClient.sendTyping(conversation.id, true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      wsClient.sendTyping(conversation.id, false);
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    soundEffects.playOutgoingSent();
    setInputText('');
    wsClient.sendTyping(conversation.id, false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    setShowEmoji(false);
  };

  function formatMessageTime(isoStr: string): string {
    const date = new Date(isoStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function renderReceiptStatus(msg: Message) {
    if (msg.senderId !== currentUser.id) return null;
    const isRead = msg.receipts?.some((r) => r.readAt != null);
    const isDelivered = msg.receipts?.some((r) => r.deliveredAt != null);

    if (isRead) {
      return (
        <span title="Read">
          <CheckCheck size={14} className="receipt-icon read" />
        </span>
      );
    }
    if (isDelivered) {
      return (
        <span title="Delivered">
          <CheckCheck size={14} className="receipt-icon delivered" />
        </span>
      );
    }
    return (
      <span title="Sent">
        <Check size={14} className="receipt-icon sent" />
      </span>
    );
  }

  return (
    <main className="chat-area">
      {/* Chat Header */}
      <header className="chat-header">
        <div className="chat-header-info">
          <button className="icon-btn" onClick={onBackToSidebar} style={{ marginRight: '-4px' }} aria-label="Back">
            <ChevronLeft size={22} />
          </button>
          <div className={`avatar ${isOtherOnline ? 'online' : ''}`}>
            {conversation.type === 'GROUP' ? <Users size={20} /> : chatTitle.charAt(0).toUpperCase()}
          </div>
          <div className="chat-header-details">
            <h2 className="chat-header-name" style={{ margin: 0, fontSize: '1rem' }}>{chatTitle}</h2>
            {isTyping ? (
              <span className="chat-header-status typing">
                typing
                <span className="typing-dots">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </span>
              </span>
            ) : (
              <span className={`chat-header-status ${isOtherOnline ? 'online' : ''}`}>
                {conversation.type === 'GROUP'
                  ? `${conversation.members.length} participants`
                  : (isOtherOnline ? 'online' : 'offline')}
              </span>
            )}
          </div>
        </div>

        <div className="sidebar-actions">
          {otherMember && (
            <>
              <button
                className="icon-btn"
                onClick={() => onStartCall(otherMember.userId, false)}
                title="Audio Call"
                aria-label="Audio Call"
              >
                <Phone size={19} />
              </button>
              <button
                className="icon-btn"
                onClick={() => onStartCall(otherMember.userId, true)}
                title="Video Call"
                aria-label="Video Call"
              >
                <Video size={20} />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="messages-container">
        <div className="message-date-separator">TODAY</div>

        {messages.map((msg) => {
          const isOutgoing = msg.senderId === currentUser.id;

          return (
            <div
              key={msg.id || msg.clientMessageId}
              className={`message-row ${isOutgoing ? 'outgoing' : 'incoming'}`}
            >
              <div className={`message-bubble ${isOutgoing ? 'outgoing' : 'incoming'}`}>
                {!isOutgoing && conversation.type === 'GROUP' && (
                  <div className="message-sender-name">
                    {msg.sender?.displayName || msg.sender?.username}
                  </div>
                )}
                <span className="message-text">{msg.content}</span>
                <div className="message-meta">
                  <span className="message-time">{formatMessageTime(msg.createdAt)}</span>
                  {renderReceiptStatus(msg)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker Popup */}
      {showEmoji && (
        <div style={{
          position: 'absolute',
          bottom: '70px',
          left: '20px',
          backgroundColor: 'var(--bg-chat-header)',
          borderRadius: '12px',
          padding: '12px',
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '8px',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 100,
          border: '1px solid var(--border-color)'
        }}>
          {['😀', '😂', '😍', '👍', '❤️', '🔥', '🎉', '🙏', '🚀', '✨', '👋', '😎'].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              style={{
                fontSize: '1.4rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px'
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="chat-input-bar">
        <button
          className="icon-btn"
          onClick={() => setShowEmoji(!showEmoji)}
          title="Emojis"
          aria-label="Emojis"
        >
          <Smile size={22} />
        </button>
        <button
          className="icon-btn"
          title="Attach media or document"
          aria-label="Attach"
          onClick={() => alert('Media attachments ready for S3 / MinIO pre-signed URL upload.')}
        >
          <Paperclip size={20} />
        </button>

        <div className="input-box-wrapper">
          <textarea
            className="chat-textarea"
            placeholder="Type a message"
            rows={1}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
        </div>

        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!inputText.trim()}
          title="Send"
          aria-label="Send Message"
        >
          <Send size={18} />
        </button>
      </div>
    </main>
  );
};
