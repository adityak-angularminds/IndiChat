import { generateUUID } from './uuid';

const DEVICE_ID_KEY = 'chat_device_id';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: 'linux' | 'windows' | 'mac' | 'ios' | 'android' | 'web';
  browser: string;
}

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'unknown-device';
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function resetDeviceId(): string {
  if (typeof window !== 'undefined') {
    const newId = generateUUID();
    localStorage.setItem(DEVICE_ID_KEY, newId);
    return newId;
  }
  return 'unknown-device';
}

export function getDeviceDetails(): DeviceInfo {
  const deviceId = getDeviceId();
  if (typeof navigator === 'undefined') {
    return {
      deviceId,
      deviceName: 'Web Browser',
      platform: 'web',
      browser: 'Chrome',
    };
  }

  const ua = navigator.userAgent;
  let platform: 'linux' | 'windows' | 'mac' | 'ios' | 'android' | 'web' = 'web';
  let browser = 'Chrome';

  if (/iPhone|iPad|iPod/i.test(ua)) {
    platform = 'ios';
  } else if (/Android/i.test(ua)) {
    platform = 'android';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    platform = 'mac';
  } else if (/Windows NT/i.test(ua)) {
    platform = 'windows';
  } else if (/Linux/i.test(ua)) {
    platform = 'linux';
  }

  if (/Edg\//i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/Firefox\//i.test(ua)) {
    browser = 'Firefox';
  } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
    browser = 'Safari';
  } else if (/Chrome\//i.test(ua)) {
    browser = 'Google Chrome';
  }

  const platformDisplayNames: Record<string, string> = {
    linux: 'Linux',
    windows: 'Windows',
    mac: 'macOS',
    ios: 'iOS',
    android: 'Android',
    web: 'Web',
  };

  const name = `${browser} (${platformDisplayNames[platform] || 'Web'})`;

  return {
    deviceId,
    deviceName: name,
    platform,
    browser,
  };
}
