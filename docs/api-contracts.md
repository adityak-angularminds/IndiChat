# API Contracts & WebSocket Specifications

## REST API (Base: `/api/v1`)

### Authentication
- `POST /auth/register`
  - Body: `{ "phoneNumber": "+1234567890", "username": "alice", "email": "alice@example.com", "password": "...", "displayName": "Alice" }`
  - Response 201: `{ "accessToken": "...", "refreshToken": "...", "user": { ... } }`
- `POST /auth/login`
  - Body: `{ "usernameOrEmail": "alice", "password": "..." }`
  - Response 200: `{ "accessToken": "...", "refreshToken": "...", "user": { ... } }`
- `POST /auth/refresh`
  - Body: `{ "refreshToken": "..." }`
  - Response 200: `{ "accessToken": "...", "refreshToken": "..." }`

### Users & Discovery
- `GET /users/me` -> `{ "id": "...", "displayName": "...", "status": "ACTIVE", ... }`
- `GET /users/search?q={query}` -> `[ { "id": "...", "username": "...", "displayName": "...", "avatarKey": "..." } ]`

### Conversations
- `GET /conversations` -> List of user's active conversations with unreadCount, lastMessage, and participants.
- `POST /conversations`
  - Body: `{ "type": "DIRECT"|"GROUP", "participantIds": ["..."], "title": "Optional group title" }`
  - Response 201: `{ "id": "...", "type": "...", "members": [...], ... }`
- `GET /conversations/{id}/messages?cursor={created_at}&limit=50`
  - Response: `{ "messages": [...], "hasMore": boolean, "nextCursor": "..." }`

---

## WebSocket Protocol (`/ws?token={jwt}`)

### Client to Server
1. **Send Message**:
   ```json
   {
     "type": "message.send",
     "requestId": "UUID",
     "payload": {
       "conversationId": "UUID",
       "clientMessageId": "UUID",
       "messageType": "TEXT",
       "content": "Hello world!",
       "replyToId": null
     }
   }
   ```
2. **Delivery Receipt**:
   ```json
   {
     "type": "message.delivered",
     "payload": { "messageId": "UUID", "conversationId": "UUID" }
   }
   ```
3. **Read Receipt**:
   ```json
   {
     "type": "message.read",
     "payload": { "messageId": "UUID", "conversationId": "UUID" }
   }
   ```
4. **Typing Indicators**:
   ```json
   { "type": "typing.start", "payload": { "conversationId": "UUID" } }
   { "type": "typing.stop", "payload": { "conversationId": "UUID" } }
   ```
5. **Presence & Signaling**:
   ```json
   { "type": "presence.subscribe", "payload": { "userIds": ["UUID"] } }
   { "type": "call.signal", "payload": { "targetUserId": "UUID", "signal": { ... } } }
   ```

### Server to Client
- `message.created`: Sent to all active conversation members.
- `message.receipt.updated`: Updated receipt (delivered / read timestamps).
- `typing.updated`: Real-time typing notification `{ "conversationId": "UUID", "userId": "UUID", "isTyping": true|false }`.
- `presence.updated`: Real-time user presence `{ "userId": "UUID", "isOnline": true|false, "lastSeenAt": "..." }`.
- `call.signal`: WebRTC signaling peer exchange.
