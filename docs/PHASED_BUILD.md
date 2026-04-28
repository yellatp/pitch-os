# Phased Build Order

Pitch OS is designed to be built incrementally. Each phase is self-contained and builds on the previous one. This structure is specifically designed so AI IDEs (Cursor, Windsurf, Claude Code) can work in focused chunks without getting lost.

---

## Phase 1: Project Scaffold and Auth

**Files:** `package.json`, `astro.config.mjs`, `wrangler.toml`, `tsconfig.json`, `tailwind.config.mjs`, `src/middleware.ts`, `src/lib/auth.ts`, `src/lib/db.ts`, `migrations/0001_init.sql`, `src/pages/login.astro`, `src/pages/index.astro`, `src/layouts/*`

**What you get:**
- Astro 6 + React 19 + Cloudflare Workers setup.
- Google OAuth authentication.
- Session management (JWT in HttpOnly cookies).
- D1 database with users + sessions tables.
- Dark theme layout with sidebar navigation.
- Auth middleware protecting all routes.

---

## Phase 2: API Key Manager

**Files:** `src/pages/api/keys/*`, `src/components/KeyManager.tsx`, `src/lib/encryption.ts`, `src/pages/keys.astro`

**What you get:**
- Encrypted API key storage in KV (AES-256-GCM).
- Key Manager UI with save, test, delete.
- Service groups: Email Finders, Verifiers, Senders.
- Key testing with live API calls.

---

## Phase 3: Email Discovery

**Files:** `src/lib/waterfall.ts`, `src/pages/api/discover/*`, `src/components/DiscoveryPanel.tsx`, `src/pages/discover.astro`

**What you get:**
- Waterfall finder engine (Apollo, RocketReach, Hunter, Skrapp, Prospeo, GetProspect, ContactOut, Wiza, SignalHire, AeroLeads).
- Single lookup by name + company.
- Bulk CSV upload (up to 50 rows).
- Domain-wide email discovery via Hunter.
- Pattern fallback when APIs fail.

---

## Phase 4: Email Verification

**Files:** `src/lib/verifier.ts`, `src/pages/api/verify/check.ts`, `src/components/VerificationPanel.tsx`, `src/pages/verify.astro`

**What you get:**
- Waterfall verifier (ZeroBounce, NeverBounce, MillionVerifier, DeBounce).
- Status classification with confidence scoring.
- Community contribution form.
- Cache results in D1.

---

## Phase 5: Template Engine

**Files:** `src/lib/spintax.ts`, `src/lib/starterTemplates.ts`, `src/pages/api/templates/*`, `src/components/TemplateEditor.tsx`, `src/components/TemplateList.tsx`, `src/components/SpintaxEditor.tsx`, `src/pages/compose.astro`

**What you get:**
- Spintax editor with live preview.
- Variable substitution ({{FirstName}}, {{Company}}, etc.).
- 15+ pre-written starter templates across 10 categories.
- AI personalization postscript toggle.
- Template CRUD.

---

## Phase 6: Campaign System

**Files:** `src/lib/ratelimiter.ts`, `src/lib/csv.ts`, `src/pages/api/campaigns/*`, `src/pages/api/send/*`, `src/scheduled.ts`, `src/components/CampaignTable.tsx`, `src/pages/campaigns.astro`

**What you get:**
- Campaign creation with CSV upload.
- Queue-based send system (Cron every 60s).
- Multi-provider dispatch (Resend, Brevo, MailerSend, Postmark, Mailgun).
- Rate limiting (daily caps, domain frequency, duplicate detection).
- Bounce rate auto-pause at 3%.
- Random send delays (90-180s).
- Campaign control (pause/resume/delete).
- Send logs.

---

## Phase 7: Community Database

**Files:** `src/pages/api/community/*`, `src/components/CommunityDBTable.tsx`, `src/pages/community-db.astro`

**What you get:**
- Searchable community email database.
- Email masking (j***@company.com).
- Credit-based reveal system.
- Contribution with credit rewards.
- Role-based filtering.

---

## Phase 8: Warmup Tracker + DNS Wizard + Dashboard

**Files:** `src/pages/api/warmup/*`, `src/pages/api/dns/*`, `src/pages/api/dashboard/stats.ts`, `src/components/WarmupTracker.tsx`, `src/components/DnsWizard.tsx`, `src/components/DashboardWidgets.tsx`, `src/pages/warmup.astro`, `src/pages/dns-wizard.astro`, `src/pages/dashboard.astro`

**What you get:**
- Warmup tracker with ramp schedule (5/day to 100/day over 30 days).
- Readiness score computation.
- DNS Wizard with 6-step guided setup (Domain, Provider, SPF, DKIM, DMARC, Verify).
- Live DNS verification via Cloudflare DNS-over-HTTPS.
- Dashboard widgets with aggregated stats.

---

## Phase 9: Onboarding + Settings

**Files:** `src/pages/settings.astro`, `src/components/OnboardingChecklist.tsx`

**What you get:**
- Onboarding checklist for new users.
- Settings page (profile, preferences, account management).
