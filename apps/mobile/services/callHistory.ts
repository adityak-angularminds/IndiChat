import { storage, STORAGE_KEYS } from './storage';
import { formatCallTimeAge } from '../utils/timeAgo';

export interface CallHistoryItem {
  id: string;
  conversationId?: string;
  contactName: string;
  targetUserId?: string;
  subtitle?: string;
  callCount?: number;
  type: 'incoming' | 'outgoing' | 'missed';
  isVideo: boolean;
  timeStr: string;
  timestamp: number;
  duration?: string;
  dataUsed?: string;
}

type CallHistoryListener = (calls: CallHistoryItem[]) => void;
const listeners = new Set<CallHistoryListener>();

export const callHistoryService = {
  async getHistory(): Promise<CallHistoryItem[]> {
    const list = await storage.getJson<CallHistoryItem[]>(STORAGE_KEYS.CALL_HISTORY);
    if (list && list.length > 0) {
      return list;
    }

    const now = Date.now();
    const y1515 = new Date();
    y1515.setDate(y1515.getDate() - 1);
    y1515.setHours(15, 15, 0, 0);

    const today0112 = new Date();
    today0112.setHours(1, 12, 0, 0);
    const t0112 = today0112.getTime() > now ? now - 2 * 3600 * 1000 : today0112.getTime();

    const d3 = new Date();
    d3.setDate(d3.getDate() - 3);
    d3.setHours(11, 30, 0, 0);

    const initial: CallHistoryItem[] = [
      {
        id: 'call-sample-1',
        contactName: '+91 90285 89545',
        type: 'outgoing',
        isVideo: false,
        duration: 'No answer',
        subtitle: 'No answer',
        timestamp: t0112,
        timeStr: formatCallTimeAge(t0112),
      },
      {
        id: 'call-sample-2',
        contactName: '+91 90285 89545',
        type: 'incoming',
        isVideo: false,
        duration: '11 sec',
        subtitle: '11 sec',
        timestamp: y1515.getTime(),
        timeStr: formatCallTimeAge(y1515.getTime()),
      },
      {
        id: 'call-sample-3',
        contactName: 'Alice Cooper',
        type: 'incoming',
        isVideo: false,
        duration: '1 min 20 sec',
        subtitle: '1 min 20 sec',
        timestamp: now - 70 * 1000,
        timeStr: formatCallTimeAge(now - 70 * 1000),
      },
      {
        id: 'call-sample-4',
        contactName: 'Bob Dylan',
        type: 'outgoing',
        isVideo: true,
        duration: '5 min 42 sec',
        subtitle: '5 min 42 sec',
        timestamp: now - 15 * 60 * 1000,
        timeStr: formatCallTimeAge(now - 15 * 60 * 1000),
      },
      {
        id: 'call-sample-5',
        contactName: 'Charlie',
        type: 'missed',
        isVideo: false,
        duration: 'Missed',
        subtitle: 'Missed',
        timestamp: now - 2 * 3600 * 1000,
        timeStr: formatCallTimeAge(now - 2 * 3600 * 1000),
      },
      {
        id: 'call-sample-6',
        contactName: 'David Miller',
        type: 'outgoing',
        isVideo: false,
        duration: '3 min',
        subtitle: '3 min',
        timestamp: d3.getTime(),
        timeStr: formatCallTimeAge(d3.getTime()),
      },
    ];

    await storage.setJson(STORAGE_KEYS.CALL_HISTORY, initial);
    return initial;
  },

  async addCall(params: {
    contactName: string;
    conversationId?: string;
    targetUserId?: string;
    isVideo: boolean;
    type: 'incoming' | 'outgoing' | 'missed';
    duration?: string;
    subtitle?: string;
    timestamp?: number;
  }): Promise<CallHistoryItem[]> {
    const timestamp = params.timestamp || Date.now();
    const newCall: CallHistoryItem = {
      id: `call-${timestamp}-${Math.random().toString(36).slice(2, 6)}`,
      conversationId: params.conversationId,
      contactName: params.contactName,
      targetUserId: params.targetUserId,
      subtitle: params.subtitle || params.duration,
      type: params.type,
      isVideo: params.isVideo,
      timestamp,
      timeStr: formatCallTimeAge(timestamp),
      duration: params.duration || (params.type === 'missed' ? 'Missed' : '0 sec'),
    };

    const current = await this.getHistory();
    const updated = [newCall, ...current.filter((c) => c.id !== newCall.id)];
    await storage.setJson(STORAGE_KEYS.CALL_HISTORY, updated);
    listeners.forEach((fn) => fn(updated));
    return updated;
  },

  onHistoryChange(fn: CallHistoryListener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  async clearHistory(): Promise<void> {
    await storage.setJson(STORAGE_KEYS.CALL_HISTORY, []);
    listeners.forEach((fn) => fn([]));
  },
};
