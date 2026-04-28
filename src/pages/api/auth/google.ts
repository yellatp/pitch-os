// src/pages/api/auth/google.ts
import type { APIRoute } from 'astro'
import { buildGoogleAuthURL } from '@/lib/auth'

export const GET: APIRoute = async ({ locals }) => {
  const env = locals.env
  const state = crypto.randomUUID()

  // Store state in a short-lived cookie to validate on callback
  const url = buildGoogleAuthURL(
    env.GOOGLE_CLIENT_ID,
    `${env.APP_URL}/api/auth/callback`,
    state
  )

  return new Response(null, {
    status: 302,
    headers: {
      Location: url,
      'Set-Cookie': `oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=300`,
    },
  })
}