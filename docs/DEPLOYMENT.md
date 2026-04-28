# Deployment Guide

## Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier)
- [Node.js](https://nodejs.org/) >= 22.12.0
- [pnpm](https://pnpm.io/installation)
- [Google Cloud Console](https://console.cloud.google.com/) project with OAuth 2.0 credentials

---

## Step 1: Cloudflare Setup

### Create D1 Database

```bash
pnpm cf:d1:create
```

This outputs:
```
Successfully created DB 'pitch-os-dev' in region ...
Created your new D1 database.
[[d1_databases]]
binding = "DB"
database_name = "pitch-os-dev"
database_id = "<your-database-id>"
```

Copy the `database_id` into `wrangler.toml`.

### Create KV Namespace

```bash
pnpm cf:kv:create
```

This outputs:
```
Successfully created KV namespace "KEYS_KV"
[[kv_namespaces]]
binding = "KEYS_KV"
id = "<your-kv-id>"
```

Copy the `id` into `wrangler.toml`.

### Run Database Migrations

```bash
# Local (dev)
pnpm db:migrate:local

# Production
pnpm db:migrate:prod
```

---

## Step 2: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services -> Credentials**
4. Click **Create Credentials -> OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized JavaScript origins: `http://localhost:4321` (dev), `https://your-domain.com` (prod)
7. Authorized redirect URIs: `http://localhost:4321/api/auth/callback` (dev), `https://your-domain.com/api/auth/callback` (prod)
8. Copy the **Client ID** and **Client Secret**

---

## Step 3: Environment Configuration

```bash
cp .env.example .env
```

Edit `.env`:

```env
AUTH_SECRET=<generate-with: openssl rand -hex 32>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
APP_URL=http://localhost:4321
QUEUE_API_KEY=<generate-a-random-string>
```

For production, set these as Cloudflare Pages secrets:

```bash
npx wrangler pages secret put AUTH_SECRET
npx wrangler pages secret put GOOGLE_CLIENT_ID
npx wrangler pages secret put GOOGLE_CLIENT_SECRET
npx wrangler pages secret put APP_URL
npx wrangler pages secret put QUEUE_API_KEY
```

---

## Step 4: Deploy

### Development

```bash
pnpm dev
```

Opens at [http://localhost:4321](http://localhost:4321).

### Production

```bash
pnpm deploy
```

This runs `astro build` then `wrangler pages deploy dist`.

---

## Step 5: Set Up Cron Trigger (Production)

The send queue processor runs via Cloudflare Cron Triggers. In your Cloudflare Dashboard:

1. Go to **Workers & Pages -> pitch-os -> Settings**
2. Find **Triggers** section
3. Add a Cron Trigger: `*/1 * * * *` (every minute)

Alternatively, deploy via `wrangler.toml`:

```toml
[triggers]
crons = ["*/1 * * * *"]
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SECRET` | Yes | 64-char hex string for JWT signing + key encryption |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `APP_URL` | Yes | Public URL of the app (used for OAuth redirects) |
| `QUEUE_API_KEY` | Yes | Internal API key for cron-to-dispatcher calls |

---

## Troubleshooting

### D1 Database Not Found

```bash
# Verify D1 exists
npx wrangler d1 list

# If missing, create it
pnpm cf:d1:create
```

### KV Namespace Not Found

```bash
# Verify KV exists
npx wrangler kv namespace list

# If missing, create it
pnpm cf:kv:create
```

### OAuth Redirect Mismatch

Ensure the redirect URI in Google Cloud Console exactly matches `{APP_URL}/api/auth/callback`.

### Build Fails

```bash
# Check TypeScript errors
pnpm type-check

# Clear cache and rebuild
rm -rf dist node_modules/.astro
pnpm build
```
