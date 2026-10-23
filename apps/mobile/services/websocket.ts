import {
  Message,
  MessageReceipt,
  TypingEventPayload,
  PresenceEventPayload,
  CallSignalPayload,
  SendMessagePayload,
  WebSocketMessage
} from '@chat/shared-types';
import { generateUUID } from '../utils/uuid';
import { getDeviceId } from '../utils/device';
import { getApiBaseUrl } from './api';

type MessageCreatedHandler = (message: Message) => void;
type ReceiptUpdatedHandler = (receipt: MessageReceipt) => void;
type TypingUpdatedHandler = (event: TypingEventPayload) => void;
type PresenceUpdatedHandler = (event: PresenceEventPayload) => void;
type CallSignalHandler = (signal: CallSignalPayload) => void;
type DeviceRemovedHandler = (reason: string) => void;
type ConnectionStatusHandler = (connected: boolean) => void;

class WebSocketClient {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private reconnectTimeout: any = null;
  private isExplicitlyClosed = false;

  private messageCreatedListeners = new Set<MessageCreatedHandler>();
  private receiptUpdatedListeners = new Set<ReceiptUpdatedHandler>();
  private typingUpdatedListeners = new Set<TypingUpdatedHandler>();
  private presenceUpdatedListeners = new Set<PresenceUpdatedHandler>();
  private callSignalListeners = new Set<CallSignalHandler>();
  private deviceRemovedListeners = new Set<DeviceRemovedHandler>();
  private connectionStatusListeners = new Set<ConnectionStatusHandler>();

  public async connect(token: string) {
    this.token = token;
    this.isExplicitlyClosed = false;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const baseUrl = await getApiBaseUrl();
      const wsProtocol = baseUrl.startsWith('https') ? 'wss:' : 'ws:';
      const hostPart = baseUrl.replace(/^https?:\/\//, '');
      const deviceId = await getDeviceId();
      const wsUrl = `${wsProtocol}//${hostPart}/ws?token=${encodeURIComponent(token)}&deviceId=${encodeURIComponent(deviceId)}`;

      console.log('[WebSocket] Connecting to:', wsUrl);
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('[WebSocket] Connected');
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
        this.notifyStatus(true);
      };

      this.socket.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          this.handleServerMessage(data);
        } catch (e) {
          console.error('[WebSocket] Failed to parse message', e);
        }
      };

      this.socket.onclose = (event) => {
        console.log('[WebSocket] Disconnected', event.code, event.reason);
        this.notifyStatus(false);

        if (event.code === 4001) {
          this.isExplicitlyClosed = true;
          const reason = event.reason || 'Device session has been removed or logged out.';
          this.deviceRemovedListeners.forEach((fn) => fn(reason));
          return;
        }

        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (err) => {
        console.warn('[WebSocket] Error', err);
        this.notifyStatus(false);
      };
    } catch (e) {
      console.warn('[WebSocket] Connection failed to initialize', e);
      this.scheduleReconnect();
    }
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.notifyStatus(false);
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout || !this.token || this.isExplicitlyClosed) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (this.token && !this.isExplicitlyClosed) {
        this.connect(this.token);
      }
    }, 2500);
  }

  private handleServerMessage(msg: WebSocketMessage) {
    switch (msg.type) {
      case 'message.created':
        this.messageCreatedListeners.forEach((fn) => fn(msg.payload as Message));
        break;
      case 'message.receipt.updated':
        this.receiptUpdatedListeners.forEach((fn) => fn(msg.payload as MessageReceipt));
        break;
      case 'typing.updated':
        this.typingUpdatedListeners.forEach((fn) => fn(msg.payload as TypingEventPayload));
        break;
      case 'presence.updated':
        this.presenceUpdatedListeners.forEach((fn) => fn(msg.payload as PresenceEventPayload));
        break;
      case 'call.signal':
        this.callSignalListeners.forEach((fn) => fn(msg.payload as CallSignalPayload));
        break;
      case 'DEVICE_REMOVED':
        this.isExplicitlyClosed = true;
        {
          const reason = (msg.payload as any)?.reason || 'This device has been removed from linked devices.';
          this.deviceRemovedListeners.forEach((fn) => fn(reason));
        }
        break;
    }
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  private notifyStatus(connected: boolean) {
    this.connectionStatusListeners.forEach((fn) => fn(connected));
  }

  private send(action: string, payload: unknown, requestId?: string): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify({
          type: action,
          requestId: requestId || generateUUID(),
          payload,
        }));
        return true;
      } catch (err) {
        console.warn('[WebSocket] Send failed', err);
        return false;
      }
    }
    return false;
  }

  public sendMessage(payload: SendMessagePayload): boolean {
    return this.send('message.send', payload);
  }

  public markDelivered(messageId: string, conversationId: string) {
    this.send('message.delivered', { messageId, conversationId });
  }

  public markRead(messageId: string, conversationId: string) {
    this.send('message.read', { messageId, conversationId });
  }

  public sendTyping(conversationId: string, isTyping: boolean) {
    this.send(isTyping ? 'typing.start' : 'typing.stop', { conversationId });
  }

  public sendCallSignal(signal: CallSignalPayload) {
    this.send('call.signal', signal);
  }

  // Listener subscriptions
  public onConnectionStatus(fn: ConnectionStatusHandler) {
    this.connectionStatusListeners.add(fn);
    fn(this.isConnected());
    return () => { this.connectionStatusListeners.delete(fn); };
  }

  public onMessageCreated(fn: MessageCreatedHandler) {
    this.messageCreatedListeners.add(fn);
    return () => { this.messageCreatedListeners.delete(fn); };
  }

  public onReceiptUpdated(fn: ReceiptUpdatedHandler) {
    this.receiptUpdatedListeners.add(fn);
    return () => { this.receiptUpdatedListeners.delete(fn); };
  }

  public onTypingUpdated(fn: TypingUpdatedHandler) {
    this.typingUpdatedListeners.add(fn);
    return () => { this.typingUpdatedListeners.delete(fn); };
  }

  public onPresenceUpdated(fn: PresenceUpdatedHandler) {
    this.presenceUpdatedListeners.add(fn);
    return () => { this.presenceUpdatedListeners.delete(fn); };
  }

  public onCallSignal(fn: CallSignalHandler) {
    this.callSignalListeners.add(fn);
    return () => { this.callSignalListeners.delete(fn); };
  }

  public onDeviceRemoved(fn: DeviceRemovedHandler) {
    this.deviceRemovedListeners.add(fn);
    return () => { this.deviceRemovedListeners.delete(fn); };
  }
}

export const wsClient = new WebSocketClient();
