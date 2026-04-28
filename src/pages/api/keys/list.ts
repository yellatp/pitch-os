// src/pages/api/keys/list.ts
// Returns ONLY which keys are saved — never the encrypted or plaintext values

import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user
  if (!user) return new Response('Unauthorized', { status: 401 })

  const env = locals.env

  const list = await env.KEYS_KV.list({ prefix: `keys:${user.id}:` })

  const savedKeys = list.keys.map((k: any) => ({
    service: k.name.replace(`keys:${user.id}:`, ''),
    savedAt: k.metadata?.savedAt ?? null,
  }))

  return new Response(JSON.stringify({ keys: savedKeys }), {
    headers: { 'Content-Type': 'application/json' },
  })
}