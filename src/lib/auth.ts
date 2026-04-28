// src/lib/auth.ts

import { nanoid } from 'nanoid'

export interface SessionUser {
  id: string
  email: string
  name: string
  avatar: string
}

// ─── JWT helpers (Web Crypto — works in CF Workers) ────────────────────────

async function getSigningKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

function base64url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64urlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  return atob(base64)
}

export async function createSessionToken(
  payload: SessionUser & { exp: number },
  secret: string
): Promise<string> {
  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).buffer)
  const body = base64url(new TextEncoder().encode(JSON.stringify(payload)).buffer)
  const signingKey = await getSigningKey(secret)
  const signature = await crypto.subtle.sign(
    'HMAC',
    signingKey,
    new TextEncoder().encode(`${header}.${body}`)
  )
  return `${header}.${body}.${base64url(signature)}`
}

export async function verifySessionToken(
  token: string,
  secret: string
): Promise<(SessionUser & { exp: number }) | null> {
  try {
    const [header, body, signature] = token.split('.')
    if (!header || !body || !signature) return null

    const signingKey = await getSigningKey(secret)
    const valid = await crypto.subtle.verify(
      'HMAC',
      signingKey,
      Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
      new TextEncoder().encode(`${header}.${body}`)
    )
    if (!valid) return null

    const payload = JSON.parse(base64urlDecode(body))
    if (payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}

// ─── Session cookie helpers ──────────────────────────────────────────────────

export const SESSION_COOKIE = 'pitch_os_session'
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7 // 7 days

export function makeSessionCookie(token: string, secure: boolean): string {
  const flags = [
    `${SESSION_COOKIE}=${token}`,
    'HttpOnly',
    'SameSite=Lax',
    `Path=/`,
    `Max-Age=${SESSION_DURATION_SECONDS}`,
    secure ? 'Secure' : '',
  ].filter(Boolean)
  return flags.join('; ')
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
}

// ─── Google OAuth URL builder ────────────────────────────────────────────────

export function buildGoogleAuthURL(
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'select_account',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

// ─── Google token exchange ────────────────────────────────────────────────────

export async function exchangeGoogleCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ access_token: string; id_token: string } | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) return null
  return res.json()
}

// ─── Google user info fetch ───────────────────────────────────────────────────

export async function fetchGoogleUser(accessToken: string): Promise<{
  sub: string
  email: string
  name: string
  picture: string
} | null> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  return res.json()
}

// ─── User DB helpers ──────────────────────────────────────────────────────────

export async function findOrCreateUser(
  db: D1Database,
  googleUser: { sub: string; email: string; name: string; picture: string }
): Promise<SessionUser> {
  // Try to find existing user
  const existing = await db
    .prepare('SELECT id, email, name, avatar_url FROM users WHERE google_id = ?')
    .bind(googleUser.sub)
    .first<{ id: string; email: string; name: string; avatar_url: string }>()

  if (existing) {
    return {
      id: existing.id,
      email: existing.email,
      name: existing.name,
      avatar: existing.avatar_url,
    }
  }

  // Create new user
  const id = nanoid()
  await db
    .prepare(
      'INSERT INTO users (id, google_id, email, name, avatar_url) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(id, googleUser.sub, googleUser.email, googleUser.name, googleUser.picture)
    .run()

  return {
    id,
    email: googleUser.email,
    name: googleUser.name,
    avatar: googleUser.picture,
  }
}