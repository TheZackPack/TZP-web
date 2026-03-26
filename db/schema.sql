CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    minecraft_uuid TEXT NOT NULL UNIQUE,
    current_username TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL UNIQUE REFERENCES players(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claim_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL UNIQUE,
    issued_username TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    redeemed_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS web_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    user_agent TEXT,
    ip_address TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS launcher_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    platform TEXT NOT NULL,
    launcher_version TEXT,
    token_hash TEXT NOT NULL UNIQUE,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bug_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    minecraft_uuid TEXT NOT NULL,
    username_snapshot TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    launcher_version TEXT,
    pack_version TEXT,
    selected_item_id TEXT,
    selected_item_other TEXT,
    other_context TEXT,
    selected_mods JSONB NOT NULL DEFAULT '[]'::jsonb,
    github_issue_number INTEGER,
    github_issue_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crash_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    launcher_device_id UUID REFERENCES launcher_devices(id) ON DELETE SET NULL,
    minecraft_uuid TEXT NOT NULL,
    username_snapshot TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    source TEXT NOT NULL,
    launcher_version TEXT,
    pack_version TEXT,
    os_name TEXT,
    java_version TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crash_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crash_report_id UUID NOT NULL REFERENCES crash_reports(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    storage_key TEXT NOT NULL,
    byte_size BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mod_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_version TEXT NOT NULL,
    mod_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (pack_version, mod_id)
);

CREATE TABLE IF NOT EXISTS item_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_version TEXT NOT NULL,
    item_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    source_mod_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (pack_version, item_id)
);
