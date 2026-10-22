import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  Message,
  MessageType,
  MessageReceipt,
} from '@chat/shared-types';
import { api, getApiBaseUrl } from '../../services/api';
import { wsClient } from '../../services/websocket';
import { storage, STORAGE_KEYS } from '../../services/storage';
import { generateUUID } from '../../utils/uuid';
import { EMOJI_CATEGORIES } from '../../data/emojiData';
import { GIF_CATEGORIES, searchGifsLocally, getGifsByCategory } from '../../data/gifData';
import { STICKER_PACKS } from '../../data/stickerData';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ParsedAttachment {
  fileId?: string;
  fileName: string;
  fileType?: MessageType;
  mimeType?: string;
  fileSize?: number;
  fileUrl: string;
  caption?: string;
  isGif?: boolean;
}

function parseAttachment(content: string): ParsedAttachment | null {
  if (!content) return null;
  try {
    const data = JSON.parse(content);
    if (data && typeof data === 'object' && (data.fileUrl || data.fileName)) {
      return data as ParsedAttachment;
    }
  } catch {}
  if (content.startsWith('http') || content.startsWith('/api/') || content.startsWith('data:')) {
    return {
      fileUrl: content,
      fileName: 'attachment',
    };
  }
  return null;
}



export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id: conversationId, name: queryName, type: queryType, unread: queryUnread } = useLocalSearchParams<{
    id: string;
    name?: string;
    type?: string;
    unread?: string;
  }>();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiBaseUrl, setApiBaseUrl] = useState('');

  // Modals & Panels
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaPickerTab, setMediaPickerTab] = useState<'emoji' | 'gif' | 'sticker'>('emoji');
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState('smileys');
  const [selectedGifCategory, setSelectedGifCategory] = useState('trending');
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [selectedStickerPack, setSelectedStickerPack] = useState(STICKER_PACKS[0]?.id || 'pack-reactions');

  // Preview attachment before sending
  const [pendingFile, setPendingFile] = useState<{
    uri: string;
    name: string;
    type: string;
    size?: number;
    previewType: MessageType;
  } | null>(null);
  const [pendingCaption, setPendingCaption] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  // Fullscreen media lightbox
  const [lightboxMedia, setLightboxMedia] = useState<{
    url: string;
    caption?: string;
    title?: string;
  } | null>(null);

  // Calling modal
  const [activeCall, setActiveCall] = useState<{
    targetName: string;
    isVideo: boolean;
    status: 'calling' | 'connected';
    duration: number;
    isMuted: boolean;
  } | null>(null);

  const flatListRef = useRef<FlatList>(null);

  const contactName = queryName || 'Chat';

  // Load user and messages
  useEffect(() => {
    (async () => {
      const u = await storage.getJson<User>(STORAGE_KEYS.CURRENT_USER);
      if (u) setCurrentUser(u);
      const base = await getApiBaseUrl();
      setApiBaseUrl(base);

      if (conversationId) {
        try {
          const res = await api.getMessages(conversationId);
          if (res.messages && res.messages.length > 0) {
            setMessages(res.messages);

            // Mark all unread incoming messages as seen
            res.messages.forEach((msg) => {
              if (u && msg.senderId !== u.id) {
                const isRead = msg.receipts?.some((r) => r.userId === u.id && r.readAt != null);
                if (!isRead) {
                  wsClient.markRead(msg.id, conversationId);
                  api.markRead(msg.id).catch(() => {});
                }
              }
            });
          } else {
            setMessages([]);
          }
        } catch (e) {
          console.warn('Failed to load backend messages:', e);
          setMessages([]);
        } finally {
          setLoading(false);
        }
      } else {
        setMessages([]);
        setLoading(false);
      }
    })();
  }, [conversationId]);

  // Mark incoming unread messages as read when viewing conversation
  useEffect(() => {
    if (!currentUser || !conversationId) return;
    messages.forEach((msg) => {
      if (msg.senderId !== currentUser.id) {
        const isRead = msg.receipts?.some((r) => r.userId === currentUser.id && r.readAt != null);
        if (!isRead) {
          wsClient.markRead(msg.id, conversationId);
          api.markRead(msg.id).catch(() => {});
        }
      }
    });
  }, [conversationId, messages.length, currentUser?.id]);

  // WebSocket listeners
  useEffect(() => {
    if (!conversationId) return;

    const unsubMsg = wsClient.onMessageCreated((msg: Message) => {
      if (currentUser && msg.senderId !== currentUser.id) {
        if (msg.conversationId === conversationId) {
          // Since user is actively in this chat, mark new incoming message as seen immediately!
          wsClient.markRead(msg.id, conversationId);
          api.markRead(msg.id).catch(() => {});
        } else {
          // Message for another chat, acknowledge delivery
          wsClient.markDelivered(msg.id, msg.conversationId);
        }
      }

      if (msg.conversationId === conversationId) {
        setMessages((prev) => {
          const matchIndex = prev.findIndex(
            (m) =>
              (Boolean(msg.clientMessageId) && m.clientMessageId === msg.clientMessageId) ||
              (Boolean(msg.id) && m.id === msg.id)
          );
          const isRead = msg.receipts?.some((r) => r.readAt != null);
          const isDelivered = msg.receipts?.some((r) => r.deliveredAt != null);
          const status = isRead ? 'read' : isDelivered ? 'delivered' : 'sent';
          if (matchIndex >= 0) {
            const next = [...prev];
            next[matchIndex] = { ...msg, status };
            return next;
          }
          return [...prev, { ...msg, status }];
        });
      }
    });

    const unsubReceipt = wsClient.onReceiptUpdated((receipt: MessageReceipt) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === receipt.messageId) {
            const receipts = m.receipts ? [...m.receipts] : [];
            const idx = receipts.findIndex((r) => r.userId === receipt.userId);
            if (idx >= 0) receipts[idx] = receipt;
            else receipts.push(receipt);
            const isRead = receipts.some((r) => r.readAt != null);
            const isDelivered = receipts.some((r) => r.deliveredAt != null);
            return {
              ...m,
              receipts,
              status: isRead ? 'read' : isDelivered ? 'delivered' : m.status,
            };
          }
          return m;
        })
      );
    });

    const unsubCall = wsClient.onCallSignal((signal) => {
      if (signal.signalType === 'answer') {
        setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));
      } else if (signal.signalType === 'hangup') {
        setActiveCall(null);
      }
    });

    return () => {
      unsubMsg();
      unsubReceipt();
      unsubCall();
    };
  }, [conversationId]);

  // Call duration counter
  useEffect(() => {
    let interval: any;
    if (activeCall && activeCall.status === 'connected') {
      interval = setInterval(() => {
        setActiveCall((prev) => (prev ? { ...prev, duration: prev.duration + 1 } : null));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeCall?.status]);

  const handleSendMessage = async (content: string, type: MessageType = 'TEXT') => {
    if (!content.trim()) return;

    const clientMsgId = generateUUID();
    const optimisticMessage: Message = {
      id: clientMsgId,
      conversationId: conversationId || 'demo-triv',
      senderId: currentUser?.id || 'current-user',
      clientMessageId: clientMsgId,
      type,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      sender: currentUser || undefined,
      receipts: [],
      status: 'sending',
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText('');
    setShowMediaPicker(false);

    // If active conversation on backend, send via API
    if (conversationId && !conversationId.startsWith('demo-')) {
      try {
        const saved = await api.sendMessage({
          conversationId,
          clientMessageId: clientMsgId,
          messageType: type,
          content: content.trim(),
        });

        const isRead = saved.receipts?.some((r) => r.readAt != null);
        const isDelivered = saved.receipts?.some((r) => r.deliveredAt != null);
        const status = isRead ? 'read' : isDelivered ? 'delivered' : 'sent';

        setMessages((prev) =>
          prev.map((m) =>
            (m.clientMessageId && m.clientMessageId === clientMsgId) || m.id === clientMsgId
              ? { ...saved, status }
              : m
          )
        );
      } catch (err) {
        wsClient.sendMessage({
          conversationId,
          clientMessageId: clientMsgId,
          messageType: type,
          content: content.trim(),
        });
      }
    } else {
      // Simulate sent tick in demo mode
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.clientMessageId === clientMsgId ? { ...m, status: 'sent' } : m
          )
        );
      }, 400);
    }
  };

  // Attachments Handling
  const handlePickImage = async () => {
    setShowAttachmentMenu(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Allow media library access to send photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const isVideo = asset.type === 'video' || asset.uri.toLowerCase().endsWith('.mp4');
      setPendingFile({
        uri: asset.uri,
        name: asset.fileName || (isVideo ? 'video.mp4' : 'photo.jpg'),
        type: isVideo ? 'video/mp4' : 'image/jpeg',
        size: asset.fileSize,
        previewType: isVideo ? 'VIDEO' : 'IMAGE',
      });
      setPendingCaption('');
    }
  };

  const handleCaptureCamera = async () => {
    setShowAttachmentMenu(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Allow camera access to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPendingFile({
        uri: asset.uri,
        name: asset.fileName || 'camera_photo.jpg',
        type: 'image/jpeg',
        size: asset.fileSize,
        previewType: 'IMAGE',
      });
      setPendingCaption('');
    }
  };

  const handlePickDocument = async () => {
    setShowAttachmentMenu(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        setPendingFile({
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
          size: file.size,
          previewType: 'DOCUMENT',
        });
        setPendingCaption('');
      }
    } catch (err: any) {
      console.warn('Doc picker error', err);
    }
  };

  const handleConfirmSendAttachment = async () => {
    if (!pendingFile) return;
    setUploadingFile(true);

    try {
      let fileUrl = pendingFile.uri;
      if (conversationId && !conversationId.startsWith('demo-')) {
        const uploadRes = await api.uploadFile({
          uri: pendingFile.uri,
          name: pendingFile.name,
          type: pendingFile.type,
        });
        fileUrl = uploadRes.fileUrl;
      }

      const attachmentPayload = {
        fileName: pendingFile.name,
        fileType: pendingFile.previewType,
        fileSize: pendingFile.size || 0,
        fileUrl,
        caption: pendingCaption.trim() || undefined,
      };

      setPendingFile(null);
      setPendingCaption('');

      await handleSendMessage(JSON.stringify(attachmentPayload), pendingFile.previewType);
    } catch (err: any) {
      Alert.alert('Upload Error', err.message || 'Failed to send attachment.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleStartCall = (isVideo: boolean) => {
    setActiveCall({
      targetName: contactName,
      isVideo,
      status: 'calling',
      duration: 0,
      isMuted: false,
    });

    wsClient.sendCallSignal({
      targetUserId: conversationId || '',
      signalType: 'offer',
      data: { isVideo },
    });
  };

  const handleHangupCall = () => {
    if (activeCall) {
      wsClient.sendCallSignal({
        targetUserId: conversationId || '',
        signalType: 'hangup',
        data: {},
      });
      setActiveCall(null);
    }
  };

  const formatMessageTime = (isoString?: string) => {
    if (!isoString) return '14:22';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '14:22';
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const renderBubbleContent = (msg: Message) => {
    const parsed = parseAttachment(msg.content);

    if (msg.type === 'IMAGE' || (parsed && parsed.fileType === 'IMAGE')) {
      const imgUrl = parsed?.fileUrl || msg.content;
      return (
        <View style={{ borderRadius: 8, overflow: 'hidden', marginVertical: 4 }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setLightboxMedia({ url: imgUrl, caption: parsed?.caption, title: contactName })}
          >
            <Image source={{ uri: imgUrl }} style={styles.imageBubble} resizeMode="cover" />
          </TouchableOpacity>
          {parsed?.caption ? <Text style={styles.messageText}>{parsed.caption}</Text> : null}
        </View>
      );
    }

    if (msg.type === 'STICKER') {
      return <Image source={{ uri: msg.content }} style={styles.stickerBubble} resizeMode="contain" />;
    }

    return (
      <View>
        {/* Quoted Reply Message Preview */}
        {msg.replyTo && (
          <View style={styles.replyPreviewCard}>
            <View style={styles.replyAccentBar} />
            <View style={styles.replyContent}>
              <Text style={styles.replyAuthor}>{msg.replyTo.senderDisplayName || 'Replied Message'}</Text>
              <Text style={styles.replySnippet} numberOfLines={2}>
                {msg.replyTo.content}
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.messageText}>{msg.content}</Text>
      </View>
    );
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isOutgoing = item.senderId === (currentUser?.id || 'current-user');
    const isRead = item.status === 'read' || item.receipts?.some((r) => r.readAt != null);
    const isDelivered = item.status === 'delivered' || item.receipts?.some((r) => r.deliveredAt != null);
    const timeStr = formatMessageTime(item.createdAt);

    return (
      <View
        style={[
          styles.bubbleWrapper,
          isOutgoing ? styles.outgoingWrapper : styles.incomingWrapper,
        ]}
      >
        <View style={[styles.bubble, isOutgoing ? styles.outgoingBubble : styles.incomingBubble]}>
          {renderBubbleContent(item)}

          {/* Timestamp and Delivery Receipts */}
          <View style={styles.metaRow}>
            <Text style={styles.timeText}>{timeStr}</Text>
            {isOutgoing && (
              <Ionicons
                name={
                  isRead || isDelivered
                    ? 'checkmark-done'
                    : item.status === 'sending'
                    ? 'time-outline'
                    : 'checkmark'
                }
                size={14}
                color={isRead ? '#53bdeb' : 'rgba(233, 237, 239, 0.6)'}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* WhatsApp Exact Top Header */}
      <View
        style={[
          styles.topHeader,
          {
            paddingTop: insets.top,
            height: 56 + insets.top,
          },
        ]}
      >
        {/* Back Button with dynamic unread indicator */}
        <TouchableOpacity style={styles.backBadgePill} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#e9edef" />
          {queryUnread && Number(queryUnread) > 0 ? (
            <Text style={styles.backBadgeText}>{queryUnread}</Text>
          ) : null}
        </TouchableOpacity>

        {/* Contact Avatar */}
        <View style={styles.avatarBox}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitialText}>
              {(contactName || 'C').charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Contact Name */}
        <Text style={styles.headerContactName} numberOfLines={1}>
          {contactName}
        </Text>

        <View style={{ flex: 1 }} />

        {/* Video & Voice Call Capsule Pill */}
        <View style={styles.callCapsule}>
          <TouchableOpacity style={styles.callIconBtn} onPress={() => handleStartCall(true)}>
            <Ionicons name="videocam-outline" size={22} color="#e9edef" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.callIconBtn} onPress={() => handleStartCall(false)}>
            <Ionicons name="call-outline" size={20} color="#e9edef" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages List Area */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#25D366" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id || item.clientMessageId || Math.random().toString()}
          renderItem={renderMessageItem}
          contentContainerStyle={[
            styles.messagesContent,
            messages.length === 0 && { flexGrow: 1, justifyContent: 'center' },
          ]}
          ListEmptyComponent={
            <View style={styles.emptyMessagesContainer}>
              <View style={styles.e2eeBanner}>
                <Ionicons name="lock-closed" size={13} color="#facc15" style={{ marginBottom: 4 }} />
                <Text style={styles.e2eeBannerText}>
                  Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen to them.
                </Text>
              </View>
              <Text style={styles.emptyMessagesSubtitle}>
                Say hello to start the conversation! 👋
              </Text>
            </View>
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* WhatsApp Exact Bottom Input Bar: [+] [ Message 📄 ] (₹) 📷 (🎙️) */}
      <View
        style={[
          styles.bottomBarRow,
          {
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ]}
      >
        {/* Left: Plus (+) Button */}
        <TouchableOpacity
          style={styles.plusBtn}
          onPress={() => setShowAttachmentMenu(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#e9edef" />
        </TouchableOpacity>

        {/* Center: Rounded Input Capsule with Sticker Icon */}
        <View style={styles.inputCapsule}>
          <TextInput
            style={styles.messageInput}
            placeholder="Message"
            placeholderTextColor="#8696a0"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={styles.stickerPageBtn}
            onPress={() => setShowMediaPicker(!showMediaPicker)}
          >
            <Ionicons name="copy-outline" size={20} color="#8696a0" />
          </TouchableOpacity>
        </View>

        {/* Right: Rupee (₹) Button */}
        <TouchableOpacity
          style={styles.rupeeCircleBtn}
          onPress={() => Alert.alert('Payments', 'Send money via UPI')}
          activeOpacity={0.8}
        >
          <Text style={styles.rupeeSymbolText}>₹</Text>
        </TouchableOpacity>

        {/* Right: Camera Button */}
        <TouchableOpacity
          style={styles.cameraCircleBtn}
          onPress={handleCaptureCamera}
          activeOpacity={0.8}
        >
          <Ionicons name="camera-outline" size={24} color="#e9edef" />
        </TouchableOpacity>

        {/* Far Right: WhatsApp Green Circular Send / Mic Button */}
        <TouchableOpacity
          style={styles.greenActionCircle}
          onPress={() => {
            if (inputText.trim()) {
              handleSendMessage(inputText, 'TEXT');
            } else {
              handleSendMessage('🎵 Voice message', 'AUDIO');
            }
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name={inputText.trim() ? 'send' : 'mic'}
            size={20}
            color="#000000"
          />
        </TouchableOpacity>
      </View>

      {/* Attachment Options Action Modal */}
      <Modal visible={showAttachmentMenu} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowAttachmentMenu(false)}
        >
          <View style={styles.attachmentSheet}>
            <View style={styles.attachmentGrid}>
              <TouchableOpacity style={styles.attachmentOption} onPress={handleCaptureCamera}>
                <View style={[styles.optionCircle, { backgroundColor: '#d3396d' }]}>
                  <Ionicons name="camera" size={26} color="#fff" />
                </View>
                <Text style={styles.optionLabel}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.attachmentOption} onPress={handlePickImage}>
                <View style={[styles.optionCircle, { backgroundColor: '#ac44cf' }]}>
                  <Ionicons name="images" size={26} color="#fff" />
                </View>
                <Text style={styles.optionLabel}>Photos</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.attachmentOption} onPress={handlePickDocument}>
                <View style={[styles.optionCircle, { backgroundColor: '#5f66cd' }]}>
                  <Ionicons name="document-text" size={26} color="#fff" />
                </View>
                <Text style={styles.optionLabel}>Document</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachmentOption}
                onPress={() => {
                  setShowAttachmentMenu(false);
                  Alert.alert('Payments', 'Send money via UPI');
                }}
              >
                <View style={[styles.optionCircle, { backgroundColor: '#00a884' }]}>
                  <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>₹</Text>
                </View>
                <Text style={styles.optionLabel}>Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Media / Sticker / Emoji Panel */}
      {showMediaPicker && (
        <View style={styles.mediaPickerContainer}>
          <View style={styles.pickerTabsRow}>
            <TouchableOpacity
              style={[styles.pickerTab, mediaPickerTab === 'emoji' && styles.pickerTabActive]}
              onPress={() => setMediaPickerTab('emoji')}
            >
              <Text style={styles.pickerTabTitle}>😀 Emoji</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pickerTab, mediaPickerTab === 'gif' && styles.pickerTabActive]}
              onPress={() => setMediaPickerTab('gif')}
            >
              <Text style={styles.pickerTabTitle}>🎞️ GIF</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pickerTab, mediaPickerTab === 'sticker' && styles.pickerTabActive]}
              onPress={() => setMediaPickerTab('sticker')}
            >
              <Text style={styles.pickerTabTitle}>🏷️ Sticker</Text>
            </TouchableOpacity>
          </View>

          {mediaPickerTab === 'emoji' && (
            <FlatList
              data={EMOJI_CATEGORIES.find((c) => c.id === selectedEmojiCategory)?.emojis || []}
              keyExtractor={(e, idx) => `${e.emoji}-${idx}`}
              numColumns={8}
              contentContainerStyle={{ padding: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.emojiItem}
                  onPress={() => setInputText((prev) => prev + item.emoji)}
                >
                  <Text style={{ fontSize: 26 }}>{item.emoji}</Text>
                </TouchableOpacity>
              )}
            />
          )}

          {mediaPickerTab === 'sticker' && (
            <FlatList
              data={STICKER_PACKS[0]?.stickers || []}
              keyExtractor={(s) => s.id}
              numColumns={4}
              contentContainerStyle={{ padding: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{ flex: 1 / 4, aspectRatio: 1, padding: 6 }}
                  onPress={() => handleSendMessage(item.url, 'STICKER')}
                >
                  <Image source={{ uri: item.url }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {/* Attachment Preview Modal */}
      {pendingFile && (
        <Modal visible transparent animationType="slide">
          <View style={styles.previewContainer}>
            <View style={styles.previewHeader}>
              <TouchableOpacity onPress={() => setPendingFile(null)}>
                <Ionicons name="close" size={26} color="#e9edef" />
              </TouchableOpacity>
              <Text style={styles.previewHeaderTitle}>{pendingFile.name}</Text>
              <View style={{ width: 26 }} />
            </View>

            <View style={styles.previewImageBox}>
              <Image source={{ uri: pendingFile.uri }} style={styles.previewImage} resizeMode="contain" />
            </View>

            <View style={styles.previewBottomBar}>
              <TextInput
                style={styles.previewCaptionInput}
                placeholder="Add a caption..."
                placeholderTextColor="#8696a0"
                value={pendingCaption}
                onChangeText={setPendingCaption}
              />
              <TouchableOpacity
                style={styles.previewSendCircle}
                onPress={handleConfirmSendAttachment}
                disabled={uploadingFile}
              >
                {uploadingFile ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Ionicons name="send" size={20} color="#000" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Fullscreen Calling Interface */}
      {activeCall && (
        <Modal visible animationType="slide">
          <View style={styles.callingOverlay}>
            <View style={styles.callingTop}>
              <View style={styles.callingAvatar}>
                <Ionicons name="person" size={48} color="#25D366" />
              </View>
              <Text style={styles.callingTargetName}>{activeCall.targetName}</Text>
              <Text style={styles.callingStatusText}>
                {activeCall.status === 'calling'
                  ? 'Calling...'
                  : `${activeCall.isVideo ? 'Video' : 'Voice'} Call • ${formatDuration(activeCall.duration)}`}
              </Text>
            </View>

            <View style={styles.callingControls}>
              <TouchableOpacity
                style={styles.callCtrlBtn}
                onPress={() => setActiveCall((prev) => (prev ? { ...prev, isMuted: !prev.isMuted } : null))}
              >
                <Ionicons name={activeCall.isMuted ? 'mic-off' : 'mic'} size={26} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.callCtrlBtn, styles.hangupBtn]} onPress={handleHangupCall}>
                <Ionicons name="call" size={30} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f13',
  },
  topHeader: {
    height: 60,
    backgroundColor: '#0a0f13',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2026',
    paddingTop: Platform.OS === 'android' ? 8 : 0,
  },
  backBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2428',
    borderRadius: 16,
    paddingRight: 10,
    paddingLeft: 4,
    paddingVertical: 4,
    marginRight: 10,
  },
  backBadgeText: {
    color: '#e9edef',
    fontSize: 15,
    fontWeight: '700',
  },
  avatarBox: {
    position: 'relative',
    marginRight: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1e3a5f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  clockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0a0f13',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContactName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  callCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2428',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 16,
  },
  callIconBtn: {
    padding: 2,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContent: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 6,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  outgoingWrapper: {
    justifyContent: 'flex-end',
  },
  incomingWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  outgoingBubble: {
    backgroundColor: '#005c4b',
    borderTopRightRadius: 2,
  },
  incomingBubble: {
    backgroundColor: '#1f2428',
    borderTopLeftRadius: 2,
  },
  messageText: {
    color: '#ffffff',
    fontSize: 15.5,
    lineHeight: 20.5,
  },
  replyPreviewCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 6,
    padding: 6,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#f43f5e',
  },
  replyAccentBar: {
    width: 0,
  },
  replyContent: {
    flex: 1,
    paddingLeft: 6,
  },
  replyAuthor: {
    color: '#f43f5e',
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  replySnippet: {
    color: '#94a3b8',
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timeText: {
    color: 'rgba(233, 237, 239, 0.65)',
    fontSize: 11,
  },
  imageBubble: {
    width: 240,
    height: 190,
    borderRadius: 8,
  },
  stickerBubble: {
    width: 140,
    height: 140,
  },
  bottomBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#0a0f13',
    gap: 8,
  },
  plusBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputCapsule: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2428',
    borderRadius: 22,
    paddingHorizontal: 14,
    minHeight: 44,
  },
  messageInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  stickerPageBtn: {
    padding: 4,
  },
  rupeeCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1f2428',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rupeeSymbolText: {
    color: '#e9edef',
    fontSize: 17,
    fontWeight: '700',
  },
  cameraCircleBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenActionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  attachmentSheet: {
    backgroundColor: '#1f2428',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  attachmentGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  attachmentOption: {
    alignItems: 'center',
  },
  optionCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  optionLabel: {
    color: '#e9edef',
    fontSize: 12,
    fontWeight: '500',
  },
  mediaPickerContainer: {
    height: 280,
    backgroundColor: '#1f2428',
    borderTopWidth: 1,
    borderTopColor: '#2b3036',
  },
  pickerTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2b3036',
  },
  pickerTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  pickerTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#25D366',
  },
  pickerTabTitle: {
    color: '#e9edef',
    fontSize: 13,
    fontWeight: '600',
  },
  emojiItem: {
    width: SCREEN_WIDTH / 8 - 2,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#0a0f13',
  },
  previewHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  previewHeaderTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewImageBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1f2428',
    gap: 8,
  },
  previewCaptionInput: {
    flex: 1,
    backgroundColor: '#2a3138',
    color: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  previewSendCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callingOverlay: {
    flex: 1,
    backgroundColor: '#0a0f13',
    justifyContent: 'space-between',
    paddingVertical: 60,
    alignItems: 'center',
  },
  callingTop: {
    alignItems: 'center',
  },
  callingAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1f2428',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  callingTargetName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  callingStatusText: {
    color: '#25D366',
    fontSize: 15,
  },
  callingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  callCtrlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1f2428',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hangupBtn: {
    backgroundColor: '#f15c6d',
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  emptyMessagesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  e2eeBanner: {
    backgroundColor: '#1f2428',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 16,
    maxWidth: '90%',
  },
  e2eeBannerText: {
    color: '#8696a0',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyMessagesSubtitle: {
    color: '#8696a0',
    fontSize: 14,
  },
});
