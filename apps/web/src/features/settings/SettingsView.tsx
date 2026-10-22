import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Laptop,
  ShieldCheck,
  Lock,
  MessageSquare,
  Globe,
  LogOut,
  ChevronRight,
  Camera,
  Check
} from 'lucide-react';
import { User, Conversation, Message } from '@chat/shared-types';
import { AppSettings, settingsService } from '../../services/settings';
import { SUPPORTED_LANGUAGES, getTranslation } from '../../utils/i18n';
import { LinkedDevicesView } from './LinkedDevicesView';
import { AccountView } from './AccountView';
import { PrivacyView } from './PrivacyView';
import { ChatsSettingsView } from './ChatsSettingsView';
import { AppLanguageView } from './AppLanguageView';
import { APP_NAME } from '../../config/appConfig';


export type SettingsSubView =
  | 'menu'
  | 'linked_devices'
  | 'account'
  | 'privacy'
  | 'chats'
  | 'language';

interface SettingsViewProps {
  currentUser: User;
  conversations: Conversation[];
  messages: Message[];
  onClose: () => void;
  onLogout: () => void;
  onUpdateUser?: (updated: Partial<User>) => void;
  onClearAllMessages?: () => void;
  onDeleteAllChats?: () => void;
  initialSubView?: SettingsSubView;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  conversations,
  messages,
  onClose,
  onLogout,
  onUpdateUser,
  onClearAllMessages,
  onDeleteAllChats,
  initialSubView = 'menu',
}) => {
  const [subView, setSubView] = useState<SettingsSubView>(initialSubView);
  const [settings, setSettings] = useState<AppSettings>(() => settingsService.getSettings());
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [statusText, setStatusText] = useState(settings.statusAbout);

  useEffect(() => {
    const unsub = settingsService.subscribe((newSettings) => {
      setSettings(newSettings);
      setStatusText(newSettings.statusAbout);
    });
    return unsub;
  }, []);

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === settings.language) || SUPPORTED_LANGUAGES[0];

  const t = (key: string) => getTranslation(settings.language, key);

  const getSubViewTitle = (view: SettingsSubView): string => {
    switch (view) {
      case 'linked_devices':
        return t('linkedDevices');
      case 'account':
        return t('account');
      case 'privacy':
        return t('privacy');
      case 'chats':
        return t('chats');
      case 'language':
        return t('appLanguage');
      default:
        return t('settings');
    }
  };

  const handleHeaderBack = () => {
    if (subView === 'menu') {
      onClose();
    } else {
      setSubView('menu');
    }
  };

  const handleSaveStatus = () => {
    settingsService.update({ statusAbout: statusText.trim() });
    setIsEditingStatus(false);
  };

  return (
    <div className="settings-drawer-container">
      {/* Top Header */}
      <div className="settings-drawer-header">
        <button
          className="icon-btn settings-back-btn"
          onClick={handleHeaderBack}
          title={subView === 'menu' ? 'Back to chats' : 'Back to settings'}
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <h2 className="settings-drawer-title">{getSubViewTitle(subView)}</h2>
      </div>

      {/* Main Drawer Body */}
      <div className="settings-drawer-body">
        {subView === 'menu' && (
          <div className="settings-menu-content">
            {/* User Profile Card */}
            <div className="settings-profile-card">
              <div className="settings-profile-avatar-wrap">
                <div className="avatar settings-profile-avatar">
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>

              <div className="settings-profile-details">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 className="settings-profile-name">{currentUser.displayName}</h3>
                  <span className="settings-profile-handle">@{currentUser.username}</span>
                </div>

                {isEditingStatus ? (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <input
                      type="text"
                      className="settings-status-input"
                      value={statusText}
                      onChange={(e) => setStatusText(e.target.value)}
                      placeholder="About status..."
                      autoFocus
                    />
                    <button
                      className="icon-btn"
                      style={{ color: '#00a884', padding: '4px' }}
                      onClick={handleSaveStatus}
                    >
                      <Check size={18} />
                    </button>
                  </div>
                ) : (
                  <p
                    className="settings-profile-status"
                    onClick={() => setIsEditingStatus(true)}
                    title="Click to edit status"
                  >
                    {settings.statusAbout}
                  </p>
                )}
              </div>
            </div>

            {/* Menu List */}
            <div className="settings-list-group" style={{ marginTop: '10px' }}>
              {/* 1. Linked devices */}
              <div
                className="settings-item"
                onClick={() => setSubView('linked_devices')}
                id="settings-item-linked-devices"
              >
                <div className="settings-icon-badge badge-green">
                  <Laptop size={20} />
                </div>
                <div className="settings-item-content">
                  <div className="settings-item-header">
                    <span className="settings-item-title">{t('linkedDevices')}</span>
                    <span className="settings-status-badge badge-active">
                      {settings.linkedDevices.length}
                    </span>
                  </div>
                  <span className="settings-item-subtitle">
                    See where you are logged in & link new devices
                  </span>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>

              {/* 2. Account */}
              <div
                className="settings-item"
                onClick={() => setSubView('account')}
                id="settings-item-account"
              >
                <div className="settings-icon-badge badge-blue">
                  <ShieldCheck size={20} />
                </div>
                <div className="settings-item-content">
                  <span className="settings-item-title">{t('account')}</span>
                  <span className="settings-item-subtitle">
                    Passkeys, password, email, 2FA, username, change phone
                  </span>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>

              {/* 3. Privacy */}
              <div
                className="settings-item"
                onClick={() => setSubView('privacy')}
                id="settings-item-privacy"
              >
                <div className="settings-icon-badge badge-teal">
                  <Lock size={20} />
                </div>
                <div className="settings-item-content">
                  <span className="settings-item-title">{t('privacy')}</span>
                  <span className="settings-item-subtitle">
                    Last seen & online, profile picture, links, status, read receipts
                  </span>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>

              {/* 4. Chats */}
              <div
                className="settings-item"
                onClick={() => setSubView('chats')}
                id="settings-item-chats"
              >
                <div className="settings-icon-badge badge-amber">
                  <MessageSquare size={20} />
                </div>
                <div className="settings-item-content">
                  <span className="settings-item-title">{t('chats')}</span>
                  <span className="settings-item-subtitle">
                    Enter is send, media visibility, font size, chat backup (JSON)
                  </span>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>

              {/* 5. App language */}
              <div
                className="settings-item"
                onClick={() => setSubView('language')}
                id="settings-item-language"
              >
                <div className="settings-icon-badge badge-purple">
                  <Globe size={20} />
                </div>
                <div className="settings-item-content">
                  <div className="settings-item-header">
                    <span className="settings-item-title">{t('appLanguage')}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                      {currentLang.nativeName}
                    </span>
                  </div>
                  <span className="settings-item-subtitle">
                    {currentLang.name}
                  </span>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>

              {/* Log out item */}
              <div
                className="settings-item"
                style={{ color: 'var(--accent-danger)', marginTop: '8px' }}
                onClick={() => {
                  if (confirm(t('logoutConfirm'))) {
                    onLogout();
                  }
                }}
              >
                <div className="settings-icon-badge badge-red">
                  <LogOut size={20} />
                </div>
                <div className="settings-item-content">
                  <span className="settings-item-title" style={{ color: 'var(--accent-danger)' }}>
                    {t('logout')}
                  </span>
                  <span className="settings-item-subtitle">
                    Sign out of your {APP_NAME} account
                  </span>

                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>
            </div>
          </div>
        )}

        {subView === 'linked_devices' && (
          <LinkedDevicesView settings={settings} onBack={() => setSubView('menu')} />
        )}

        {subView === 'account' && (
          <AccountView
            currentUser={currentUser}
            settings={settings}
            onLogout={onLogout}
            onUpdateUser={onUpdateUser}
          />
        )}

        {subView === 'privacy' && (
          <PrivacyView
            currentUser={currentUser}
            conversations={conversations}
            settings={settings}
          />
        )}

        {subView === 'chats' && (
          <ChatsSettingsView
            currentUser={currentUser}
            conversations={conversations}
            messages={messages}
            settings={settings}
            onClearAllMessages={onClearAllMessages}
            onDeleteAllChats={onDeleteAllChats}
          />
        )}

        {subView === 'language' && <AppLanguageView settings={settings} />}
      </div>
    </div>
  );
};
