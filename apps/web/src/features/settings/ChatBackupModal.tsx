import React, { useState } from 'react';
import { X, Database, Download, FileText, Check, RefreshCw, AlertCircle, Copy, Eye } from 'lucide-react';
import { Conversation, Message, User } from '@chat/shared-types';
import { settingsService } from '../../services/settings';
import { APP_NAME } from '../../config/appConfig';


interface ChatBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  conversations: Conversation[];
  messages: Message[];
}

export const ChatBackupModal: React.FC<ChatBackupModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  conversations,
  messages,
}) => {
  const [tab, setTab] = useState<'backup' | 'json_preview'>('backup');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [progress, setProgress] = useState(0);
  const [backupStats, setBackupStats] = useState(() => ({
    date: settingsService.getSettings().lastBackupDate,
    size: settingsService.getSettings().backupSize,
  }));
  const [copied, setCopied] = useState(false);
  const [serverBackup, setServerBackup] = useState<any>(null);

  React.useEffect(() => {
    if (isOpen) {
      settingsService.fetchServerBackup().then((data) => {
        if (data && data.conversations) {
          setServerBackup(data);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const generateBackupData = () => {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user: {
        id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        email: currentUser.email,
        phoneNumber: currentUser.phoneNumber,
      },
      summary: {
        totalConversations: conversations.length,
        totalMessages: messages.length,
      },
      conversations: conversations.map((conv) => ({
        id: conv.id,
        type: conv.type,
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        members: conv.members.map((m) => ({
          userId: m.userId,
          role: m.role,
          displayName: m.user?.displayName,
          username: m.user?.username,
        })),
        messages: messages
          .filter((m) => m.conversationId === conv.id)
          .map((m) => ({
            id: m.id,
            type: m.type,
            content: m.content,
            senderId: m.senderId,
            senderName: m.sender?.displayName || m.sender?.username,
            createdAt: m.createdAt,
            receipts: m.receipts,
          })),
      })),
    };
  };

  const backupData = serverBackup || generateBackupData();
  const jsonString = JSON.stringify(backupData, null, 2);

  const handleBackupNow = () => {
    setIsBackingUp(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBackingUp(false);
          const newStats = settingsService.performBackupNow();
          setBackupStats(newStats);
          return 100;
        }
        return prev + 20;
      });
    }, 180);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateTag = new Date().toISOString().split('T')[0];
    const prefix = APP_NAME.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.href = url;
    link.download = `${prefix}_chat_backup_${dateTag}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="settings-icon-badge badge-green">
              <Database size={20} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Chat Backup & Export</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Tab switch */}
        <div style={{ padding: '10px 20px 0', borderBottom: '1px solid var(--border-color)' }}>
          <div className="settings-tab-bar" style={{ marginBottom: '10px' }}>
            <button
              className={`settings-tab-btn ${tab === 'backup' ? 'active' : ''}`}
              onClick={() => setTab('backup')}
            >
              <Database size={16} /> Backup Status
            </button>
            <button
              className={`settings-tab-btn ${tab === 'json_preview' ? 'active' : ''}`}
              onClick={() => setTab('json_preview')}
            >
              <Eye size={16} /> Inspect JSON Data
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {tab === 'backup' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Backup Card */}
              <div className="backup-status-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div className="backup-disk-icon">
                    <Database size={24} color="#00a884" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Last Backup</h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {backupStats.date} • {backupStats.size}
                    </p>
                  </div>
                </div>

                {isBackingUp && (
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Compressing & archiving chats...</span>
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{progress}%</span>
                    </div>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
                  onClick={handleBackupNow}
                  disabled={isBackingUp}
                >
                  {isBackingUp ? (
                    <>
                      <RefreshCw size={18} className="spin" /> Backing up messages...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={18} /> Back Up Now
                    </>
                  )}
                </button>

                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
                  onClick={handleDownloadJson}
                >
                  <Download size={18} /> Export All Chats to JSON File
                </button>
              </div>

              {/* Info section */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Backup Information
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <span>Total conversations</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{conversations.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <span>Total messages archived</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{messages.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <span>Encryption standard</span>
                  <span style={{ color: '#00a884', fontWeight: 500 }}>End-to-end encrypted backup</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Raw JSON export payload ({conversations.length} chats)
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                    onClick={handleCopyJson}
                  >
                    {copied ? <Check size={14} color="#00a884" /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy JSON'}
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                    onClick={handleDownloadJson}
                  >
                    <Download size={14} /> Download
                  </button>
                </div>
              </div>

              <pre className="json-preview-box">
                {jsonString}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
