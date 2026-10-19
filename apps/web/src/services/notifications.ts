import { api } from './api';
import { generateUUID } from '../utils/uuid';

const DEVICE_TOKEN_KEY = 'chat_web_device_token';
const PROMPT_DISMISSED_KEY = 'chat_notification_prompt_dismissed';

export type NotificationPermissionStatus = NotificationPermission | 'unsupported';

export interface ToastNotification {
  id: string;
  title: string;
  body: string;
  tag?: string;
  avatar?: string;
  onClick?: () => void;
}

type ToastListener = (toast: ToastNotification) => void;

export class NotificationService {
  private deviceToken: string | null = null;
  private toastListeners: Set<ToastListener> = new Set();

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

  public onToast(listener: ToastListener): () => void {
    this.toastListeners.add(listener);
    return () => {
      this.toastListeners.delete(listener);
    };
  }

  public showNotification(
    title: string,
    options: {
      body: string;
      tag?: string;
      avatar?: string;
      data?: Record<string, any>;
      onClick?: () => void;
    }
  ): Notification | null {
    // 1. Always trigger in-app browser toast popup
    const toastItem: ToastNotification = {
      id: generateUUID(),
      title,
      body: options.body,
      tag: options.tag,
      avatar: options.avatar,
      onClick: options.onClick,
    };
    this.toastListeners.forEach((listener) => {
      try {
        listener(toastItem);
      } catch (e) {
        console.error('Toast listener error:', e);
      }
    });

    // 2. Trigger native OS / desktop browser notification if granted
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return null;
    }

    try {
      const notification = new Notification(title, {
        body: options.body,
        icon: '/favicon.ico',
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
      console.warn('[NotificationService] Error showing native notification:', err);
      return null;
    }
  }
}

export const notificationService = new NotificationService();
