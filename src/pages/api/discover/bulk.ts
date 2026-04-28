// src/pages/api/discover/bulk.ts
import type { APIRoute } from 'astro'
import { decryptKey } from '@/lib/encryption'
import { waterfallFind } from '@/lib/waterfall'

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user
  if (!user) return new Response('Unauthorized', { status: 401 })

  const env = locals.env
  const { rows } = await request.json() as { rows: Array<{ firstName: string; lastName: string; company: string; domain?: string; role?: string }> }

  if (!Array.isArray(rows) || rows.length > 50) {
    return new Response(JSON.stringify({ error: 'Max 50 rows allowed' }), { status: 400 })
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

  const results: Array<{
    firstName: string
    lastName: string
    company: string
    domain?: string
    role?: string
    email: string | null
    confidence: number
    source: string
    error?: string
  }> = []

  for (const row of rows) {
    const { firstName, lastName, company, domain, role } = row
    try {
      const res = await waterfallFind({ firstName, lastName, company, domain, role }, keys, 80)
      results.push({
        firstName,
        lastName,
        company,
        domain,
        role,
        email: res.email,
        confidence: res.confidence,
        source: res.source,
      })
    } catch (err) {
      results.push({
        firstName,
        lastName,
        company,
        domain,
        role,
        email: null,
        confidence: 0,
        source: 'error',
        error: (err as Error).message,
      })
    }
  }

  const summary = {
    total: results.length,
    found: results.filter(r => r.email).length,
    notFound: results.filter(r => !r.email).length,
  }

  return new Response(JSON.stringify({ results, summary }), {
    headers: { 'Content-Type': 'application/json' },
  })
}