import React, { useState } from 'react';
import { X, Search, Check, UserX } from 'lucide-react';
import { Conversation, User } from '@chat/shared-types';

interface ExcludeContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  conversations: Conversation[];
  currentUser: User;
  excludedIds: string[];
  onSave: (excludedIds: string[]) => void;
}

export const ExcludeContactsModal: React.FC<ExcludeContactsModalProps> = ({
  isOpen,
  onClose,
  title,
  conversations,
  currentUser,
  excludedIds,
  onSave,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(excludedIds || []);
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  // Extract unique contacts from direct conversations
  const contacts = conversations
    .flatMap((c) => c.members)
    .filter((m) => m.userId !== currentUser.id && m.user)
    .map((m) => m.user as User)
    .filter((user, index, self) => index === self.findIndex((u) => u.id === user.id));

  // Fallback sample contacts if conversation list has few members
  const sampleContacts: { id: string; displayName: string; username: string }[] = [
    { id: 'usr-1', displayName: 'Alex Morgan', username: 'alex_m' },
    { id: 'usr-2', displayName: 'Sarah Jenkins', username: 'sarah_j' },
    { id: 'usr-3', displayName: 'David Kumar', username: 'david_k' },
    { id: 'usr-4', displayName: 'Emma Watson', username: 'emma_w' },
    { id: 'usr-5', displayName: 'Michael Chang', username: 'm_chang' },
  ];

  const allAvailableContacts = contacts.length > 0 ? contacts : sampleContacts;

  const filteredContacts = allAvailableContacts.filter((c) =>
    (c.displayName || c.username).toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === allAvailableContacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allAvailableContacts.map((c) => c.id));
    }
  };

  const handleDone = () => {
    onSave(selectedIds);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="settings-icon-badge badge-red">
              <UserX size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{title}</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-danger)' }}>
                {selectedIds.length} contact{selectedIds.length === 1 ? '' : 's'} excluded
              </span>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Search & Select All */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '8px' }}>
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '6px 10px', whiteSpace: 'nowrap' }}
            onClick={handleSelectAll}
          >
            {selectedIds.length === allAvailableContacts.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {/* Contact list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {filteredContacts.map((c) => {
            const isSelected = selectedIds.includes(c.id);
            return (
              <div
                key={c.id}
                className="settings-contact-row"
                onClick={() => toggleSelect(c.id)}
              >
                <div className="avatar" style={{ width: '38px', height: '38px', fontSize: '0.9rem' }}>
                  {c.displayName ? c.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {c.displayName}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    @{c.username}
                  </span>
                </div>
                <div className={`settings-checkbox ${isSelected ? 'checked' : ''}`}>
                  {isSelected && <Check size={14} strokeWidth={3} color="#ffffff" />}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleDone}>
            <Check size={16} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
