/**
 * Cross-platform UUID v4 generator that works in both secure contexts (HTTPS, localhost)
 * and non-secure contexts (e.g. HTTP over LAN IP http://192.168.x.x on mobile/secondary devices).
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback if crypto.randomUUID fails
    }
  }

  // RFC 4122 version 4 compliant fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
