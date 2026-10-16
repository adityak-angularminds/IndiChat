# WhatsApp-like Messaging Application — System Architecture

## Overview
This platform is engineered as a high-performance, modular monolith supporting multi-device real-time chat, media sharing, and call signaling.

```
+--------------------------------------------------------------------------+
|                             Client Layer                                 |
|   +----------------------------------+ +-------------------------------+ |
|   |       React + TypeScript Web     | |    React Native + Expo Mobile | |
|   +----------------------------------+ +-------------------------------+ |
+--------------------------------------------------------------------------+
             | REST APIs (HTTPS)                  | WebSocket / WSS
             v                                    v
+--------------------------------------------------------------------------+
|                       Spring Boot 3.4 API Gateway                        |
|  - Auth & JWT Security (Access & Refresh Tokens)                         |
|  - User & Profile Management                                             |
|  - Conversations & Membership Verification                               |
|  - Real-time Message Routing & Outbox Guarantee                          |
|  - Delivery & Read Receipts Engine                                       |
|  - Redis Presence & Cross-Instance Event Pub/Sub                         |
|  - WebRTC Signaling Coordinator                                          |
+--------------------------------------------------------------------------+
       |                                   |                    |
       v                                   v                    v
+------------------+             +-------------------+  +------------------+
|    PostgreSQL    |             |       Redis       |  |   MinIO / S3     |
| Durable Storage: |             | Ephemeral Layer:  |  | Media Storage:   |
| - Users & Auth   |             | - Online Presence |  | - Images         |
| - Conversations  |             | - Typing States   |  | - Audio Notes    |
| - Messages       |             | - Pub/Sub Hub     |  | - Attachments    |
| - Receipts       |             | - Rate Limiting   |  |                  |
+------------------+             +-------------------+  +------------------+
```

## Core Real-Time Flow
1. **Connection & Authentication**: Client establishes WebSocket handshake with JWT credential.
2. **Persistence Guarantee**: Sender emits `message.send` event. The server verifies membership, creates the message record in PostgreSQL, and generates a canonical timestamp and UUID.
3. **Delivery Routing**: Server publishes event locally or via Redis pub/sub. Active recipients receive `message.created`.
4. **Receipts Lifecycle**:
   - Sent: Message persisted on server (1 grey checkmark).
   - Delivered: Recipient socket acknowledges receipt with `message.delivered` (2 grey checkmarks).
   - Read: Recipient opens conversation triggering `message.read` (2 blue/cyan checkmarks).
