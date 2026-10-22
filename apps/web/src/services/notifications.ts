import { api } from './api';
import { generateUUID } from '../utils/uuid';

const DEVICE_TOKEN_KEY = 'chat_web_device_token';
const PROMPT_DISMISSED_KEY = 'chat_notification_prompt_dismissed';

export type NotificationPermissionStatus = NotificationPermission | 'unsupported';

/**
 * Generates a circular avatar data URL with the user's initial on a WhatsApp gradient.
 * Generates a PNG data URL via Canvas (with SVG fallback) for full OS notification compatibility.
 */
export function generateInitialAvatarDataUrl(nameOrInitial?: string): string {
  const chars = Array.from((nameOrInitial || '').trim());
  const initial = chars.length > 0 ? chars[0].toUpperCase() : '?';

  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;

        // Background circle with WhatsApp green gradient
        const gradient = ctx.createLinearGradient(0, 0, 128, 128);
        gradient.addColorStop(0, '#00a884');
        gradient.addColorStop(1, '#005c4b');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(64, 64, 64, 0, Math.PI * 2);
        ctx.fill();

        // Initial letter centered
        ctx.font = 'bold 68px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initial, 64, 67);

        return canvas.toDataURL('image/png');
      }
    } catch {
      // Fallback to SVG below
    }
  }

  // High-compatibility SVG data URL fallback
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00a884" />
      <stop offset="100%" stop-color="#005c4b" />
    </linearGradient>
  </defs>
  <circle cx="64" cy="64" r="64" fill="url(#g)" />
  <text x="64" y="73" font-family="system-ui, -apple-system, sans-serif" font-size="68" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initial}</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export class NotificationService {
  private deviceToken: string | null = null;

  constructor() {
    this.deviceToken = localStorage.getItem(DEVICE_TOKEN_KEY);
    if (!this.deviceToken) {
      this.deviceToken = `web_${generateUUID()}`;
      localStorage.setItem(DEVICE_TOKEN_KEY, this.deviceToken);
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermissionStatus(): NotificationPermissionStatus {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  public isDismissed(): boolean {
    return localStorage.getItem(PROMPT_DISMISSED_KEY) === 'true';
  }

  public setDismissed(dismissed: boolean): void {
    if (dismissed) {
      localStorage.setItem(PROMPT_DISMISSED_KEY, 'true');
    } else {
      localStorage.removeItem(PROMPT_DISMISSED_KEY);
    }
  }

  public async requestPermission(): Promise<NotificationPermissionStatus> {
    if (!this.isSupported()) return 'unsupported';

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.setDismissed(false);
        await this.syncDeviceToken();
        // Immediately trigger a welcome notification on the web browser
        this.showNotification('WhatsApp Web', {
          body: '🎉 Notifications enabled! You will now receive alerts for incoming messages.',
          tag: 'welcome-notification',
          username: 'W',
        });
      }
      return permission;
    } catch (error) {
      console.warn('[NotificationService] Failed to request permission', error);
      return Notification.permission;
    }
  }

  public async syncDeviceToken(): Promise<void> {
    if (!this.isSupported() || Notification.permission !== 'granted') return;
    if (!localStorage.getItem('chat_access_token')) return;

    try {
      if (!this.deviceToken) {
        this.deviceToken = `web_${generateUUID()}`;
        localStorage.setItem(DEVICE_TOKEN_KEY, this.deviceToken);
      }
      await api.registerDeviceToken(this.deviceToken, 'web');
      console.log('[NotificationService] Device token registered:', this.deviceToken);
    } catch (err) {
      console.warn('[NotificationService] Failed to register device token with server:', err);
    }
  }

  public async unregister(): Promise<void> {
    if (this.deviceToken && localStorage.getItem('chat_access_token')) {
      try {
        await api.unregisterDeviceToken(this.deviceToken);
      } catch (err) {
        console.warn('[NotificationService] Failed to unregister device token:', err);
      }
    }
  }

  public showNotification(
    title: string,
    options: {
      body: string;
      tag?: string;
      username?: string;
      avatar?: string;
      icon?: string;
      data?: Record<string, any>;
      onClick?: () => void;
    }
  ): Notification | null {
    // Native OS / desktop browser push notification
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return null;
    }

    try {
      // Instead of favicon, generate the user initial icon from the username/avatar/title
      const initialSource = options.username || options.avatar || title;
      const iconUrl = options.icon || generateInitialAvatarDataUrl(initialSource);

      const notification = new Notification(title, {
        body: options.body,
        icon: iconUrl,
        tag: options.tag || 'chat-notification',
        data: options.data,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options.onClick) {
          options.onClick();
        }
      };

      return notification;
    } catch (err) {
      console.warn('[NotificationService] Error showing native push notification:', err);
      return null;
    }
  }
}

export const notificationService = new NotificationService();
