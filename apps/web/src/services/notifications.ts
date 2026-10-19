import { api } from './api';
import { generateUUID } from '../utils/uuid';

const DEVICE_TOKEN_KEY = 'chat_web_device_token';

export type NotificationPermissionStatus = NotificationPermission | 'unsupported';

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

  public async requestPermission(): Promise<NotificationPermissionStatus> {
    if (!this.isSupported()) return 'unsupported';

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await this.syncDeviceToken();
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
      data?: Record<string, any>;
      onClick?: () => void;
    }
  ): Notification | null {
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
      console.warn('[NotificationService] Error showing notification:', err);
      return null;
    }
  }
}

export const notificationService = new NotificationService();
