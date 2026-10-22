import React, { useState } from 'react';
import {
  CornerDownLeft,
  Image,
  Type,
  Database,
  History,
  Download,
  Trash2,
  ChevronRight,
  Check,
  AlertTriangle
} from 'lucide-react';
import { Conversation, Message, User } from '@chat/shared-types';
import { AppSettings, FontSizeOption, settingsService } from '../../services/settings';
import { ChatBackupModal } from './ChatBackupModal';

interface ChatsSettingsViewProps {
  currentUser: User;
  conversations: Conversation[];
  messages: Message[];
  settings: AppSettings;
  onClearAllMessages?: () => void;
  onDeleteAllChats?: () => void;
}

export const ChatsSettingsView: React.FC<ChatsSettingsViewProps> = ({
  currentUser,
  conversations,
  messages,
  settings,
  onClearAllMessages,
  onDeleteAllChats,
}) => {
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showFontSizeModal, setShowFontSizeModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const handleToggleEnterIsSend = (checked: boolean) => {
    settingsService.update({ enterIsSend: checked });
  };

  const handleToggleMediaVisibility = (checked: boolean) => {
    settingsService.update({ mediaVisibility: checked });
  };

  const handleSelectFontSize = (size: FontSizeOption) => {
    settingsService.update({ fontSize: size });
    setShowFontSizeModal(false);
  };

  const formatFontSizeLabel = (size: FontSizeOption): string => {
    switch (size) {
      case 'small':
        return 'Small';
      case 'medium':
        return 'Medium (Default)';
      case 'large':
        return 'Large';
    }
  };

  const handleClearMessages = () => {
    if (confirm('Are you sure you want to clear all messages from your chats? This action cannot be undone.')) {
      if (onClearAllMessages) onClearAllMessages();
      setShowHistoryModal(false);
      alert('All chat messages have been cleared.');
    }
  };

  const handleDeleteChats = () => {
    if (confirm('Are you sure you want to delete all chats and conversations? All chat history will be removed.')) {
      if (onDeleteAllChats) onDeleteAllChats();
      setShowHistoryModal(false);
      alert('All chats have been deleted.');
    }
  };

  return (
    <div className="settings-subview">
      {/* 1. Chat settings */}
      <div className="settings-section">
        <div className="settings-section-title">
          <span>Chat settings</span>
        </div>

        <div className="settings-list-group">
          {/* Enter is send */}
          <div className="settings-item" style={{ cursor: 'default' }}>
            <div className="settings-icon-badge badge-amber">
              <CornerDownLeft size={20} />
            </div>
            <div className="settings-item-content">
              <span className="settings-item-title">Enter is send</span>
              <span className="settings-item-subtitle">
                Enter key will send your message (Shift + Enter for new line)
              </span>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={settings.enterIsSend}
                onChange={(e) => handleToggleEnterIsSend(e.target.checked)}
              />
              <span className="settings-slider" />
            </label>
          </div>

          {/* Media visibility */}
          <div className="settings-item" style={{ cursor: 'default' }}>
            <div className="settings-icon-badge badge-amber">
              <Image size={20} />
            </div>
            <div className="settings-item-content">
              <span className="settings-item-title">Media visibility</span>
              <span className="settings-item-subtitle">
                Show newly downloaded media in your device's gallery
              </span>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={settings.mediaVisibility}
                onChange={(e) => handleToggleMediaVisibility(e.target.checked)}
              />
              <span className="settings-slider" />
            </label>
          </div>

          {/* Font size */}
          <div className="settings-item" onClick={() => setShowFontSizeModal(true)}>
            <div className="settings-icon-badge badge-amber">
              <Type size={20} />
            </div>
            <div className="settings-item-content">
              <div className="settings-item-header">
                <span className="settings-item-title">Font size</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                  {formatFontSizeLabel(settings.fontSize)}
                </span>
              </div>
              <span className="settings-item-subtitle">
                Adjust the font scale of chat messages
              </span>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </div>
        </div>
      </div>

      {/* 2. Chat backup and history */}
      <div className="settings-section">
        <div className="settings-section-title">
          <span>Archiving & storage</span>
        </div>

        <div className="settings-list-group">
          {/* Chat backup */}
          <div className="settings-item" onClick={() => setShowBackupModal(true)}>
            <div className="settings-icon-badge badge-green">
              <Database size={20} />
            </div>
            <div className="settings-item-content">
              <div className="settings-item-header">
                <span className="settings-item-title">Chat backup</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {settings.lastBackupDate}
                </span>
              </div>
              <span className="settings-item-subtitle">
                Back up all chat messages and export as JSON file
              </span>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </div>

          {/* Chat history */}
          <div className="settings-item" onClick={() => setShowHistoryModal(true)}>
            <div className="settings-icon-badge badge-amber">
              <History size={20} />
            </div>
            <div className="settings-item-content">
              <span className="settings-item-title">Chat history</span>
              <span className="settings-item-subtitle">
                Export chat, clear messages, or delete all chats
              </span>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </div>
        </div>
      </div>

      {/* Font Size Modal */}
      {showFontSizeModal && (
        <div className="modal-overlay" onClick={() => setShowFontSizeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Font Size</h3>
              <button className="icon-btn" onClick={() => setShowFontSizeModal(false)}>
                <Check size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '16px 20px' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Select preferred text scaling for conversations:
              </p>

              <div className="settings-radio-group">
                <div
                  className="settings-radio-row"
                  onClick={() => handleSelectFontSize('small')}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Small</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Compact 13.5px layout</span>
                  </div>
                  <div className={`settings-radio-circle ${settings.fontSize === 'small' ? 'selected' : ''}`}>
                    {settings.fontSize === 'small' && <div className="settings-radio-inner" />}
                  </div>
                </div>

                <div
                  className="settings-radio-row"
                  onClick={() => handleSelectFontSize('medium')}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>Medium (Recommended)</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Standard 14.5px layout</span>
                  </div>
                  <div className={`settings-radio-circle ${settings.fontSize === 'medium' ? 'selected' : ''}`}>
                    {settings.fontSize === 'medium' && <div className="settings-radio-inner" />}
                  </div>
                </div>

                <div
                  className="settings-radio-row"
                  onClick={() => handleSelectFontSize('large')}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 500 }}>Large</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enlarged 16.5px layout</span>
                  </div>
                  <div className={`settings-radio-circle ${settings.fontSize === 'large' ? 'selected' : ''}`}>
                    {settings.fontSize === 'large' && <div className="settings-radio-inner" />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat History Actions Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Chat History</h3>
              <button className="icon-btn" onClick={() => setShowHistoryModal(false)}>
                <Check size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                className="settings-item"
                onClick={() => {
                  setShowHistoryModal(false);
                  setShowBackupModal(true);
                }}
              >
                <div className="settings-icon-badge badge-green">
                  <Download size={18} />
                </div>
                <div className="settings-item-content">
                  <span className="settings-item-title">Export all chat history</span>
                  <span className="settings-item-subtitle">Download JSON archive of all chats and media info</span>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>

              <div
                className="settings-item"
                style={{ color: '#f59e0b' }}
                onClick={handleClearMessages}
              >
                <div className="settings-icon-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                  <Trash2 size={18} />
                </div>
                <div className="settings-item-content">
                  <span className="settings-item-title" style={{ color: '#f59e0b' }}>Clear all messages</span>
                  <span className="settings-item-subtitle">Delete messages inside chats but keep chats in list</span>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>

              <div
                className="settings-item"
                style={{ color: 'var(--accent-danger)' }}
                onClick={handleDeleteChats}
              >
                <div className="settings-icon-badge badge-red">
                  <AlertTriangle size={18} />
                </div>
                <div className="settings-item-content">
                  <span className="settings-item-title" style={{ color: 'var(--accent-danger)' }}>Delete all chats</span>
                  <span className="settings-item-subtitle">Delete all conversation threads and message history</span>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Backup & JSON Export Modal */}
      <ChatBackupModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        currentUser={currentUser}
        conversations={conversations}
        messages={messages}
      />
    </div>
  );
};
