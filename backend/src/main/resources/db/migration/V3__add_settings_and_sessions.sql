CREATE TABLE IF NOT EXISTS user_linked_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_name VARCHAR(150) NOT NULL,
    platform VARCHAR(50) NOT NULL DEFAULT 'web',
    browser VARCHAR(150),
    location VARCHAR(150),
    ip_address VARCHAR(64),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_current BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_linked_devices_user_id ON user_linked_devices(user_id);

CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    passkey_enabled BOOLEAN NOT NULL DEFAULT false,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
    two_factor_pin VARCHAR(20),
    security_notifications BOOLEAN NOT NULL DEFAULT true,
    status_about TEXT DEFAULT 'Hey there! I am using WhatsApp.',
    privacy_last_seen VARCHAR(30) NOT NULL DEFAULT 'everyone',
    privacy_online VARCHAR(30) NOT NULL DEFAULT 'everyone',
    privacy_profile_photo VARCHAR(30) NOT NULL DEFAULT 'everyone',
    privacy_links VARCHAR(30) NOT NULL DEFAULT 'everyone',
    privacy_status VARCHAR(30) NOT NULL DEFAULT 'contacts',
    privacy_excluded_contacts TEXT DEFAULT '',
    read_receipts BOOLEAN NOT NULL DEFAULT true,
    enter_is_send BOOLEAN NOT NULL DEFAULT true,
    media_visibility BOOLEAN NOT NULL DEFAULT true,
    font_size VARCHAR(20) NOT NULL DEFAULT 'medium',
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    last_backup_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
