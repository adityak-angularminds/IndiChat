import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { registerForPushNotificationsAsync, setupNotificationListeners } from '../services/notifications';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    registerForPushNotificationsAsync();
    const cleanup = setupNotificationListeners((data) => {
      if (data?.conversationId) {
        router.push(`/chat/${data.conversationId}?name=${encodeURIComponent(data.title || 'Chat')}`);
      }
    });
    return cleanup;
  }, [router]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#202c33' },
          headerTintColor: '#e9edef',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#111b21' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="chats" options={{ title: 'IndiChat', headerBackVisible: false }} />

        <Stack.Screen name="chat/[id]" options={{ title: 'Chat' }} />
      </Stack>
    </>
  );
}

