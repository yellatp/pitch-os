// src/pages/api/discover/search.ts
import type { APIRoute } from 'astro'
import { decryptKey } from '@/lib/encryption'
import { waterfallFind } from '@/lib/waterfall'

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ ok: true, stub: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user
  if (!user) return new Response('Unauthorized', { status: 401 })

  const env = locals.env
  const body = await request.json() as {
    mode: 'single' | 'domain' | 'bulk'
    firstName?: string
    lastName?: string
    company?: string
    domain?: string
    role?: string
    linkedinUrl?: string
    rows?: Array<{ firstName: string; lastName: string; company: string; domain?: string; role?: string }>
  }

  const { mode, firstName, lastName, company, domain, role, linkedinUrl } = body

  if (mode === 'single') {
    if (!firstName || !lastName || !company) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })
    }

    // Fetch keys for user
    const list = await env.KEYS_KV.list({ prefix: `keys:${user.id}:` })
    const keys: Record<string, string> = {}
    for (const k of list.keys) {
      const service = k.name.replace(`keys:${user.id}:`, '')
      const encrypted = await env.KEYS_KV.get(k.name)
      if (encrypted) {
        try {
          keys[service] = await decryptKey(encrypted, env.AUTH_SECRET, user.id)
        } catch {}
      }
    }

    const result = await waterfallFind(
      { firstName, lastName, company, domain, role, linkedinUrl },
      keys
    )

    return new Response(
      JSON.stringify({
        email: result.email,
        confidence: result.confidence,
        source: result.source,
        attempts: result.attempts,
        firstName,
        lastName,
        company,
        role,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (mode === 'domain') {
    if (!domain) {
      return new Response(JSON.stringify({ error: 'Missing domain' }), { status: 400 })
    }

    // Hunter domain search
    const encrypted = await env.KEYS_KV.get(`keys:${user.id}:hunter`)
    if (!encrypted) {
      return new Response(JSON.stringify({ error: 'Hunter key not configured' }), { status: 400 })
    }

    let apiKey: string
    try {
      apiKey = await decryptKey(encrypted, env.AUTH_SECRET, user.id)
    } catch {
      return new Response(JSON.stringify({ error: 'Key decryption failed' }), { status: 500 })
    }

    const q = new URLSearchParams({ api_key: apiKey, domain: domain.trim() })
    const res = await fetch(`https://api.hunter.io/v2/domain-search?${q}`)
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Hunter API error' }), { status: 502 })
    }

    const d = (await res.json()) as {
      data?: {
        emails?: Array<{
          value: string
          first_name?: string
          last_name?: string
          position?: string
        }>
        total?: number
      }
    }

    const emails =
      d.data?.emails?.map(e => ({
        email: e.value,
        firstName: e.first_name ?? '',
        lastName: e.last_name ?? '',
        role: e.position ?? '',
      })) ?? []

    return new Response(
      JSON.stringify({ emails, total: d.data?.total ?? 0 }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  return new Response(JSON.stringify({ error: 'Invalid mode' }), { status: 400 })
}