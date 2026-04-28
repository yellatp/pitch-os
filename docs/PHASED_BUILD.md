# Phased Build Order

Pitch OS is designed to be built incrementally. Each phase is self-contained and builds on the previous one. This structure is specifically designed so AI IDEs (Cursor, Windsurf, Claude Code) can work in focused chunks without getting lost.

---

## Phase 1 — Project Scaffold & Auth

**Files:** `package.json`, `astro.config.mjs`, `wrangler.toml`, `tsconfig.json`, `tailwind.config.mjs`, `src/middleware.ts`, `src/lib/auth.ts`, `src/lib/db.ts`, `migrations/0001_init.sql`, `src/pages/login.astro`, `src/pages/index.astro`, `src/layouts/*`

**What you get:**
- Astro 6 + React 19 + Cloudflare Workers setup
- Google OAuth authentication
- Session management (JWT in HttpOnly cookies)
- D1 database with users + sessions tables
- Dark theme layout with sidebar navigation
- Auth middleware protecting all routes

---

## Phase 2 — API Key Manager

**Files:** `src/pages/api/keys/*`, `src/components/KeyManager.tsx`, `src/lib/encryption.ts`, `src/pages/keys.astro`

**What you get:**
- Encrypted API key storage in KV (AES-256-GCM)
- Key Manager UI with save, test, delete
- Service groups: Email Finders, Verifiers, Senders
- Key testing with live API calls

---

## Phase 3 — Email Discovery

**Files:** `src/lib/waterfall.ts`, `src/pages/api/discover/*`, `src/components/DiscoveryPanel.tsx`, `src/pages/discover.astro`

**What you get:**
- Waterfall finder engine (Apollo → RocketReach → Hunter → Skrapp