# Security

## Overview

Pitch OS takes security seriously. As a BYOK (Bring Your Own Key) platform, users store their own API keys for third-party services. This document explains how those keys are protected and what security measures are in place.

---

## API Key Encryption

### How Keys Are Stored

API keys are stored in **Cloudflare KV** (key-value store), **never in plaintext**.

### Encryption Algorithm

- **Algorithm:** AES-256-GCM (Authenticated Encryption).
- **Key Derivation:** HKDF with SHA-256.
- **IV:** 96-bit random (12 bytes), generated per encryption.
- **Encoding:** IV + ciphertext combined and base64-encoded.

### Key Derivation

```typescript
// Each user gets a unique encryption key derived from:
// AUTH_SECRET (app-wide secret) + userId (user-specific salt)
const encryptionKey = await deriveKey(AUTH_SECRET, userId)
```

This means:
- Even if KV is compromised, keys cannot be decrypted without `AUTH_SECRET`.
- Each user's keys are encrypted with a different key.
- Compromising one user's key derivation does not affect others.

### Storage Format

```
KV Key:   keys:{userId}:{service}
KV Value: base64(iv + ciphertext)
```

---

## Authentication

### Session Tokens

- **Type:** JWT (JSON Web Token).
- **Algorithm:** HMAC-SHA256.
- **Expiry:** 7 days.
- **Storage:** HttpOnly cookie (not accessible to JavaScript).
- **Flags:** `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age=604800`.

### Google OAuth

- Uses OAuth 2.0 with Google.
- Scope: `openid email profile`.
- State parameter prevents CSRF attacks.
- Access tokens are exchanged server-side, never exposed to the client.

### Session Flow

```
1. User authenticates via Google OAuth.
2. Server creates JWT with user info + expiry.
3. JWT stored in HttpOnly cookie.
4. Every request verifies JWT signature + expiry.
5. Expired or invalid tokens redirect to /login.
```

---

## Rate Limiting and Abuse Prevention

### Send Rate Limits

| Limit | Value | Enforcement |
|-------|-------|-------------|
| Daily send cap | 20 (week 1) to 50 (week 2) to 200 (30+ days) | Server-side |
| Per-domain per day | 3 | Server-side |
| Duplicate recipient | 30-day window | Server-side |
| Send delay | 90-180 seconds random | Server-side |
| Bounce rate | 3% auto-pause | Server-side |

### Why Server-Side?

All rate limits are enforced in the **Cloudflare Worker**, not the client. This means:
- Users cannot bypass limits by modifying client code.
- The cron-based send queue respects all limits.
- Limits are checked before every send attempt.

---

## Database Security

### D1 Database

- Each query uses **parameterized statements** (no SQL injection).
- User isolation via `WHERE user_id = ?` on all queries.
- Foreign key constraints enforce referential integrity.

### Community Email Masking

- Emails are masked in query results: `j***@company.com`.
- Full emails require explicit reveal (costs 1 credit).
- Reveal is logged server-side.

---

## Infrastructure Security

### Cloudflare Workers

- Code runs in Cloudflare's isolated sandbox.
- No direct database access from the internet.
- All traffic goes through Cloudflare's edge network.
- DDoS protection included.

### Environment Variables

- Secrets stored as Cloudflare Pages secrets (encrypted at rest).
- Never committed to version control.
- `.env` file is in `.gitignore`.

---

## Best Practices for Users

1. **Use burner domains** for outreach. Never use your primary domain.
2. **Rotate API keys** periodically in the Key Manager.
3. **Monitor bounce rates.** The auto-pause protects your sender reputation.
4. **Contribute verified emails** to build community credits before you need them.
5. **Keep AUTH_SECRET secure.** It is the master key for all encrypted data.

---

## Reporting Vulnerabilities

If you discover a security vulnerability, please open a GitHub issue with:
- Description of the vulnerability.
- Steps to reproduce.
- Potential impact.
- Suggested fix (if applicable).

Do not disclose vulnerabilities publicly until they are addressed.
