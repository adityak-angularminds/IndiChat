import { Platform } from 'react-native';
import { api } from './api';
import { storage, STORAGE_KEYS } from './storage';

let Notifications: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = require('expo-notifications');
  if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (err) {
  console.warn('[Push] expo-notifications module could not be loaded in this environment:', err);
}

/**
 * Request notification permissions and register the Expo push token with the backend.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Notifications) {
    return null;
  }
  let token: string | null = null;

  try {
    if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
      await Notifications.setNotificationChannelAsync('chat-messages', {
        name: 'Chat Messages',
        importance: Notifications.AndroidImportance?.MAX ?? 4,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00a884',
        sound: 'default',
      });
    }

    if (Notifications.getPermissionsAsync && Notifications.requestPermissionsAsync) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[Push] Notification permission not granted');
        return null;
      }
    }

    if (Notifications.getExpoPushTokenAsync) {
      const pushTokenData = await Notifications.getExpoPushTokenAsync();
      token = pushTokenData?.data ?? null;
      console.log('[Push] Expo push token obtained:', token);
    }

    // Sync token with backend if user is authenticated
    const authToken = await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (authToken && token) {
      await api.registerDeviceToken(token, Platform.OS);
      console.log('[Push] Registered push token with backend successfully');
    }
  } catch (error) {
    console.warn('[Push] Error initializing push notifications:', error);
  }

  return token;
}

/**
 * Setup listeners for notification reception and click/tap interaction
 */
export function setupNotificationListeners(
  onNotificationTapped?: (data: Record<string, any>) => void
) {
  if (!Notifications || typeof Notifications.addNotificationReceivedListener !== 'function') {
    return () => {};
  }

  try {
    const foregroundSubscription = Notifications.addNotificationReceivedListener((notification: any) => {
      console.log('[Push] Notification received in foreground:', notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener
      ? Notifications.addNotificationResponseReceivedListener((response: any) => {
          const data = response?.notification?.request?.content?.data;
          console.log('[Push] User tapped notification with data:', data);
          if (onNotificationTapped && data) {
            onNotificationTapped(data);
          }
        })
      : null;

    return () => {
      foregroundSubscription?.remove?.();
      responseSubscription?.remove?.();
    };
  } catch (err) {
    console.warn('[Push] Setup notification listeners not available in this environment:', err);
    return () => {};
  }
}
