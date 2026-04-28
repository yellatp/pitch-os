# Pitch OS

> **BYOK (Bring Your Own Key) · Community-driven · MIT Licensed**

Pitch OS is an open-source, all-in-one outreach platform for **job seekers** and **startup founders**. It combines email finding, verification, sending, warmup, and DNS setup into a single self-hosted application — running entirely on Cloudflare's free tier.

Drop this repo into Cursor, Windsurf, or Claude Code and tell it to `"implement Phase 1"` — the phased build order is designed so AI IDEs can work in focused chunks without getting lost.

---

## ✨ Features

### 🔍 Email Discovery
- **Waterfall finder engine** — queries Apollo, RocketReach, Hunter, Skrapp, Prospeo, GetProspect, ContactOut, Wiza, SignalHire, AeroLeads in cascade until an email is found
- **Single lookup** — find one email by name + company
- **Bulk lookup** — upload CSV, find up to 50 emails at once
- **Domain search** — Hunter-powered domain-wide email discovery
- **Pattern fallback** — generates email patterns from known formats when APIs fail

### ✅ Email Verification
- **Waterfall verifier** — checks across ZeroBounce, NeverBounce, MillionVerifier, DeBounce until a result is returned
- **Status classification** — valid, invalid, catch-all, unknown, spamtrap, abuse
- **Confidence scoring** — 0–10 score with `safe_to_send` flag
- **Community contribution** — verified emails can be contributed to the shared database

### 📧 Email Sending
- **Multi-provider dispatch** — Resend, Brevo, MailerSend, Postmark, Mailgun
- **Smart routing** — picks the best provider based on availability and rate limits
- **Rate limiting** — daily caps, domain frequency limits (max 3/day per domain), 90–180s random send delays
- **Bounce rate auto-pause** — any campaign hitting 3% bounce rate is hard-paused automatically
- **Queue-based delivery** — Cloudflare Cron-driven send queue processes emails every 60 seconds

### 📝 Template Engine
- **Spintax support** — `{option1|option2|option3}` randomization for subject and body
- **Variable substitution** — `{{FirstName}}`, `{{Company}}`, etc.
- **AI personalization** — optional AI-powered postscript generation
- **10 template categories** — job_search, referral_request, mentorship_request, investor_pitch, partnership, product_demo, one_pager_share, recruiter_reach, community_invite, custom
- **Starter templates** — 15+ pre-written templates included

### 🌡️ Email Warmup
- **Ramp schedule** — Days 1–3 (5/day) → 4–7 (10/day) → 8–14 (20/day) → 15–21 (40/day) → 22–30 (70/day) → 30+ (100/day)
- **Readiness score** — computed as `min(100, daysActive / 30 * 100)`
- **Provider selection** — Mails.ai, TrulyInbox, Instantly, Smartlead
- **Visual progress** — ramp schedule visualization with current stage highlighting

### ⚡ DNS Wizard
- **6-step guided setup** — Domain → Provider → SPF → DKIM → DMARC → Verify
- **Provider-specific instructions** — Resend, Brevo, MailerSend, Mailgun, Postmark
- **Live DNS verification** — checks SPF, DKIM (9 selectors), DMARC via Cloudflare DNS-over-HTTPS
- **Burner domain warning** — reminds users to never use their main domain

### 👥 Community Database
- **Shared email repository** — crowd-sourced verified emails
- **Credit system** — earn credits by contributing, spend credits to reveal full emails
- **Role-based filtering** — filter by HR, engineering, founder, sales, marketing, etc.
- **Email masking** — emails are masked (`j***@company.com`) until revealed

