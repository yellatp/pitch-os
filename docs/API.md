# API Reference

All API routes are prefixed with `/api/` and require authentication (handled by middleware). Responses are JSON.

---

## Authentication

### `GET /api/auth/google`
Redirects to Google OAuth consent screen.

### `GET /api/auth/callback?code=...&state=...`
Handles Google OAuth callback. Exchanges code for tokens, creates/retrieves user, sets session cookie.

**Response:** Redirects to `/dashboard` (or `?next=` param).

### `GET /api/auth/logout`
Clears session cookie. Redirects to `/login`.

---

## API Keys

### `POST /api/keys/save`
Save or update an API key for a service.

**Body:**
```json
{ "service": "resend", "key": "re_abc123..." }
```

**Response:** `{ "ok": true }`

### `DELETE /api/keys/save`
Delete a saved API key.

**Body:**
```json
{ "service": "resend" }
```

**Response:** `{ "ok": true }`

### `GET /api/keys/list`
List all saved API keys (names only, values masked).

**Response:**
```json
{
  "keys": [
    { "service": "resend", "hasKey": true, "createdAt": "..." },
    { "service": "zerobounce", "hasKey": true, "createdAt": "..." }
  ]
}
```

### `POST /api/keys/test`
Test an API key by making a live API call.

**Body:**
```json
{ "service": "resend", "key": "re_abc123..." }
```

**Response:**
```json
{ "ok": true, "status": "valid" }
```

---

## Email Discovery

### `POST /api/discover/search`
Find an email address. Supports three modes.

**Single mode:**
```json
{
  "mode": "single",
  "firstName": "John",
  "lastName": "Doe",
  "company": "Acme Inc",
  "domain": "acme.com",
  "role": "CTO"
}
```

**Domain mode:**
```json
{
  "mode": "domain",
  "domain": "acme.com"
}
```

**Response (single):**
```json
{
  "email": "john@acme.com",
  "confidence": 95,
  "source": "apollo",
  "attempts": ["john@acme.com", "j.doe@acme.com"]
}
```

**Response (domain):**
```json
{
  "domain": "acme.com",
  "emails": [
    { "email": "john@acme.com", "firstName": "John", "lastName": "Doe", "role": "CTO" }
  ],
  "total": 1
}
```

### `POST /api/discover/bulk`
Bulk email discovery (max 50 rows).

**Body:**
```json
{
  "rows": [
    { "firstName": "John", "lastName": "Doe", "company": "Acme Inc" }
  ]
}
```

**Response:**
```json
{
  "results": [
    { "firstName": "John", "lastName": "Doe", "company": "Acme Inc", "email": "john@acme.com", "confidence": 95, "source": "apollo" }
  ],
  "summary": { "total": 1, "found": 1, "notFound": 0 }
}
```

---

## Email Verification

### `POST /api/verify/check`
Verify a single email address.

**Body:**
```json
{ "email": "john@acme.com" }
```

**Response:**
```json
{
  "email": "john@acme.com",
  "status": "valid",
  "subStatus": "",
  "score": 9,
  "safe_to_send": true,
  "verifiedBy": "zerobounce",
  "verifiedAt": "2024-01-01T00:00:00.000Z",
  "freeEmail": false,
  "mxFound": true,
  "fromCache": false
}
```

---

## Campaigns

### `GET /api/campaigns/list`
List all campaigns for the current user.

**Response:**
```json
{
  "campaigns": [
    { "id": "...", "name": "Q1 Outreach", "status": "running", "sent_count": 45, "target_count": 100, ... }
  ]
}
```

### `POST /api/campaigns/create`
Create a new campaign.

**Body:**
```json
{
  "name": "Q1 Outreach",
  "templateId": "...",
  "fromEmail": "john@careers.com",
  "fromName": "John Doe",
  "csvText": "email,firstName,lastName,company\njohn@acme.com,John,Doe,Acme Inc"
}
```

**Response:** `{ "id": "campaign-id", "queued": 50 }`

### `POST /api/campaigns/control`
Pause, resume, or delete a campaign.

**Body:**
```json
{ "campaignId": "...", "action": "pause" }
```

**Response:** `{ "ok": true }`

### `GET /api/campaigns/logs?campaignId=...`
Get send logs for a campaign.

**Response:**
```json
{
  "logs": [
    { "id": "...", "recipient_email": "john@acme.com", "status": "sent", "sent_at": "..." }
  ]
}
```

---

## Templates

### `GET /api/templates/list`
List all templates for the current user.

### `POST /api/templates/save`
Create or update a template.

**Body:**
```json
{
  "id": "optional-for-update",
  "name": "Cold Outreach",
  "category": "job_search",
  "subject_spintax": "{Hi|Hello} {{FirstName}}",
  "body_spintax": "Body text here...",
  "ai_ps_enabled": false
}
```

