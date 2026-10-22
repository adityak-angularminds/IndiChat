import React, { useState } from 'react';
import {
  Lock,
  Eye,
  User,
  Link,
  Radio,
  CheckCheck,
  ChevronRight,
  Shield,
  Check,
  UserX,
  X
} from 'lucide-react';
import { Conversation, User as UserType } from '@chat/shared-types';
import { AppSettings, PrivacyOption, OnlinePrivacyOption, settingsService } from '../../services/settings';
import { ExcludeContactsModal } from './ExcludeContactsModal';

interface PrivacyViewProps {
  currentUser: UserType;
  conversations: Conversation[];
  settings: AppSettings;
}

type PrivacyCategory = 'last_seen' | 'profile_photo' | 'links' | 'status' | null;

export const PrivacyView: React.FC<PrivacyViewProps> = ({
  currentUser,
  conversations,
  settings,
}) => {
  const [activeModal, setActiveModal] = useState<PrivacyCategory>(null);
  const [showExcludeModal, setShowExcludeModal] = useState(false);
  const [excludeTargetTitle, setExcludeTargetTitle] = useState('');

  const formatOptionLabel = (opt: PrivacyOption): string => {
    switch (opt) {
      case 'everyone':
        return 'Everyone';
      case 'contacts':
        return 'My contacts';
      case 'contacts_except':
        const count = settings.privacyExcludedContacts?.length || 0;
        return count > 0 ? `My contacts except (${count})` : 'My contacts except...';
      case 'nobody':
        return 'Nobody';
    }
  };

  const formatOnlineLabel = (opt: OnlinePrivacyOption): string => {
    return opt === 'everyone' ? 'Everyone' : 'Same as last seen';
  };

  const handleSelectOption = (category: PrivacyCategory, opt: PrivacyOption) => {
    if (opt === 'contacts_except') {
      const titles: Record<string, string> = {
        last_seen: 'Hide Last Seen From...',
        profile_photo: 'Hide Profile Photo From...',
        links: 'Hide About & Links From...',
        status: 'Hide Status From...',
      };
      setExcludeTargetTitle(titles[category || 'last_seen']);
      setShowExcludeModal(true);
    }

    switch (category) {
      case 'last_seen':
        settingsService.update({ privacyLastSeen: opt });
        break;
      case 'profile_photo':
        settingsService.update({ privacyProfilePhoto: opt });
        break;
      case 'links':
        settingsService.update({ privacyLinks: opt });
        break;
      case 'status':
        settingsService.update({ privacyStatus: opt });
        break;
    }
  };

  const handleSelectOnline = (opt: OnlinePrivacyOption) => {
    settingsService.update({ privacyOnline: opt });
  };

  const handleToggleReadReceipts = (checked: boolean) => {
    settingsService.update({ readReceipts: checked });
  };

  const renderRadioRow = (
    label: string,
    isSelected: boolean,
    onSelect: () => void,
    subtitle?: string
  ) => (
    <div
      className="settings-radio-row"
      onClick={onSelect}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '0.92rem', fontWeight: 500, color: 'var(--text-primary)' }}>
          {label}
        </span>
        {subtitle && (
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {subtitle}
          </span>
        )}
      </div>
      <div className={`settings-radio-circle ${isSelected ? 'selected' : ''}`}>
        {isSelected && <div className="settings-radio-inner" />}
      </div>
    </div>
  );

  return (
    <div className="settings-subview">
      {/* 1. Who can see my personal info */}
      <div className="settings-section">
        <div className="settings-section-title">
          <span>Who can see my personal info</span>
        </div>

        <div className="settings-list-group">
          {/* Last seen and online */}
          <div className="settings-item" onClick={() => setActiveModal('last_seen')}>
            <div className="settings-icon-badge badge-teal">
              <Eye size={20} />
            </div>
            <div className="settings-item-content">
              <span className="settings-item-title">Last seen and online</span>
              <span className="settings-item-subtitle">
                {formatOptionLabel(settings.privacyLastSeen)} • {formatOnlineLabel(settings.privacyOnline)}
              </span>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </div>

          {/* Profile picture */}
          <div className="settings-item" onClick={() => setActiveModal('profile_photo')}>
            <div className="settings-icon-badge badge-teal">
              <User size={20} />
            </div>
            <div className="settings-item-content">
              <span className="settings-item-title">Profile picture</span>
              <span className="settings-item-subtitle">
                {formatOptionLabel(settings.privacyProfilePhoto)}
              </span>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </div>

          {/* Links / About */}
          <div className="settings-item" onClick={() => setActiveModal('links')}>
            <div className="settings-icon-badge badge-teal">
              <Link size={20} />
            </div>
            <div className="settings-item-content">
              <span className="settings-item-title">About & links</span>
              <span className="settings-item-subtitle">
                {formatOptionLabel(settings.privacyLinks)}
              </span>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </div>

          {/* Status */}
          <div className="settings-item" onClick={() => setActiveModal('status')}>
            <div className="settings-icon-badge badge-teal">
              <Radio size={20} />
            </div>
            <div className="settings-item-content">
              <span className="settings-item-title">Status</span>
              <span className="settings-item-subtitle">
                {formatOptionLabel(settings.privacyStatus)}
              </span>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </div>
        </div>
      </div>

      {/* 2. Read receipts */}
      <div className="settings-section">
        <div className="settings-section-title">
          <span>Read receipts & privacy</span>
        </div>

        <div className="settings-list-group">
          <div className="settings-item" style={{ cursor: 'default' }}>
            <div className="settings-icon-badge badge-teal">
              <CheckCheck size={20} />
            </div>
            <div className="settings-item-content">
              <span className="settings-item-title">Read receipts</span>
              <span className="settings-item-subtitle" style={{ lineHeight: '1.4' }}>
                If turned off, you won't send or receive read receipts. Read receipts are always sent for group chats.
              </span>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={settings.readReceipts}
                onChange={(e) => handleToggleReadReceipts(e.target.checked)}
              />
              <span className="settings-slider" />
            </label>
          </div>
        </div>
      </div>

      <div className="settings-footer-note">
        <Shield size={16} color="#00a884" style={{ flexShrink: 0 }} />
        <span>You can control who sees your activity. Disabling last seen also disables seeing other users' last seen.</span>
      </div>

      {/* Modal for Privacy Selection */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                {activeModal === 'last_seen' && 'Last Seen and Online'}
                {activeModal === 'profile_photo' && 'Profile Picture'}
                {activeModal === 'links' && 'About & Links'}
                {activeModal === 'status' && 'Status Privacy'}
              </h3>
              <button className="icon-btn" onClick={() => setActiveModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '16px 20px' }}>
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {activeModal === 'last_seen' ? 'Who can see my last seen' : 'Who can see this'}
                </span>
              </div>

              <div className="settings-radio-group">
                {renderRadioRow(
                  'Everyone',
                  (activeModal === 'last_seen' && settings.privacyLastSeen === 'everyone') ||
                  (activeModal === 'profile_photo' && settings.privacyProfilePhoto === 'everyone') ||
                  (activeModal === 'links' && settings.privacyLinks === 'everyone') ||
                  (activeModal === 'status' && settings.privacyStatus === 'everyone'),
                  () => handleSelectOption(activeModal, 'everyone')
                )}

                {renderRadioRow(
                  'My contacts',
                  (activeModal === 'last_seen' && settings.privacyLastSeen === 'contacts') ||
                  (activeModal === 'profile_photo' && settings.privacyProfilePhoto === 'contacts') ||
                  (activeModal === 'links' && settings.privacyLinks === 'contacts') ||
                  (activeModal === 'status' && settings.privacyStatus === 'contacts'),
                  () => handleSelectOption(activeModal, 'contacts')
                )}

                {renderRadioRow(
                  settings.privacyExcludedContacts?.length > 0
                    ? `My contacts except (${settings.privacyExcludedContacts.length})`
                    : 'My contacts except...',
                  (activeModal === 'last_seen' && settings.privacyLastSeen === 'contacts_except') ||
                  (activeModal === 'profile_photo' && settings.privacyProfilePhoto === 'contacts_except') ||
                  (activeModal === 'links' && settings.privacyLinks === 'contacts_except') ||
                  (activeModal === 'status' && settings.privacyStatus === 'contacts_except'),
                  () => handleSelectOption(activeModal, 'contacts_except'),
                  'Exclude specific contacts from viewing'
                )}

                {renderRadioRow(
                  'Nobody',
                  (activeModal === 'last_seen' && settings.privacyLastSeen === 'nobody') ||
                  (activeModal === 'profile_photo' && settings.privacyProfilePhoto === 'nobody') ||
                  (activeModal === 'links' && settings.privacyLinks === 'nobody') ||
                  (activeModal === 'status' && settings.privacyStatus === 'nobody'),
                  () => handleSelectOption(activeModal, 'nobody')
                )}
              </div>

              {/* Online section for last_seen */}
              {activeModal === 'last_seen' && (
                <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Who can see when I'm online
                    </span>
                  </div>

                  <div className="settings-radio-group">
                    {renderRadioRow(
                      'Everyone',
                      settings.privacyOnline === 'everyone',
                      () => handleSelectOnline('everyone')
                    )}
                    {renderRadioRow(
                      'Same as last seen',
                      settings.privacyOnline === 'same_as_last_seen',
                      () => handleSelectOnline('same_as_last_seen')
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveModal(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exclude Contacts Modal */}
      <ExcludeContactsModal
        isOpen={showExcludeModal}
        onClose={() => setShowExcludeModal(false)}
        title={excludeTargetTitle || 'Exclude Contacts'}
        conversations={conversations}
        currentUser={currentUser}
        excludedIds={settings.privacyExcludedContacts}
        onSave={(newExcluded) => {
          settingsService.update({ privacyExcludedContacts: newExcluded });
        }}
      />
    </div>
  );
};
