# Community Guide

## Overview

Pitch OS is **MIT licensed** and **community-driven**. The community database is a shared repository of verified business emails, crowd-sourced by users. This guide explains how to contribute, how the credit system works, and how to add new providers.

---

## Community Database

### How It Works

1. **Search** -- Query the community DB by company, role, or domain
2. **Results are masked** -- Emails appear as `j***@company.com`
3. **Reveal** -- Spend 1 credit to see the full email
4. **Contribute** -- Earn credits by contributing verified emails

### Credit Economy

| Action | Credits |
|--------|---------|
| Contribute a verified email | +1 |
| Reveal a full email | -1 |
| Initial balance | 0 |

### Why Credits?

The credit system prevents **free-riding** -- users who only consume without contributing. It's not a paywall; it's a gentle nudge to give back to the community. If you verify emails during your workflow, contribute them and you'll never run out of credits.

### Making It Fully Open

If you prefer no credit system, modify the reveal endpoint to skip the credit check:

```typescript
// src/pages/api/community/reveal.ts -- remove credit check
// Remove lines 12-24 (credit balance check)
// Remove line 40-44 (credit deduction)
// Just return the email directly
```

---

## Adding a New Provider

Pitch OS uses an **adapter pattern** -- each provider implements a standard function signature. No core logic changes needed.

### Email Finder Adapter

1. Create your finder function in [`src/lib/waterfall.ts`](../src/lib/waterfall.ts):

```typescript
async function findYourProvider(
  opts: FinderOptions,
  apiKey: string
): Promise<FinderResult> {
  // 1. Call the provider's API
  // 2. Parse the response
  // 3. Return FinderResult
  const res = await fetch(`https://api.yourprovider.com/find`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      first_name: opts.firstName,
      last_name: opts.lastName,
      company: opts.company,
    }),
  })
  if (!res.ok) return { email: null, confidence: 0, source: 'none' }

  const data = await res.json()
  return {
    email: data.email,
    confidence: data.confidence ?? 80,
    source: 'yourprovider',
  }
}
```

2. Add it to the waterfall array:

```typescript
const FINDERS = [
  { service: 'apollo', fn: findApollo },
  { service: 'yourprovider', fn: findYourProvider },
  // ...
]
```

### Email Verifier Adapter

1. Create your verifier function in [`src/lib/verifier.ts`](../src/lib/verifier.ts):

```typescript
async function verifyYourProvider(
  email: string,
  apiKey: string
): Promise<VerifyResult | null> {
  const res = await fetch(`https://api.yourprovider.com/verify?email=${encodeURIComponent(email)}`, {
    headers: { 'X-API-Key': apiKey },
  })
  if (!res.ok) return null

  const data = await res.json()
  return {
    email,
    status: data.valid ? 'valid' : 'invalid',
    subStatus: data.reason ?? '',
    score: data.valid ? 9 : 1,
    safe_to_send: data.valid,
    verifiedBy: 'yourprovider',
    verifiedAt: new Date().toISOString(),
    freeEmail: data.is_free ?? false,
    mxFound: data.has_mx ?? false,
  }
}
```

2. Add it to the waterfall array:

```typescript
const VERIFIERS = [
  { service: 'zerobounce', fn: verifyZeroBounce },
  { service: 'yourprovider', fn: verifyYourProvider },
  // ...
]
```

### Email Sender Adapter

1. Create your sender function in [`src/pages/api/send/dispatch.ts`](../src/pages/api/send/dispatch.ts):

```typescript
async function sendViaYourProvider(params: {
  apiKey: string
  fromEmail: string
  fromName: string
  toEmail: string
  subject: string
  htmlBody: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const res = await fetch('https://api.yourprovider.com/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${params.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${params.fromName} <${params.fromEmail}>`,
      to: params.toEmail,
      subject: params.subject,
      html: params.htmlBody,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return { success: false, error: err }
  }

  const data = await res.json()
  return { success: true, messageId: data.id }
}
```

2. Add it to the sender selection logic in `selectAndSend()`.

---

## Contributing Code

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-addition`)
3. Make your changes
4. Run `pnpm type-check` and `pnpm build` to verify
5. Commit with clear messages
6. Open a PR against `main`

### Coding Standards

- **TypeScript** -- strict mode, no `any` where possible
- **React** -- functional components with hooks
- **API Routes** -- Astro `APIRoute` pattern with `locals.env` and `locals.user`
- **Styling** -- Tailwind utility classes, dark theme CSS variables
- **Database** -- D1 with `dbGet`, `dbAll`, `dbRun` helpers

### What Makes a Good PR

- Adds a new provider adapter (finder, verifier, or sender)
- Fixes a bug with reproduction steps
- Improves documentation
- Does NOT change core architecture without discussion

---

## Reporting Issues

Open an issue with:
- Description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if UI-related)
- Environment (browser, OS, deployment type)
