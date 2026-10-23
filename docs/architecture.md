# IndiChat — System Architecture & Data Flow

## 1. System Overview

IndiChat is engineered as a high-performance, modular monolith supporting multi-platform real-time chat, rich media exchange, WebRTC audio/video call signaling, and multi-device session management across Web, Mobile, and Backend.

```
+---------------------------------------------------------------------------------------+
|                                    Client Tier                                        |
|  +------------------------------------------+  +------------------------------------+ |
|  |           React 19 Web Client            |  |     React Native / Expo Mobile     | |
|  |  (Vite + TypeScript + Vanilla CSS)       |  |   (Expo Router v4 + Android APK)   | |
|  +------------------------------------------+  +------------------------------------+ |
+---------------------------------------------------------------------------------------+
                 | REST APIs (HTTP/HTTPS)                   | WebSocket (WS/WSS)
                 v                                          v
+---------------------------------------------------------------------------------------+
|                                Spring Boot 3.4 Gateway                                |
|  - Security & Authentication (BCrypt, JWT Access/Refresh tokens)                      |
|  - Users, Contacts & Social Graph                                                     |
|  - Conversations & Keyset Pagination History                                          |
|  - Real-Time WebSocket Engine (ChatWebSocketHandler)                                  |
|  - Delivery & Read Receipts Engine (✓ / ✓✓ / ✓✓ blue)                                 |
|  - MinIO S3 Storage Adapter (multipart upload, streaming downloads)                  |
|  - WebRTC Call Signaling Relay (offers, answers, ICE candidates)                      |
|  - Remote Device Revocation Engine (instant socket disconnect)                        |
+---------------------------------------------------------------------------------------+
         |                                   |                              |
         v                                   v                              v
+------------------+               +-------------------+          +-------------------+
|  PostgreSQL 16   |               |      Redis 7      |          |    MinIO / S3     |
| (Port: 5554)     |               | (Port: 6379)      |          | (Port: 9000/9001) |
| - Users & Auth   |               | - Online Presence |          | - Photos & Media  |
| - Conversations  |               | - Last Seen Cache |          | - Voice Notes     |
| - Messages       |               | - Typing States   |          | - Documents       |
| - Receipts       |               | - Pub/Sub Hub     |          | - Attachments     |
| - Linked Devices |               | - Rate Limiting   |          |                   |
| - User Settings  |               +-------------------+          +-------------------+
+------------------+
```

---

## 2. Real-Time Messaging & Receipts Engine

IndiChat implements strict message delivery and receipt lifecycles matching WhatsApp standards:

```
[Sender Client]                    [Spring Boot Backend]                 [Recipient Client]
       |                                     |                                   |
       |--- 1. message.send ---------------->|                                   |
       |    (conversationId, clientMsgId,..) |                                   |
       |                                     |--- 2. Write to PostgreSQL         |
       |                                     |    (status: SENT)                 |
       |<-- 3. message.created --------------|                                   |
       |    (Single Check ✓)                 |--- 4. message.created ----------->|
       |                                     |       (if recipient online)       |
       |                                     |                                   |
       |                                     |<-- 5. message.delivered ----------|
       |                                     |    (Write deliveredAt to DB)      |
       |<-- 6. message.receipt.updated ------|                                   |
       |    (Double Check ✓✓)                |                                   |
       |                                     |                                   |
       |                                     |<-- 7. message.read ---------------|
       |                                     |    (Write readAt to DB)           |
       |<-- 8. message.receipt.updated ------|                                   |
       |    (Double Blue Check ✓✓)           |                                   |
```

### Offline Reconciliation Mechanism
When a recipient is offline at the moment a message is sent:
1. The message is stored in PostgreSQL with no `delivered_at` timestamp.
2. The sender sees a single checkmark `✓`.
3. When the recipient reconnects and establishes a WebSocket handshake, `ChatWebSocketHandler.afterConnectionEstablished()` invokes `messageService.markAllPendingDeliveredForUser(recipientId)`.
4. All pending messages are marked delivered in PostgreSQL in a single batch.
5. The backend dispatches `message.receipt.updated` frames to all senders, updating their UI from single check `✓` to double check `✓✓` immediately.

---

## 3. Media & Object Storage Pipeline

IndiChat supports images, videos, audio notes, stickers, and documents:

1. **Upload Initiation**:
   - **Web**: HTML file input attaches file to a standard `FormData` payload and posts to `/api/v1/files/upload`.
   - **Mobile (React Native)**: Native file upload via `expo-file-system` (`uploadAsync` or `File`) avoids React Native's Android binary upload corruption (`Unsupported FormDataPart implementation`).
2. **Storage Processing**:
   - Spring Boot receives multipart file.
   - Computes unique file UUID and stores binary into MinIO S3 bucket `chat-attachments`.
   - Returns metadata: `fileId`, `fileName`, `fileType`, `mimeType`, `fileSize`, `fileUrl`.
3. **Distribution**:
   - Sender transmits a chat message with `messageType: IMAGE | VIDEO | AUDIO | DOCUMENT | STICKER` containing the file URL.
   - Recipient renders inline preview or streams media via `/api/v1/files/download/{fileId}/{fileName}`.

---

## 4. Multi-Device Sessions & Remote Revocation

Users can link multiple browser instances, mobile phones, or desktop apps:

1. **Device Identification**:
   - Each client generates a persistent UUID stored in `localStorage` or `AsyncStorage`.
   - Sent via `X-Device-Id` HTTP header and WebSocket query param `?deviceId=...`.
2. **Session Inspection**:
   - Users view active devices under **Settings -> Linked Devices** (`GET /api/v1/devices`).
3. **Instant Remote Revocation**:
   - When a user deletes a device or triggers "Log out from all other devices":
   - The record is purged from `user_linked_devices`.
   - `ChatWebSocketHandler.disconnectDevice()` finds the active WebSocket session for that device ID.
   - Emits a `{ "type": "DEVICE_REMOVED", "payload": { "reason": "..." } }` frame.
   - Immediately closes the WebSocket connection with status code `4001`.
   - The revoked device catches the event and immediately resets to the login view.

---

## 5. WebRTC Audio & Video Calling Architecture

- **Signaling Coordination**: WebRTC peer connections exchange SDP offers, SDP answers, and ICE candidate candidates through the backend via WebSocket type `call.signal`.
- **Target Resolution**: Sockets route call signals either directly to a `targetUserId` or dynamically resolve participant IDs from a `conversationId`.
- **Push Notification Trigger**: When an `offer` signal is sent to an offline or backgrounded user, the backend automatically dispatches an urgent push notification alerting them of the incoming call.
- **Audio Feedback**: The web client synthesizes realistic ringtones, dial tones, and audio cues using the Web Audio API (`callAudio.ts`).
- **Call Logging & In-Chat Bubbles**: Call start, duration, and completion are logged in the local call history and rendered as dedicated call status bubbles inside the chat thread.

---

## 6. Android Build & Packaging Pipeline

```
[Developer / CI CLI]
       |
       |--- npm run build:android (scripts/build-android.js)
       |
       +---> Auto-detect ANDROID_HOME & Java 17/21
       +---> Verify gradlew execution permissions
       +---> Run Gradle :app:assembleRelease / :app:bundleRelease
       +---> Collect output binaries from apps/mobile/android/app/build/outputs/
       +---> Copy artifacts to release/android/IndiChat-release-<timestamp>.[apk|aab]
```
