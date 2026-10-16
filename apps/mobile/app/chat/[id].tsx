import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

interface MessageItem {
  id: string;
  text: string;
  time: string;
  isOutgoing: boolean;
  status: 'sent' | 'delivered' | 'read';
}

export default function ChatScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<MessageItem[]>([
    { id: '1', text: 'Hey there! How is the project going?', time: '11:40 AM', isOutgoing: false, status: 'read' },
    { id: '2', text: 'The Spring Boot backend and React Web frontends are fully working with WebSockets!', time: '11:41 AM', isOutgoing: true, status: 'read' },
    { id: '3', text: 'Real-time delivery receipts and typing indicators work flawlessly.', time: '11:42 AM', isOutgoing: true, status: 'read' },
  ]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMsg: MessageItem = {
      id: Date.now().toString(),
      text: inputText.trim(),
      time: 'Now',
      isOutgoing: true,
      status: 'sent',
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  const renderMessage = ({ item }: { item: MessageItem }) => (
    <View style={[styles.bubbleWrapper, item.isOutgoing ? styles.outgoingWrapper : styles.incomingWrapper]}>
      <View style={[styles.bubble, item.isOutgoing ? styles.outgoingBubble : styles.incomingBubble]}>
        <Text style={styles.messageText}>{item.text}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.timeText}>{item.time}</Text>
          {item.isOutgoing && (
            <Text style={[styles.receiptText, item.status === 'read' && styles.readReceipt]}>
              ✓✓
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message"
          placeholderTextColor="#8696a0"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b141a',
  },
  messagesList: {
    padding: 16,
    gap: 8,
  },
  bubbleWrapper: {
    flexDirection: 'row',
  },
  outgoingWrapper: {
    justifyContent: 'flex-end',
  },
  incomingWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  outgoingBubble: {
    backgroundColor: '#005c4b',
  },
  incomingBubble: {
    backgroundColor: '#202c33',
  },
  messageText: {
    color: '#e9edef',
    fontSize: 15,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  timeText: {
    color: 'rgba(233, 237, 239, 0.6)',
    fontSize: 11,
  },
  receiptText: {
    color: 'rgba(233, 237, 239, 0.6)',
    fontSize: 12,
    fontWeight: '700',
  },
  readReceipt: {
    color: '#53bdeb',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#202c33',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#2a3942',
    color: '#e9edef',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00a884',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    color: '#111b21',
    fontSize: 18,
    fontWeight: '700',
  },
});
