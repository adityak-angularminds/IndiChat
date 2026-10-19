CREATE TABLE device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(512) NOT NULL,
    platform VARCHAR(32) NOT NULL DEFAULT 'WEB',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_device_token UNIQUE (user_id, token)
);

CREATE INDEX idx_device_tokens_user_id ON device_tokens(user_id);
