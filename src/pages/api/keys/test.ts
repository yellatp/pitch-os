// src/pages/api/keys/test.ts
import type { APIRoute } from 'astro'
import { decryptKey } from '@/lib/encryption'

async function testKey(service: string, apiKey: string): Promise<boolean> {
  try {
    switch (service) {
      case 'resend': {
        const r = await fetch('https://api.resend.com/domains', {
          headers: { Authorization: `Bearer ${apiKey}` },
        })
        return r.ok
      }
      case 'brevo': {
        const r = await fetch('https://api.brevo.com/v3/account', {
          headers: { 'api-key': apiKey },
        })
        return r.ok
      }
      case 'zerobounce': {
        const r = await fetch(
          `https://api.zerobounce.net/v2/getcredits?api_key=${apiKey}`
        )
        const d = await r.json() as { Credits?: string }
        return d.Credits !== '-1'
      }
      case 'hunter': {
        const r = await fetch(
          `https://api.hunter.io/v2/account?api_key=${apiKey}`
        )
        return r.ok
      }
      case 'apollo': {
        const r = await fetch('https://api.apollo.io/v1/auth/health', {
          headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        })
        return r.ok
      }
      case 'openai': {
        const r = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        })
        return r.ok
      }
      case 'neverbounce': {
        const r = await fetch(
          `https://api.neverbounce.com/v4/account/info?key=${apiKey}`
        )
        return r.ok
      }
      case 'millionverifier': {
        const r = await fetch(
          `https://api.millionverifier.com/api/v3/?api=${apiKey}&email=test@example.com`
        )
        return r.ok
      }
      // For services without a lightweight health endpoint, skip test
      default:
        return true
    }
  } catch {
    return false
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user
  if (!user) return new Response('Unauthorized', { status: 401 })

  const env = locals.env
  const { service } = await request.json() as { service: string }

  const encrypted = await env.KEYS_KV.get(`keys:${user.id}:${service}`)
  if (!encrypted) {
    return new Response(JSON.stringify({ ok: false, error: 'Key not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const apiKey = await decryptKey(encrypted, env.AUTH_SECRET, user.id)
  const isWorking = await testKey(service, apiKey)

  return new Response(JSON.stringify({ ok: isWorking, service }), {
    headers: { 'Content-Type': 'application/json' },
  })
}