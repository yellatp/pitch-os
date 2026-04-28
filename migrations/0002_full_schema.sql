-- migrations/0002_full_schema.sql
-- Run AFTER 0001_init.sql (users + sessions already exist)

-- ── Templates ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  -- category values:
  -- job_search | referral_request | mentorship_request | investor_pitch
  -- partnership | product_demo | one_pager_share | recruiter_reach
  -- community_invite | custom
  subject_spintax TEXT NOT NULL,
  body_spintax TEXT NOT NULL,
  ai_ps_enabled INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Campaigns ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  template_id TEXT NOT NULL,
  from_email TEXT NOT NULL,
  from_name TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  -- status: draft | running | paused | completed | suspended_bounce
  target_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  replied_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_campaigns_user ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- ── Outreach Log ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outreach_log (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  recipient_company TEXT,
  recipient_role TEXT,
  template_id TEXT NOT NULL,
  rendered_subject TEXT,
  sent_via TEXT,
  -- sent_via: resend | brevo | mailersend | postmark | mailgun
  sent_at TEXT,
  opened_at TEXT,
  replied_at TEXT,
  bounced INTEGER DEFAULT 0,
  status TEXT DEFAULT 'queued',
  -- status: queued | sent | opened | replied | bounced | failed
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_log_campaign ON outreach_log(campaign_id);
CREATE INDEX IF NOT EXISTS idx_log_recipient ON outreach_log(recipient_email);
CREATE INDEX IF NOT EXISTS idx_log_status ON outreach_log(status);

-- ── Community Emails (distributed DB) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_emails (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  email_hash TEXT NOT NULL,          -- SHA-256 of lowercased email (for dedup)
  domain TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  role_title TEXT,
  role_category TEXT,
  -- role_category: hr | engineering | founder | sales | marketing | finance | legal | other
  linkedin_url TEXT,
  verified_status TEXT NOT NULL,     -- valid | catch-all
  verified_by TEXT NOT NULL,
  verified_at TEXT NOT NULL,
  contributed_by TEXT NOT NULL,      -- user.id
  hit_count INTEGER DEFAULT 1,
  last_seen TEXT DEFAULT (datetime('now')),
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_community_hash ON community_emails(email_hash);
CREATE INDEX IF NOT EXISTS idx_community_domain ON community_emails(domain);
CREATE INDEX IF NOT EXISTS idx_community_company ON community_emails(company);
CREATE INDEX IF NOT EXISTS idx_community_role_cat ON community_emails(role_category);

-- ── Warmup Config ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS warmup_config (
  user_id TEXT PRIMARY KEY,
  inbox_email TEXT,
  provider TEXT,                     -- mails_ai | trulyinbox
  status TEXT DEFAULT 'inactive',    -- inactive | warming | ready
  start_date TEXT,
  target_daily_volume INTEGER DEFAULT 20,
  current_daily_volume INTEGER DEFAULT 5,
  days_active INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── DNS Check Cache ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dns_checks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  spf_valid INTEGER DEFAULT 0,
  dkim_valid INTEGER DEFAULT 0,
  dmarc_valid INTEGER DEFAULT 0,
  last_checked TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dns_user_domain ON dns_checks(user_id, domain);