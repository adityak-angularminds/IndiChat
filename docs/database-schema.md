# Database Schema & Data Models

This document details the PostgreSQL relational database schema managed via **Flyway migrations** (`backend/src/main/resources/db/migration/`).

---

## 1. Schema Design Principles
- **Identifier Strategy**: All primary keys are UUIDs generated using `gen_random_uuid()`.
- **Temporal Integrity**: All date/time fields use `TIMESTAMPTZ` (UTC timestamp with time zone).
- **Referential Integrity**: Cascading deletes (`ON DELETE CASCADE`) are applied to child rows where lifecycle is tied to the parent entity (e.g. conversation members, receipts, settings, linked devices).
- **Performance Indexing**: Keyset pagination indexes, composite lookup indexes, and unique constraints are defined explicitly.

---

## 2. Table Specifications

### 1. `users` (Migration: `V1`)
Primary user credentials and profile records.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique user identifier |
| `phone_number` | VARCHAR(20) | UNIQUE, NULLABLE | Optional phone number for mobile login |
| `email` | VARCHAR(255) | UNIQUE, NULLABLE | Email address |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | Unique handle |
| `password_hash`| TEXT | NULLABLE | BCrypt password hash (work factor 12) |
| `display_name` | VARCHAR(100) | NOT NULL | Human-readable user name |
| `avatar_key` | TEXT | NULLABLE | MinIO S3 object key for user avatar |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | Registration timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | Profile last modified |
| `last_seen_at` | TIMESTAMPTZ | NULLABLE | Last recorded online activity |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT `'ACTIVE'` | Account state (`ACTIVE`, `INACTIVE`, `SUSPENDED`) |

---

### 2. `conversations` (Migration: `V1`)
Direct and group chat rooms.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Conversation identifier |
| `type` | VARCHAR(10) | NOT NULL, CHECK in (`DIRECT`, `GROUP`) | Direct 1:1 or multi-party chat |
| `title` | VARCHAR(150) | NULLABLE | Optional group conversation title |
| `created_by` | UUID | REFERENCES `users(id)` | Creator user ID |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | Latest activity timestamp |

---

