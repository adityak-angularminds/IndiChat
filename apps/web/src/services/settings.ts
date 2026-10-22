import { generateUUID } from '../utils/uuid';
import { getTranslation } from '../utils/i18n';

export type PrivacyOption = 'everyone' | 'contacts' | 'contacts_except' | 'nobody';
export type OnlinePrivacyOption = 'everyone' | 'same_as_last_seen';
export type FontSizeOption = 'small' | 'medium' | 'large';

export interface LinkedDevice {
  id: string;
  name: string;
  platform: 'linux' | 'windows' | 'mac' | 'ios' | 'android' | 'web';
  browser: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface AppSettings {
  // Linked Devices
  linkedDevices: LinkedDevice[];

  // Account
  passkeyEnabled: boolean;
  passkeyCreatedAt?: string;
  twoFactorEnabled: boolean;
  twoFactorPin?: string;
  securityNotifications: boolean;
  email: string;
  emailVerified: boolean;
  phoneNumber: string;
  username: string;
  displayName: string;
  statusAbout: string;

  // Privacy
  privacyLastSeen: PrivacyOption;
  privacyOnline: OnlinePrivacyOption;
  privacyProfilePhoto: PrivacyOption;
  privacyLinks: PrivacyOption;
  privacyStatus: PrivacyOption;
  privacyExcludedContacts: string[];
  readReceipts: boolean;

  // Chats
  enterIsSend: boolean;
  mediaVisibility: boolean;
  fontSize: FontSizeOption;
  lastBackupDate: string;
  backupSize: string;

  // App Language
  language: string;
}

const SETTINGS_STORAGE_KEY = 'chat_app_settings_v1';

const DEFAULT_SETTINGS: AppSettings = {
  linkedDevices: [
    {
      id: 'current-session',
      name: 'Google Chrome (Linux)',
      platform: 'linux',
      browser: 'Chrome 124.0.0.0',
      location: 'Pune, India',
      ipAddress: '192.168.1.104',
      lastActive: 'Active now',
      isCurrent: true,
    },
    {
      id: 'dev-windows',
      name: 'WhatsApp for Windows',
      platform: 'windows',
      browser: 'WhatsApp Desktop v2.24',
      location: 'Mumbai, India',
      ipAddress: '49.36.120.45',
      lastActive: 'Today at 09:42 AM',
      isCurrent: false,
    },
    {
      id: 'dev-iphone',
      name: 'Safari on iPhone 15 Pro',
      platform: 'ios',
      browser: 'Mobile Safari 17.4',
      location: 'Pune, India',
      ipAddress: '192.168.1.118',
      lastActive: 'Yesterday at 11:20 PM',
      isCurrent: false,
    },
  ],
  passkeyEnabled: false,
  twoFactorEnabled: false,
  twoFactorPin: '',
  securityNotifications: true,
  email: '',
  emailVerified: true,
  phoneNumber: '+91 98765 43210',
  username: '',
  displayName: '',
  statusAbout: 'Hey there! I am using WhatsApp.',

  privacyLastSeen: 'everyone',
  privacyOnline: 'everyone',
  privacyProfilePhoto: 'everyone',
  privacyLinks: 'everyone',
  privacyStatus: 'contacts',
  privacyExcludedContacts: [],
  readReceipts: true,

  enterIsSend: true,
  mediaVisibility: true,
  fontSize: 'medium',
  lastBackupDate: 'Today at 04:30 AM',
  backupSize: '14.2 MB',

  language: 'en',
};

type SettingsListener = (settings: AppSettings) => void;

class SettingsService {
  private settings: AppSettings;
  private listeners: Set<SettingsListener> = new Set();

  constructor() {
    this.settings = this.loadFromStorage();
    this.applyDomEffects(this.settings);
  }

  private loadFromStorage(): AppSettings {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          linkedDevices: parsed.linkedDevices && parsed.linkedDevices.length > 0
            ? parsed.linkedDevices
            : DEFAULT_SETTINGS.linkedDevices,
        };
      }
    } catch (e) {
      console.warn('Failed to parse settings from storage:', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.error('Failed to save settings to storage:', e);
    }
  }

  private applyDomEffects(settings: AppSettings): void {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-font-size', settings.fontSize);
    document.documentElement.setAttribute('lang', settings.language);
  }

  public getSettings(): AppSettings {
    return { ...this.settings };
  }

  public update(partial: Partial<AppSettings>): AppSettings {
    this.settings = { ...this.settings, ...partial };
    this.saveToStorage();
    this.applyDomEffects(this.settings);
    this.notify();
    return this.getSettings();
  }

  public subscribe(listener: SettingsListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const current = this.getSettings();
    this.listeners.forEach((fn) => fn(current));
  }

  // Linked Devices helpers
  public addLinkedDevice(device: Omit<LinkedDevice, 'id' | 'isCurrent'>): LinkedDevice {
    const newDevice: LinkedDevice = {
      ...device,
      id: `dev-${generateUUID().substring(0, 8)}`,
      isCurrent: false,
    };
    this.update({
      linkedDevices: [...this.settings.linkedDevices, newDevice],
    });
    return newDevice;
  }

  public removeLinkedDevice(deviceId: string): void {
    const filtered = this.settings.linkedDevices.filter((d) => d.id !== deviceId);
    this.update({ linkedDevices: filtered });
  }

  public removeAllOtherDevices(): void {
    const currentOnly = this.settings.linkedDevices.filter((d) => d.isCurrent);
    this.update({ linkedDevices: currentOnly });
  }

  // Backup & JSON export
  public performBackupNow(): { date: string; size: string } {
    const now = new Date();
    const timeStr = `Today at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const randomMb = (12 + Math.random() * 5).toFixed(1);
    const sizeStr = `${randomMb} MB`;
    this.update({
      lastBackupDate: timeStr,
      backupSize: sizeStr,
    });
    return { date: timeStr, size: sizeStr };
  }

  public t(key: string): string {
    return getTranslation(this.settings.language, key);
  }
}

export const settingsService = new SettingsService();
