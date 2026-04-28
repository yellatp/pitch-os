-- migrations/0001_init.sql

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  google_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  contribution_count INTEGER DEFAULT 0,
  community_credits INTEGER DEFAULT 0,
  warmup_status TEXT DEFAULT 'inactive',
  daily_send_limit INTEGER DEFAULT 20,
  total_sent INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0
);

-- Sessions table (server-side sessions, signed JWT in cookie)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- NOTE: Remaining tables (templates, campaigns, community_emails, etc.)
-- are added in Phase 3 migration 0002_full_schema.sql