import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
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
        <Stack.Screen name="chats" options={{ title: 'WhatsApp', headerBackVisible: false }} />
        <Stack.Screen name="chat/[id]" options={{ title: 'Chat' }} />
      </Stack>
    </>
  );
}
