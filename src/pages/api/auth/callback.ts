// src/pages/api/auth/callback.ts
import type { APIRoute } from 'astro'
import {
  exchangeGoogleCode,
  fetchGoogleUser,
  findOrCreateUser,
  createSessionToken,
  makeSessionCookie,
  SESSION_DURATION_SECONDS,
} from '@/lib/auth'

export const GET: APIRoute = async ({ request, locals }) => {
  const env = locals.env;
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  // Validate state
  const cookieHeader = request.headers.get('cookie') || ''
  const stateCookie = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith('oauth_state='))
    ?.split('=')[1]
    ?.trim()

  if (!code || !state || state !== stateCookie) {
    return new Response('Invalid OAuth state', { status: 400 })
  }

  // Exchange code for tokens
  const tokens = await exchangeGoogleCode(
    code,
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    `${env.APP_URL}/api/auth/callback`
  )
  if (!tokens) {
    return new Response('Failed to exchange code', { status: 400 })
  }

  // Fetch Google user profile
  const googleUser = await fetchGoogleUser(tokens.access_token)
  if (!googleUser) {
    return new Response('Failed to fetch user profile', { status: 400 })
  }

  // Find or create user in D1
  const user = await findOrCreateUser(env.DB, googleUser)

  // Create signed JWT session token
  const exp = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS
  const token = await createSessionToken({ ...user, exp }, env.AUTH_SECRET)

  const isSecure = env.APP_URL.startsWith('https')

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/dashboard',
      'Set-Cookie': [
        makeSessionCookie(token, isSecure),
        'oauth_state=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0', // clear state cookie
      ].join(', '),
    },
  })
}