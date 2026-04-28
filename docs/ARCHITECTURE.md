# Architecture

## Overview

Pitch OS is a server-side rendered web application built on **Astro 6** with **React 19** components, deployed to **Cloudflare Pages** with Workers. It uses **Cloudflare D1** (SQLite-compatible) for persistent storage and **Cloudflare KV** for encrypted API key storage.

## System Architecture

```
+---------------------------------------------------------------+
|                     Client Browser                             |
|  Astro SSR pages (.astro) + React components (.tsx)            |
+----------------------------+----------------------------------+
                            | HTTP
+----------------------------v----------------------------------+
|                  Cloudflare Pages (Workers)                    |
|                                                               |
|  +--------------------------------------------------------+   |
|  |              Astro Runtime (SSR)                        |   |
|  |                                                         |   |
|  |  +----------------+   +----------------------------+    |   |
|  |  |  Middleware     |   |  Page Routes (.astro)      |    |   |
|  |  |  (auth guard)   |-->|  API Routes (.ts)          |    |   |
|  |  +----------------+   +------------+---------------+    |   |
|  +--------------------------------------+------------------+   |
|                                         |                       |
|  +--------------------------------------+------------------+   |
|  |              Scheduled Worker        |                  |   |
|  |  (Cron: every 60s)                   |                  |   |
|  |  +----------------------------+      |                  |   |
|  |  |  processSendQueue()        |----->|  Internal HTTP   |   |
|  |  |  - Fetch queued emails     |      |  to /api/send/   |   |
|  |  |  - Rate limit check        |      |  dispatch        |   |
|  |  |  - Dispatch via internal   |      |                  |   |
|  |  |    API call                |      |                  |   |
|  |  +----------------------------+      |                  |   |
|  +--------------------------------------------------------+   |
|                                                               |
|  +----------------+  +--------------------+  +----------------+ |
|  |  D1 Database    |  |  KV Namespace      |  |  Cloudflare    | |
|  |  (SQLite)       |  |  (Encrypted Keys)  |  |  DNS-over-     | |
|  |                 |  |                    |  |  HTTPS         | |
|  +----------------+  +--------------------+  +----------------+ |
+---------------------------------------------------------------+
```

## Data Flow

### Request Lifecycle

1. **HTTP Request** arrives at Cloudflare Pages
2. **Middleware** ([`src/middleware.ts`](../src/middleware.ts)) runs first:
   - Extracts session cookie
   - Verifies JWT token via `verifySessionToken()`
   - Attaches `locals.user` if valid
   - Redirects unauthenticated users to `/login`
3. **Astro Router** matches the URL to a page or API route
4. **Page/API Handler** executes:
   - Pages render HTML with React components (client:load for interactivity)
   - API routes return JSON responses
5. **Response** is returned to the browser

### Authentication Flow

```
User -> /login -> Google OAuth -> /api/auth/callback
  -> exchangeGoogleCode() -> fetchGoogleUser()
  -> findOrCreateUser() -> createSessionToken()
  -> Set-Cookie: pitch_os_session (HttpOnly, 7-day expiry)
  -> Redirect to /dashboard
```

### Send Queue Flow

```
1. User creates campaign -> recipients queued in outreach_log (status='queued')
2. Cron worker (every 60s) -> processSendQueue()
3. For each running campaign with queued recipients:
   a. Pick next queued recipient
   b. checkRateLimit() -- daily limit, duplicate, domain frequency, bounce rate
   c. If allowed -> POST /api/send/dispatch (internal)
   d. Dispatcher selects best provider -> sends via provider API
   e. Random delay 90-180s before next send
4. If bounce rate > 3% -> campaign auto-paused
```

## Key Design Decisions

### Why Waterfall Pattern?

Both email finding and verification use a **waterfall** (cascade) pattern:
- Try providers in priority order
- Return first successful result
- Skip providers without configured API keys
- This maximizes coverage without requiring all keys

### Why Encrypted Keys in KV?

API keys are encrypted with **AES-256-GCM** before storage:
- Encryption key is derived from `AUTH_SECRET + userId` via HKDF
- Each user gets a unique encryption key
- Even if KV is compromised, keys cannot be decrypted without `AUTH_SECRET`
- Keys are decrypted on-the-fly when needed, never stored in plaintext

### Why D1 (SQLite) over Postgres?

- Zero-config -- no server to provision
- Free tier is generous (5GB storage, 1M writes/month)
- SQLite compatibility means standard SQL queries
- Integrated with Cloudflare Workers -- no network latency

## Database Schema

See [`migrations/0002_full_schema.sql`](../migrations/0002_full_schema.sql) for the complete schema.

Key tables:
- **users** -- Google OAuth accounts, credits, send limits
- **templates** -- Spintax email templates with categories
- **campaigns** -- Campaigns with status tracking
- **outreach_log** -- Individual email send records
- **community_emails** -- Crowd-sourced verified emails (masked)
- **warmup_config** -- Per-user warmup configuration
- **dns_checks** -- Cached DNS verification results
