// src/middleware.ts
import { defineMiddleware } from 'astro:middleware'
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth'

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/keys',
  '/discover',
  '/verify',
  '/compose',
  '/campaigns',
  '/community-db',
  '/warmup',
  '/dns-wizard',
  '/api/keys/',
  '/api/discover/',
  '/api/verify/',
  '/api/send/',
  '/api/community/',
  '/api/ai/',
]

// Routes that logged-in users should not see (redirect to dashboard)
const AUTH_ROUTES = ['/login']

export const onRequest = defineMiddleware(async (context, next) => {
  const { locals, request, redirect } = context
  const env = locals.env;
  const pathname = new URL(request.url).pathname

  // Extract session token from cookie
  const cookieHeader = request.headers.get('cookie') || ''
  const token = cookieHeader
    .split(';')
    .find(c => c.trim().startsWith(`${SESSION_COOKIE}=`))
    ?.split('=')
    .slice(1)
    .join('=')
    .trim()

  let user = null
  if (token) {
    user = await verifySessionToken(token, env.AUTH_SECRET)
  }

  // Attach user to locals for use in pages
  if (user) {
    locals.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    }
  }

  // Guard protected routes
  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r))
  if (isProtected && !user) {
    return redirect('/login?next=' + encodeURIComponent(pathname))
  }

  // Redirect logged-in users away from auth pages
  const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r))
  if (isAuthRoute && user) {
    return redirect('/dashboard')
  }

  return next()
})