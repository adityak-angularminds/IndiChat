import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('alice');
  const [password, setPassword] = useState('Password123!');
  const [displayName, setDisplayName] = useState('Alice');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    // In production, posts to backend API and persists JWT to SecureStore
    setTimeout(() => {
      setLoading(false);
      router.replace('/chats');
    }, 500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>💬</Text>
          </View>
          <Text style={styles.title}>WhatsApp</Text>
          <Text style={styles.subtitle}>
            {isRegister ? 'Create an account' : 'Sign in to your account'}
          </Text>
        </View>

        <View style={styles.form}>
          {isRegister && (
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#8696a0"
              value={displayName}
              onChangeText={setDisplayName}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Username or Phone"
            placeholderTextColor="#8696a0"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#8696a0"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#111b21" />
            ) : (
              <Text style={styles.buttonText}>
                {isRegister ? 'Register' : 'Log In'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsRegister(!isRegister)}
            style={styles.switchButton}
          >
            <Text style={styles.switchText}>
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111b21',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00a884',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#e9edef',
  },
  subtitle: {
    fontSize: 14,
    color: '#8696a0',
    marginTop: 4,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: '#202c33',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#e9edef',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#222e35',
  },
  buttonPrimary: {
    backgroundColor: '#00a884',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#111b21',
    fontWeight: '700',
    fontSize: 16,
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 12,
  },
  switchText: {
    color: '#00a884',
    fontSize: 14,
  },
});
