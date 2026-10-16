# Database Schema & Data Models

## Schema Design
The schema uses UUID primary keys, UTC timestamps (`TIMESTAMPTZ`), strict foreign key relations with cascading deletes where appropriate, and composite indexes for high-throughput pagination.

### Tables
1. **`users`**:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `phone_number VARCHAR(20) UNIQUE`
   - `email VARCHAR(255) UNIQUE`
   - `username VARCHAR(50) UNIQUE`
   - `password_hash TEXT`
   - `display_name VARCHAR(100) NOT NULL`
   - `avatar_key TEXT`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
   - `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
   - `last_seen_at TIMESTAMPTZ`
   - `status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'`

2. **`conversations`**:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `type VARCHAR(10) NOT NULL CHECK (type IN ('DIRECT', 'GROUP'))`
   - `title VARCHAR(150)`
   - `created_by UUID REFERENCES users(id)`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
   - `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

3. **`conversation_members`**:
   - `conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE`
   - `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
   - `role VARCHAR(20) NOT NULL DEFAULT 'MEMBER'`
   - `joined_at TIMESTAMPTZ NOT NULL DEFAULT now()`
   - `last_read_message_id UUID`
   - `muted_until TIMESTAMPTZ`
   - `PRIMARY KEY (conversation_id, user_id)`

4. **`messages`**:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE`
   - `sender_id UUID NOT NULL REFERENCES users(id)`
   - `client_message_id UUID NOT NULL`
   - `type VARCHAR(20) NOT NULL DEFAULT 'TEXT'`
   - `content TEXT`
   - `reply_to_id UUID REFERENCES messages(id)`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
   - `edited_at TIMESTAMPTZ`
   - `deleted_at TIMESTAMPTZ`
   - `UNIQUE (sender_id, client_message_id)`

5. **`message_receipts`**:
   - `message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE`
   - `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
   - `delivered_at TIMESTAMPTZ`
   - `read_at TIMESTAMPTZ`
   - `PRIMARY KEY (message_id, user_id)`

6. **`refresh_tokens`**:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE`
   - `token_hash VARCHAR(255) NOT NULL UNIQUE`
   - `expires_at TIMESTAMPTZ NOT NULL`
   - `revoked BOOLEAN NOT NULL DEFAULT FALSE`
   - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

### Performance Indexes
- `idx_messages_history`: `(conversation_id, created_at DESC, id DESC)` for fast keyset pagination.
- `idx_members_by_user`: `(user_id, conversation_id)` for quick conversation list lookups.
- `idx_receipts_by_user`: `(user_id, message_id)`.
