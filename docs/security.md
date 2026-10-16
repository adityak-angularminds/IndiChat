# Security Architecture & Policies

## Authentication & Authorization
- **Password Storage**: Passwords are saved using BCrypt cryptographic hash with work factor 12.
- **Access Tokens**: Short-lived (15-60 min) signed JSON Web Tokens (HMAC-SHA256).
- **Refresh Tokens**: Revocable tokens stored securely in PostgreSQL with hashed validation.
- **Resource Ownership Authorization**: Every REST endpoint and WebSocket frame validates that the requesting user is a legitimate member of the conversation before retrieving or creating messages. Knowing a UUID does not permit unauthorized read or write access.
- **WebSocket Handshake**: Validates JWT signature and expiration before upgrading socket connection.

## Data Protection & Transport
- **Transport Layer**: Strict HTTPS and WSS in transit.
- **DDoS / Rate Limiting**: Redis token-bucket rate limit on auth endpoints and message sending.
- **Attachment Protection**: Object storage with pre-signed URLs, content-type verification, and file size limits.
- **E2EE Roadmap**: Architecture leaves message payloads adaptable for client-side Signal protocol / Double Ratchet encryption in Phase 7.
