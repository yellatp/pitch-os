// src/pages/api/keys/save.ts
import type { APIRoute } from 'astro'
import { encryptKey } from '@/lib/encryption'

// Allowed service key names (whitelist)
const ALLOWED_SERVICES = new Set([
  // Finders
  'apollo', 'rocketreach', 'hunter', 'skrapp', 'prospeo',
  'getprospect', 'contactout', 'wiza', 'signalhire', 'aeroleads',
  // Verifiers
  'zerobounce', 'neverbounce', 'millionverifier', 'debounce',
  'emailable', 'myemailverifier', 'verifalia',
  // Senders
  'resend', 'brevo', 'mailersend', 'postmark', 'mailgun',
  // Warmup
  'mails_ai', 'trulyinbox',
  // AI
  'openai',
])

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user
  if (!user) return new Response('Unauthorized', { status: 401 })

  const env = locals.env

  let body: { service: string; key: string }
  try {
    body = await request.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { service, key } = body

  if (!service || !key) {
    return new Response(JSON.stringify({ error: 'Missing service or key' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!ALLOWED_SERVICES.has(service)) {
    return new Response(JSON.stringify({ error: 'Unknown service' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Encrypt before storing
  const encrypted = await encryptKey(key, env.AUTH_SECRET, user.id)

  // Store in KV: key = `keys:{userId}:{service}`, value = encrypted blob
  await env.KEYS_KV.put(`keys:${user.id}:${service}`, encrypted)

  return new Response(
    JSON.stringify({ ok: true, service, savedAt: new Date().toISOString() }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

export const DELETE: APIRoute = async ({ request, locals }) => {
  const user = locals.user
  if (!user) return new Response('Unauthorized', { status: 401 })

  const env = locals.env
  const { service } = await request.json() as { service: string }

  if (!ALLOWED_SERVICES.has(service)) {
    return new Response(JSON.stringify({ error: 'Unknown service' }), { status: 400 })
  }

  await env.KEYS_KV.delete(`keys:${user.id}:${service}`)

  return new Response(JSON.stringify({ ok: true, service, deleted: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}