### 3. `conversation_members` (Migration: `V1`)
Membership mapping and user conversation state.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `conversation_id` | UUID | NOT NULL, REFERENCES `conversations(id)` ON DELETE CASCADE | Target conversation |
| `user_id` | UUID | NOT NULL, REFERENCES `users(id)` ON DELETE CASCADE | Participant user ID |
| `role` | VARCHAR(20) | NOT NULL, DEFAULT `'MEMBER'` | Role (`ADMIN`, `MEMBER`) |
| `joined_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | Join timestamp |
| `last_read_message_id` | UUID | NULLABLE | Pointer to last read message |
| `muted_until` | TIMESTAMPTZ | NULLABLE | Notification mute expiry |

**Primary Key**: `(conversation_id, user_id)`

---

### 4. `messages` (Migration: `V1`)
Individual chat messages, multimedia, voice notes, stickers, and calls.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Canonical server message UUID |
| `conversation_id` | UUID | NOT NULL, REFERENCES `conversations(id)` ON DELETE CASCADE | Target conversation |
| `sender_id` | UUID | NOT NULL, REFERENCES `users(id)` | Sender user ID |
| `client_message_id` | UUID | NOT NULL | Client-side idempotency UUID |
| `type` | VARCHAR(20) | NOT NULL, DEFAULT `'TEXT'` | `TEXT`, `IMAGE`, `VIDEO`, `AUDIO`, `DOCUMENT`, `STICKER`, `CALL` |
| `content` | TEXT | NULLABLE | Text message body or media metadata JSON |
| `reply_to_id` | UUID | NULLABLE, REFERENCES `messages(id)` | Quoted reply message ID |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | Server persistence timestamp |
| `edited_at` | TIMESTAMPTZ | NULLABLE | Timestamp if message edited |
| `deleted_at` | TIMESTAMPTZ | NULLABLE | Soft delete timestamp |

**Unique Constraint**: `UNIQUE (sender_id, client_message_id)` (prevents duplicate submissions)

---

### 5. `message_receipts` (Migration: `V1`)
Per-user delivery and read acknowledgement tracking.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `message_id` | UUID | NOT NULL, REFERENCES `messages(id)` ON DELETE CASCADE | Target message |
| `user_id` | UUID | NOT NULL, REFERENCES `users(id)` ON DELETE CASCADE | Recipient user ID |
| `delivered_at` | TIMESTAMPTZ | NULLABLE | Timestamp socket delivered (Double Check ✓✓) |
| `read_at` | TIMESTAMPTZ | NULLABLE | Timestamp conversation read (Double Blue Check ✓✓) |

**Primary Key**: `(message_id, user_id)`

---

### 6. `refresh_tokens` (Migrations: `V1`, `V4`)
Cryptographically secured session refresh tokens.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Refresh token record ID |
| `user_id` | UUID | NOT NULL, REFERENCES `users(id)` ON DELETE CASCADE | Target user ID |
| `token_hash` | VARCHAR(512)| NOT NULL, UNIQUE | SHA-256 hash of refresh token |
| `expires_at` | TIMESTAMPTZ | NOT NULL | Token expiration date |
| `revoked` | BOOLEAN | NOT NULL, DEFAULT `FALSE` | Manual revocation flag |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | Generation timestamp |

---

### 7. `device_tokens` (Migration: `V2`)
Mobile and web push notification device registry.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Token record ID |
| `user_id` | UUID | NOT NULL, REFERENCES `users(id)` ON DELETE CASCADE | Target user |
| `token` | VARCHAR(512)| NOT NULL | Push notification token (e.g. Expo token) |
| `platform` | VARCHAR(32) | NOT NULL, DEFAULT `'WEB'` | `ANDROID`, `IOS`, `WEB` |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | Registration timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | Last updated timestamp |

**Unique Constraint**: `UNIQUE (user_id, token)`

---

### 8. `user_linked_devices` (Migration: `V3`)
Active devices and sessions for multi-device management.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Device session UUID |
| `user_id` | UUID | NOT NULL, REFERENCES `users(id)` ON DELETE CASCADE | Owner user ID |
| `device_name` | VARCHAR(150)| NOT NULL | Name (e.g. Chrome on Linux, Pixel 8) |
| `platform` | VARCHAR(50) | NOT NULL, DEFAULT `'web'` | Platform (`web`, `android`, `ios`) |
| `browser` | VARCHAR(150)| NULLABLE | Browser or client user-agent |
| `location` | VARCHAR(150)| NULLABLE | Geo-location or network location |
| `ip_address` | VARCHAR(64) | NULLABLE | Remote IP address |
| `last_active_at`| TIMESTAMPTZ| NOT NULL, DEFAULT `now()` | Heartbeat timestamp |
| `is_current` | BOOLEAN | NOT NULL, DEFAULT `false` | Current session flag |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | Initial pairing timestamp |

---

### 9. `user_settings` (Migration: `V3`)
User configuration, privacy policies, 2FA, and passkey flags.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `user_id` | UUID | PRIMARY KEY, REFERENCES `users(id)` ON DELETE CASCADE | Owner user ID |
| `passkey_enabled` | BOOLEAN | NOT NULL, DEFAULT `false` | Passkey (WebAuthn) enabled |
| `two_factor_enabled` | BOOLEAN | NOT NULL, DEFAULT `false` | Two-Factor PIN authentication enabled |
| `two_factor_pin` | VARCHAR(20) | NULLABLE | Hashed 2FA PIN |
| `security_notifications`| BOOLEAN | NOT NULL, DEFAULT `true` | Security alert emails/notifications |
| `status_about` | TEXT | DEFAULT `'Hey there! I am using IndiChat.'` | Profile bio status |
| `privacy_last_seen` | VARCHAR(30) | NOT NULL, DEFAULT `'everyone'` | `'everyone'`, `'contacts'`, `'nobody'` |
| `privacy_online` | VARCHAR(30) | NOT NULL, DEFAULT `'everyone'` | Online status visibility |
| `privacy_profile_photo` | VARCHAR(30) | NOT NULL, DEFAULT `'everyone'` | Avatar visibility |
| `privacy_links` | VARCHAR(30) | NOT NULL, DEFAULT `'everyone'` | Link preview settings |
| `privacy_status` | VARCHAR(30) | NOT NULL, DEFAULT `'contacts'` | Status stories visibility |
| `privacy_excluded_contacts`| TEXT | DEFAULT `''` | Comma-separated excluded contact IDs |
| `read_receipts` | BOOLEAN | NOT NULL, DEFAULT `true` | Enable/disable blue read ticks |
| `enter_is_send` | BOOLEAN | NOT NULL, DEFAULT `true` | Enter key transmits message |
| `media_visibility` | BOOLEAN | NOT NULL, DEFAULT `true` | Auto-save media to device |
| `font_size` | VARCHAR(20) | NOT NULL, DEFAULT `'medium'` | `'small'`, `'medium'`, `'large'` |
| `language` | VARCHAR(10) | NOT NULL, DEFAULT `'en'` | Active language code |
| `last_backup_at` | TIMESTAMPTZ | NULLABLE | Timestamp of last chat backup |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT `now()` | Last settings update |

---

## 3. Database Indexes

To maintain sub-millisecond query performance across large chat volumes:
- `idx_messages_history`: `(conversation_id, created_at DESC, id DESC)` — Guarantees instant keyset pagination for conversations with millions of messages.
- `idx_members_by_user`: `(user_id, conversation_id)` — Quick retrieval of user conversation lists.
- `idx_receipts_by_user`: `(user_id, message_id)` — Rapid lookup of delivered/read receipts for incoming batches.
- `idx_device_tokens_user_id`: `(user_id)` — Fast push notification subscriber lookup.
- `idx_linked_devices_user_id`: `(user_id)` — Fast session management and remote revocation queries.