### `GET /api/templates/get?id=...`
Get a single template by ID.

### `POST /api/templates/seed`
Seed starter templates for the current user (idempotent).

---

## Sending

### `POST /api/send/queue`
Queue emails for sending (called internally by campaign creation).

### `GET /api/send/queue`
Get queue status (queued count, sent today, etc.).

### `POST /api/send/dispatch`
Internal endpoint called by the cron worker. Dispatches a single email via the best available provider.

---

## Community Database

### `GET /api/community/query`
Search the community email database.

**Query params:** `q`, `domain`, `role`, `page`

**Response:**
```json
{
  "results": [
    { "id": "...", "email_masked": "j***@acme.com", "domain": "acme.com", "first_name": "John", ... }
  ],
  "page": 1,
  "hasMore": false,
  "userCredits": 5,
  "userContributions": 3
}
```

### `POST /api/community/contribute`
Contribute a verified email to the community database.

**Body:**
```json
{
  "email": "john@acme.com",
  "firstName": "John",
  "lastName": "Doe",
  "company": "Acme Inc",
  "roleTitle": "CTO",
  "roleCategory": "engineering",
  "verifiedStatus": "valid",
  "verifiedBy": "zerobounce",
  "verifiedAt": "2024-01-01T00:00:00.000Z"
}
```

**Response:** `{ "ok": true, "action": "inserted", "id": "..." }`

### `POST /api/community/reveal`
Reveal a full email (costs 1 credit).

**Body:**
```json
{ "id": "record-id" }
```

**Response:**
```json
{ "ok": true, "email": "john@acme.com", "company": "Acme Inc", "roleTitle": "CTO" }
```

---

## Warmup

### `GET /api/warmup/status`
Get warmup status. Auto-creates a default config row if none exists.

**Response:**
```json
{
  "status": "warming",
  "inbox_email": "john@outlook.com",
  "provider": "mails_ai",
  "start_date": "2024-01-01T00:00:00.000Z",
  "target_daily_volume": 10,
  "current_daily_volume": 5,
  "days_active": 5,
  "readiness_score": 17,
  "is_ready": false,
  "schedule": [
    { "range": "Days 1–3", "target": 5, "description": "Initial trust signals", "done": true },
    { "range": "Days 4–7", "target": 10, "description": "Building engagement", "done": false },
    ...
  ]
}
```

### `POST /api/warmup/status`
Control warmup state.

**Start:**
```json
{ "action": "start", "inbox_email": "john@outlook.com", "provider": "mails_ai" }
```

**Stop:**
```json
{ "action": "stop" }
```

**Update:**
```json
{ "action": "update", "inbox_email": "john@outlook.com", "provider": "trulyinbox" }
```

### `GET /api/warmup/config`
Get raw warmup config from database.

### `POST /api/warmup/config`
Update warmup config directly.

---

## DNS

### `POST /api/dns/verify`
Live DNS verification via Cloudflare DNS-over-HTTPS.

**Body:**
```json
{ "domain": "example.com" }
```

**Response:**
```json
{
  "domain": "example.com",
  "allValid": true,
  "spf": { "valid": true, "record": "v=spf1 include:_spf.google.com ~all", "details": "SPF record is valid." },
  "dkim": { "valid": true, "record": "v=DKIM1; k=rsa; p=MIGf...", "details": "DKIM record found at selector: google._domainkey.example.com" },
  "dmarc": { "valid": true, "record": "v=DMARC1; p=quarantine;", "details": "DMARC valid. Policy: quarantine.", "policy": "quarantine" },
  "checkedAt": "2024-01-01T00:00:00.000Z"
}
```

### `GET /api/dns/check`
Get cached DNS check results for the current user.

---

## Dashboard

### `GET /api/dashboard/stats`
Aggregated dashboard statistics.

**Response:**
```json
{
  "emailsFound": 150,
  "emailsVerified": 89,
  "campaignsSent": 12,
  "dbContributed": 45,
  "todaySent": 23,
  "activeCampaigns": [...],
  "recentActivity": [...],
  "warmup": { "status": "warming", "current_daily_volume": 5, "target_daily_volume": 10, "days_active": 5 },
  "dnsChecks": [...]
}
```

---

## AI Personalization

### `POST /api/ai/personalize`
Generate an AI-powered postscript for an email.

**Body:**
```json
{
  "recipientName": "John",
  "recipientCompany": "Acme Inc",
  "recipientRole": "CTO",
  "senderName": "Jane",
  "templateBody": "Email body text..."
}
```

**Response:**
```json
{
  "ps": "P.S. I noticed Acme recently launched a new product — would love to hear your thoughts on it."
}
```
