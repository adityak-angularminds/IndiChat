import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Conversation,
  CreateConversationRequest,
  MessageHistoryResponse,
  Message,
  SendMessagePayload
} from '@chat/shared-types';

const API_BASE = '/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('chat_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `Request failed: ${res.statusText}`;
    try {
      const data = await res.json();
      if (data.message) errorMsg = data.message;
    } catch {
      // fallback
    }
    throw new ApiError(res.status, errorMsg);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const api = {
  // Auth
  register: (data: RegisterRequest) => request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  login: (data: LoginRequest) => request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Users
  getMe: () => request<User>('/users/me'),
  searchUsers: (query: string) => request<User[]>(`/users/search?q=${encodeURIComponent(query)}`),

  // Conversations
  getConversations: () => request<Conversation[]>('/conversations'),
  createConversation: (data: CreateConversationRequest) => request<Conversation>('/conversations', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Messages
  getMessages: (conversationId: string, cursor?: string, limit = 50) => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (cursor) params.set('cursor', cursor);
    return request<MessageHistoryResponse>(`/conversations/${conversationId}/messages?${params.toString()}`);
  },

  sendMessage: (payload: SendMessagePayload) => request<Message>('/messages', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  markDelivered: (messageId: string) => request<void>(`/messages/${messageId}/delivered`, {
    method: 'POST',
  }),

  markRead: (messageId: string) => request<void>(`/messages/${messageId}/read`, {
    method: 'POST',
  }),
};
