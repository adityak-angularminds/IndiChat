import { Platform } from 'react-native';
import { storage, STORAGE_KEYS } from '../services/storage';
import { generateUUID } from './uuid';

export interface MobileDeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: 'android' | 'ios' | 'web';
  browser: string;
}

let cachedDeviceId: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  const stored = await storage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (stored) {
    cachedDeviceId = stored;
    return stored;
  }

  const newId = generateUUID();
  cachedDeviceId = newId;
  await storage.setItem(STORAGE_KEYS.DEVICE_ID, newId);
  return newId;
}

export async function resetDeviceId(): Promise<string> {
  const newId = generateUUID();
  cachedDeviceId = newId;
  await storage.setItem(STORAGE_KEYS.DEVICE_ID, newId);
  return newId;
}

export async function getDeviceDetails(): Promise<MobileDeviceInfo> {
  const deviceId = await getDeviceId();
  const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
  const platformName = Platform.OS === 'ios' ? 'Apple iOS' : Platform.OS === 'android' ? 'Android Device' : 'Mobile Web';
  const deviceName = `${platformName} (IndiChat Mobile)`;

  return {
    deviceId,
    deviceName,
    platform,
    browser: 'IndiChat Mobile App',
  };
}
