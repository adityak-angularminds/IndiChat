/**
 * Application Configuration
 *
 * Configurable application name via environment variable `VITE_APP_NAME` or `APP_NAME`.
 * Defaults seamlessly to 'IndiChat'.
 */
export const APP_NAME: string =
  (import.meta.env.VITE_APP_NAME as string)?.trim() || 'IndiChat';

export const APP_TAGLINE: string = 'Real-Time Messenger';

export const APP_FULL_TITLE: string = `${APP_NAME} Web — ${APP_TAGLINE}`;

export const APP_DESCRIPTION: string =
  `${APP_NAME} — Production-ready real-time messaging platform with end-to-end messaging, presence, receipts, and calls.`;
