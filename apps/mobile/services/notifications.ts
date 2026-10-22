import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './api';
import { storage, STORAGE_KEYS } from './storage';

// Configure default notification handler for in-app alert display
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions and register the Expo push token with the backend.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('chat-messages', {
        name: 'Chat Messages',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00a884',
        sound: 'default',
      });
    }

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

    const pushTokenData = await Notifications.getExpoPushTokenAsync();
    token = pushTokenData.data;
    console.log('[Push] Expo push token obtained:', token);

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
  try {
    const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Push] Notification received in foreground:', notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('[Push] User tapped notification with data:', data);
      if (onNotificationTapped && data) {
        onNotificationTapped(data);
      }
    });

    return () => {
      foregroundSubscription?.remove?.();
      responseSubscription?.remove?.();
    };
  } catch (err) {
    console.warn('[Push] Setup notification listeners not available in this environment:', err);
    return () => {};
  }
}
