import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { registerForPushNotificationsAsync, setupNotificationListeners } from '../services/notifications';
import { wsClient } from '../services/websocket';
import { onSessionExpired } from '../services/api';
import { storage } from '../services/storage';
import { settingsService } from '../services/settings';
import { Ionicons } from '@expo/vector-icons';

export default function RootLayout() {
  const router = useRouter();
  const [sessionRevokedReason, setSessionRevokedReason] = useState<string | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync();
    const cleanupNotifications = setupNotificationListeners((data) => {
      if (data?.conversationId) {
        router.push(`/chat/${data.conversationId}?name=${encodeURIComponent(data.title || 'Chat')}`);
      }
    });

    const handleRevoked = async (reason: string) => {
      wsClient.disconnect();
      await storage.clearAuth();
      settingsService.resetForLogout();
      setSessionRevokedReason(
        reason || 'This device was removed from your linked devices. You have been logged out.'
      );
      router.replace('/');
    };

    const unsubDeviceRemoved = wsClient.onDeviceRemoved(handleRevoked);
    const unsubExpired = onSessionExpired(handleRevoked);

    return () => {
      cleanupNotifications?.();
      unsubDeviceRemoved();
      unsubExpired();
    };
  }, [router]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#111b21' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="chats" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
      </Stack>

      {/* Global Session Revoked / Removed Modal */}
      {sessionRevokedReason && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalBg}>
            <View style={styles.modalCard}>
              <View style={styles.iconCircle}>
                <Ionicons name="alert-circle" size={36} color="#f15c6d" />
              </View>
              <Text style={styles.modalTitle}>Session Ended</Text>
              <Text style={styles.modalText}>{sessionRevokedReason}</Text>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => setSessionRevokedReason(null)}
              >
                <Text style={styles.modalBtnText}>Log In Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#202c33',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a3942',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(241, 92, 109, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#e9edef',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalText: {
    color: '#8696a0',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalBtn: {
    backgroundColor: '#00a884',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#111b21',
    fontWeight: '700',
    fontSize: 15,
  },
});
