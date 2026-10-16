import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, Conversation } from '@chat/shared-types';
import { Search, X, Users, MessageSquarePlus, UserCheck } from 'lucide-react';

interface NewChatModalProps {
  currentUser: User;
  onClose: () => void;
  onConversationCreated: (conversation: Conversation) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  currentUser,
  onClose,
  onConversationCreated
}) => {
  const [activeTab, setActiveTab] = useState<'DIRECT' | 'GROUP'>('DIRECT');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [groupTitle, setGroupTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const results = await api.searchUsers(searchQuery);
        if (active) {
          setUsers(results.filter((u) => u.id !== currentUser.id));
        }
      } catch (e: unknown) {
        if (active && e instanceof Error) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    const timer = setTimeout(fetchUsers, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, currentUser.id]);

  const handleStartDirectChat = async (targetUser: User) => {
    try {
      const conv = await api.createConversation({
        type: 'DIRECT',
        participantIds: [targetUser.id]
      });
      onConversationCreated(conv);
      onClose();
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupTitle.trim() || selectedUserIds.length === 0) return;

    try {
      const conv = await api.createConversation({
        type: 'GROUP',
        title: groupTitle.trim(),
        participantIds: selectedUserIds
      });
      onConversationCreated(conv);
      onClose();
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    }
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn-secondary ${activeTab === 'DIRECT' ? 'active' : ''}`}
              style={{
                backgroundColor: activeTab === 'DIRECT' ? 'var(--bg-active)' : 'transparent',
                color: activeTab === 'DIRECT' ? 'var(--accent-primary)' : 'var(--text-secondary)'
              }}
              onClick={() => setActiveTab('DIRECT')}
            >
              Direct Chat
            </button>
            <button
              className={`btn-secondary ${activeTab === 'GROUP' ? 'active' : ''}`}
              style={{
                backgroundColor: activeTab === 'GROUP' ? 'var(--bg-active)' : 'transparent',
                color: activeTab === 'GROUP' ? 'var(--accent-primary)' : 'var(--text-secondary)'
              }}
              onClick={() => setActiveTab('GROUP')}
            >
              New Group
            </button>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
          {activeTab === 'GROUP' && (
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Group subject / title"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                required
              />
            </div>
          )}

          <div className="search-input-wrapper">
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search users by name, username, or phone"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div style={{ padding: '8px 16px', color: '#ff6b6b', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Searching users...
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No users found. Try registering another account in a private window!
            </div>
          ) : (
            users.map((u) => {
              const isSelected = selectedUserIds.includes(u.id);
              return (
                <div
                  key={u.id}
                  className="conversation-item"
                  onClick={() => {
                    if (activeTab === 'DIRECT') {
                      handleStartDirectChat(u);
                    } else {
                      toggleSelectUser(u.id);
                    }
                  }}
                  style={{
                    backgroundColor: isSelected ? 'var(--bg-active)' : 'transparent'
                  }}
                >
                  <div className={`avatar ${u.isOnline ? 'online' : ''}`}>
                    {u.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="conversation-content">
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      {u.displayName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      @{u.username} • {u.isOnline ? 'online' : 'offline'}
                    </div>
                  </div>
                  {activeTab === 'GROUP' && (
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      border: '2px solid var(--accent-primary)',
                      backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#111b21'
                    }}>
                      {isSelected && <UserCheck size={14} />}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {activeTab === 'GROUP' && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}>
            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%' }}
              disabled={!groupTitle.trim() || selectedUserIds.length === 0}
              onClick={handleCreateGroup}
            >
              Create Group ({selectedUserIds.length} members)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
