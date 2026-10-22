import React, { useState } from 'react';
import {
  Fingerprint,
  Lock,
  Mail,
  ShieldCheck,
  Bell,
  AtSign,
  Phone,
  LogOut,
  ChevronRight,
  Check,
  AlertCircle,
  Edit2
} from 'lucide-react';
import { User } from '@chat/shared-types';
import { AppSettings, settingsService } from '../../services/settings';
import { api } from '../../services/api';
import { ChangePasswordModal } from './ChangePasswordModal';
import { ChangePhoneModal } from './ChangePhoneModal';
import { PasskeyModal } from './PasskeyModal';
import { TwoFactorModal } from './TwoFactorModal';
import { APP_NAME } from '../../config/appConfig';


interface AccountViewProps {
  currentUser: User;
  settings: AppSettings;
  onLogout: () => void;
  onUpdateUser?: (updated: Partial<User>) => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  currentUser,
  settings,
  onLogout,
  onUpdateUser,
}) => {
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  // Email modal state
  const [emailInput, setEmailInput] = useState(currentUser.email || settings.email || 'user@example.com');
  // Username modal state
  const [usernameInput, setUsernameInput] = useState(currentUser.username || '');

  const handleToggleSecurityNotifs = (checked: boolean) => {
    settingsService.update({ securityNotifications: checked });
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();
    if (!cleanEmail) return;
    try {
      await api.updateProfile({ email: cleanEmail });
      settingsService.update({ email: cleanEmail, emailVerified: true });
      if (onUpdateUser) onUpdateUser({ email: cleanEmail });
      setShowEmailModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update email');
    }
  };

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    const clean = usernameInput.trim().replace(/^@/, '').toLowerCase();
    try {
      await api.updateProfile({ username: clean });
      settingsService.update({ username: clean });
      if (onUpdateUser) onUpdateUser({ username: clean });
      setShowUsernameModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update username');
    }
  };

  const displayPhone = currentUser.phoneNumber || settings.phoneNumber || '+91 98765 43210';
  const displayEmail = currentUser.email || settings.email || 'user@example.com';
  const displayUsername = currentUser.username || settings.username || 'username';

  return (
    <div className="settings-subview">
      {/* 1. Login and Security Section */}
      <div className="settings-section">
        <div className="settings-section-title">
          <span>Login and security</span>
        </div>

        <div className="settings-list-group">
          {/* Passkeys */}
          <div className="settings-item" onClick={() => setShowPasskeyModal(true)}>
            <div className="settings-icon-badge badge-blue">
              <Fingerprint size={20} />
            </div>
            <div className="settings-item-content">
              <div className="settings-item-header">
                <span className="settings-item-title">Passkeys</span>
                <span className={`settings-status-badge ${settings.passkeyEnabled ? 'badge-active' : ''}`}>
                  {settings.passkeyEnabled ? 'Active' : 'Setup'}
                </span>
              </div>
              <span className="settings-item-subtitle">
                Log in passwordlessly with fingerprint or screen lock
              </span>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </div>

          {/* Password */}
          <div className="settings-item" onClick={() => setShowPasswordModal(true)}>
            <div className="settings-icon-badge badge-blue">
              <Lock size={20} />
            </div>
            <div className="settings-item-content">
              <span className="settings-item-title">Password</span>
              <span className="settings-item-subtitle">Change your account password</span>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </div>

          {/* Email Address */}
          <div className="settings-item" onClick={() => setShowEmailModal(true)}>
            <div className="settings-icon-badge badge-blue">
              <Mail size={20} />
            </div>
            <div className="settings-item-content">
              <div className="settings-item-header">
                <span className="settings-item-title">Email address</span>
                {settings.emailVerified && (
                  <span className="settings-status-badge badge-active">
                    <Check size={12} strokeWidth={3} /> Verified
                  </span>
                )}
              </div>
              <span className="settings-item-subtitle">{displayEmail}</span>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </div>

          {/* Two-step verification */}
          <div className="settings-item" onClick={() => setShowTwoFactorModal(true)}>
            <div className="settings-icon-badge badge-blue">
              <ShieldCheck size={20} />
            </div>
            <div className="settings-item-content">
              <div className="settings-item-header">
                <span className="settings-item-title">Two-step verification</span>
                <span className={`settings-status-badge ${settings.twoFactorEnabled ? 'badge-active' : ''}`}>
                  {settings.twoFactorEnabled ? 'On' : 'Off'}
                </span>
              </div>
              <span className="settings-item-subtitle">
                Require a 6-digit PIN when registering your number again
              </span>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </div>

          {/* Security notifications */}
          <div className="settings-item" style={{ cursor: 'default' }}>
            <div className="settings-icon-badge badge-blue">
              <Bell size={20} />
            </div>
            <div className="settings-item-content">
              <span className="settings-item-title">Security notifications</span>
              <span className="settings-item-subtitle">
                Get notified on this device when security code changes
              </span>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={settings.securityNotifications}
                onChange={(e) => handleToggleSecurityNotifs(e.target.checked)}
              />
              <span className="settings-slider" />
            </label>
          </div>
        </div>
      </div>

      {/* 2. Your Account Section */}
      <div className="settings-section">
        <div className="settings-section-title">
          <span>Your account</span>
        </div>

        <div className="settings-list-group">
          {/* Username */}
          <div className="settings-item" onClick={() => setShowUsernameModal(true)}>
            <div className="settings-icon-badge badge-green">
              <AtSign size={20} />
            </div>
            <div className="settings-item-content">
              <div className="settings-item-header">
                <span className="settings-item-title">Username</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                  @{displayUsername}
                </span>
              </div>
              <span className="settings-item-subtitle">Tap to change username handle</span>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </div>

          {/* Change Phone Number */}
          <div className="settings-item" onClick={() => setShowPhoneModal(true)}>
            <div className="settings-icon-badge badge-green">
              <Phone size={20} />
            </div>
            <div className="settings-item-content">
              <div className="settings-item-header">
                <span className="settings-item-title">Change phone number</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {displayPhone}
                </span>
              </div>
              <span className="settings-item-subtitle">
                Migrate account info, chats, and groups to a new number
              </span>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </div>

          {/* Log Out */}
          <div
            className="settings-item"
            style={{ color: 'var(--accent-danger)' }}
            onClick={() => {
              if (confirm(`Are you sure you want to log out of ${APP_NAME}?`)) {
                onLogout();
              }
            }}

          >
            <div className="settings-icon-badge badge-red">
              <LogOut size={20} />
            </div>
            <div className="settings-item-content">
              <span className="settings-item-title" style={{ color: 'var(--accent-danger)' }}>
                Log out
              </span>
              <span className="settings-item-subtitle">Sign out of this session</span>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </div>
        </div>
      </div>

      {/* Modals */}
      <PasskeyModal
        isOpen={showPasskeyModal}
        onClose={() => setShowPasskeyModal(false)}
        passkeyEnabled={settings.passkeyEnabled}
        onUpdate={(val) => settingsService.update({ passkeyEnabled: val })}
      />

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      <ChangePhoneModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        currentPhoneNumber={displayPhone}
        onPhoneChanged={async (newPhone) => {
          try {
            await api.updateProfile({ phoneNumber: newPhone });
            settingsService.update({ phoneNumber: newPhone });
            if (onUpdateUser) onUpdateUser({ phoneNumber: newPhone });
          } catch (err: any) {
            console.error('Failed to update phone on backend', err);
          }
        }}
      />

      <TwoFactorModal
        isOpen={showTwoFactorModal}
        onClose={() => setShowTwoFactorModal(false)}
        enabled={settings.twoFactorEnabled}
        onUpdate={(val, pin) => settingsService.update({ twoFactorEnabled: val, twoFactorPin: pin })}
      />

      {/* Edit Email Modal */}
      {showEmailModal && (
        <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Email Address</h3>
              <button className="icon-btn" onClick={() => setShowEmailModal(false)}>
                <Check size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveEmail} className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Your email address is used to verify your identity and protect your account.
              </p>
              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Email
                </label>
                <input
                  type="email"
                  className="settings-input"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEmailModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Username Modal */}
      {showUsernameModal && (
        <div className="modal-overlay" onClick={() => setShowUsernameModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Edit Username</h3>
              <button className="icon-btn" onClick={() => setShowUsernameModal(false)}>
                <Check size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveUsername} className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                People can find you on {APP_NAME} using your unique @username handle without knowing your phone number.
              </p>

              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Username
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)' }}>@</span>
                  <input
                    type="text"
                    className="settings-input"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.replace(/[^a-zA-Z0-9._]/g, ''))}
                    placeholder="your_handle"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUsernameModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Username
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