### 🔐 Security
- **Google OAuth** — sign in with your Google account
- **JWT sessions** — HMAC-SHA256 signed tokens, 7-day expiry
- **AES-256-GCM encryption** — API keys encrypted at rest in KV, derived from AUTH_SECRET + userId
- **Encrypted API keys** — keys are never stored in plaintext

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Cloudflare Pages                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Astro (SSR + React)                 │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │   │
│  │  │  Pages   │ │  API     │ │  Components      │  │   │
│  │  │  .astro  │ │  .ts     │ │  .tsx (React)    │  │   │
│  │  └──────────┘ └──────────┘ └──────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Cloudflare Workers                  │   │
│  │  ┌──────────────┐  ┌──────────────────────────┐  │   │
│  │  │ Middleware   │  │  Scheduled (Cron)        │  │   |
│  │  │ Auth/Session │  │  Send Queue Processor    │  │   │
│  │  └──────────────┘  └──────────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                              │
│  ┌──────────┐  ┌──────────────────┐  ┌──────────────┐   │
│  │  D1 DB   │  │  KV Namespace    │  │  Cloudflare  │   │
│  │  (SQL)   │  │  (Encrypted Keys)│  │  DNS-over-   │   │
│  │          │  │                  │  │  HTTPS       │   │
│  └──────────┘  └──────────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Cloudflare Workers (via Astro adapter) |
| **Framework** | Astro 6 + React 19 |
| **Database** | Cloudflare D1 (SQLite-compatible) |
| **Key Storage** | Cloudflare KV (encrypted at rest) |
| **Auth** | Google OAuth 2.0 + JWT (HMAC-SHA256) |
| **Styling** | Tailwind CSS 4 |
| **Language** | TypeScript 6 |
| **Package Manager** | pnpm |

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 22.12.0
- pnpm (`npm install -g pnpm`)
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier)
- A [Google Cloud Console](https://console.cloud.google.com/) project with OAuth 2.0 credentials

### 1. Clone & Install

```bash
git clone <repo-url>
cd pitch-os
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
AUTH_SECRET=<random-64-char-hex-string>
GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<your-google-oauth-client-secret>
APP_URL=http://localhost:4321
QUEUE_API_KEY=<random-string-for-internal-api-calls>
```

Generate `AUTH_SECRET` with: `openssl rand -hex 32`

### 3. Set Up Cloudflare Resources

```bash
# Create D1 database
pnpm cf:d1:create

# Create KV namespace
pnpm cf:kv:create

# Update wrangler.toml with the IDs from the output above
# Then run migrations
pnpm db:migrate:local
```

### 4. Run Dev Server

```bash
pnpm dev
```

Open [http://localhost:4321](http://localhost:4321) — sign in with Google.

### 5. Deploy

```bash
pnpm deploy
```

---

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ui/              # Base UI primitives (Button, Card, Input, Badge, Spinner)
│   ├── CampaignTable.tsx
│   ├── CommunityDBTable.tsx
│   ├── DashboardWidgets.tsx
│   ├── DiscoveryPanel.tsx
│   ├── DnsWizard.tsx
│   ├── KeyManager.tsx
│   ├── SpintaxEditor.tsx
│   ├── TemplateEditor.tsx
│   ├── TemplateList.tsx
│   ├── VerificationPanel.tsx
│   └── WarmupTracker.tsx
├── layouts/             # Astro layouts
│   ├── AppLayout.astro  # Authenticated app shell (sidebar + nav)
│   ├── AuthLayout.astro # Auth pages (login)
│   └── BaseLayout.astro # Root HTML shell
├── lib/                 # Core libraries
│   ├── auth.ts          # JWT, OAuth, session management
│   ├── csv.ts           # CSV parser/serializer
│   ├── db.ts            # D1 query helpers (dbGet, dbAll, dbRun)
│   ├── encryption.ts    # AES-256-GCM key encryption
│   ├── ratelimiter.ts   # Rate limiting, bounce detection, send delays
│   ├── spintax.ts       # Spintax resolver + variable substitution
│   ├── starterTemplates.ts  # 15+ pre-written templates
│   ├── verifier.ts      # Waterfall email verification
│   └── waterfall.ts     # Waterfall email finding engine
├── pages/               # Astro pages + API routes
│   ├── api/
│   │   ├── ai/personalize.ts
│   │   ├── auth/        # Google OAuth callback, login, logout
│   │   ├── campaigns/   # CRUD + control (pause/resume/delete)
│   │   ├── community/   # Contribute, query, reveal
│   │   ├── dashboard/stats.ts
│   │   ├── discover/    # Single, bulk, domain search
│   │   ├── dns/         # Check (cached), verify (live)
│   │   ├── keys/        # Save, list, test API keys
│   │   ├── send/        # Dispatch, queue
│   │   ├── templates/   # CRUD + seed
│   │   ├── verify/check.ts
│   │   └── warmup/      # Config, status
│   ├── campaigns.astro
│   ├── community-db.astro
│   ├── compose.astro
│   ├── dashboard.astro
│   ├── discover.astro
│   ├── dns-wizard.astro
│   ├── index.astro
│   ├── keys.astro
│   ├── login.astro
│   ├── verify.astro
│   └── warmup.astro
├── stores/user.ts       # NanoStore for user state
├── styles/global.css    # Tailwind + CSS variables
├── middleware.ts         # Auth guard + session verification
├── scheduled.ts         # Cloudflare Cron send queue processor
└── env.d.ts             # TypeScript declarations
migrations/
├── 0001_init.sql        # Users + sessions tables
└── 0002_full_schema.sql # Templates, campaigns, outreach_log, community_emails, warmup_config, dns_checks
```

---

## 🔌 Adapter Interface

Pitch OS uses a **waterfall pattern** for both email finding and verification. Each provider implements a standard function signature, making it easy for the community to add new providers.

### Finder Adapter

```typescript
// src/lib/waterfall.ts
async function findApollo(opts: FinderOptions, apiKey: string): Promise<FinderResult>
async function findHunter(opts: FinderOptions, apiKey: string): Promise<FinderResult>
// Add yours: async function findYourProvider(opts: FinderOptions, apiKey: string): Promise<FinderResult>
```

### Verifier Adapter

```typescript
// src/lib/verifier.ts
async function verifyZeroBounce(email: string, apiKey: string): Promise<VerifyResult | null>
async function verifyNeverBounce(email: string, apiKey: string): Promise<VerifyResult | null>
// Add yours: async function verifyYourProvider(email: string, apiKey: string): Promise<VerifyResult | null>
```

### Sender Adapter

```typescript
// src/pages/api/send/dispatch.ts
async function sendViaResend(params: SendParams): Promise<SendResult>
async function sendViaBrevo(params: SendParams): Promise<SendResult>
// Add yours: async function sendViaYourProvider(params: SendParams): Promise<SendResult>
```

To add a new provider, implement the function and add it to the waterfall array. No core logic changes needed.

---

## 💳 Credit System

The community database uses a **credit economy** to prevent free-riding:

| Action | Credits |
|--------|---------|
| Contribute a verified email | +1 |
| Reveal a full email | -1 |
| Start with | 0 |

Users with insufficient credits see masked emails (`j***@company.com`). Credits are tracked in the `users` table via `community_credits` and `contribution_count` columns.

---

## 📋 Phased Build Order

This project is designed to be built incrementally by AI IDEs. Each phase is self-contained.

| Phase | What You Get |
|-------|-------------|
| **1** | Project scaffold, auth (Google OAuth), middleware, D1 schema |
| **2** | API Key Manager (encrypted storage in KV, CRUD, test endpoints) |
| **3** | Email Discovery (single + bulk + domain waterfall finder) |
| **4** | Email Verification (waterfall verifier, status display) |
| **5** | Template Engine (spintax editor, variable substitution, starter templates) |
| **6** | Campaign System (create, queue, dispatch, rate limiting, bounce detection) |
| **7** | Community DB (contribute, query with masking, credit-based reveal) |
| **8** | Warmup Tracker + DNS Wizard + Dashboard widgets |
| **9** | Onboarding checklist + settings page |

---

## 📄 License

MIT — see [LICENSE](LICENSE).

Built for job seekers and founders who want to own their outreach infrastructure.
