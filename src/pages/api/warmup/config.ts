// src/pages/api/warmup/config.ts
// GET  — fetch warmup config for current user
// POST — upsert warmup config

import type { APIRoute } from 'astro'
import { dbGet, dbRun } from '@/lib/db'

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user
  if (!user) return new Response('Unauthorized', { status: 401 })

  const env = locals.env

  const config = await dbGet<{
    inbox_email: string
    provider: string
    status: string
    start_date: string
    target_daily_volume: number
    current_daily_volume: number
    days_active: number
  }>(env.DB, 'SELECT * FROM warmup_config WHERE user_id = ?', [user.id])

  return new Response(JSON.stringify({ config: config ?? null }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user
  if (!user) return new Response('Unauthorized', { status: 401 })

  const env = locals.env
  const body = await request.json() as {
    inbox_email?: string
    provider?: string
    target_daily_volume?: number
  }

  // Validate provider if provided
  if (body.provider && !['mails_ai', 'trulyinbox'].includes(body.provider)) {
    return new Response(JSON.stringify({ error: 'Provider must be mails_ai or trulyinbox' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Check if config exists
  const existing = await dbGet<{ user_id: string }>(
    env.DB, 'SELECT user_id FROM warmup_config WHERE user_id = ?', [user.id]
  )

  if (existing) {
    // Update existing config
    const updates: string[] = []
    const params: unknown[] = []

    if (body.inbox_email !== undefined) {
      updates.push('inbox_email = ?')
      params.push(body.inbox_email)
    }
    if (body.provider !== undefined) {
      updates.push('provider = ?')
      params.push(body.provider)
    }
    if (body.target_daily_volume !== undefined) {
      updates.push('target_daily_volume = ?')
      params.push(body.target_daily_volume)
    }

    if (updates.length > 0) {
      params.push(user.id)
      await dbRun(env.DB,
        `UPDATE warmup_config SET ${updates.join(', ')} WHERE user_id = ?`,
        params
      )
    }
  } else {
    // Create new config
    await dbRun(env.DB,
      `INSERT INTO warmup_config (user_id, inbox_email, provider, status, start_date, target_daily_volume, current_daily_volume, days_active)
       VALUES (?, ?, ?, 'inactive', datetime('now'), ?, 5, 0)`,
      [user.id, body.inbox_email ?? null, body.provider ?? null, body.target_daily_volume ?? 20]
    )
  }

  // Return updated config
  const config = await dbGet<{
    inbox_email: string
    provider: string
    status: string
    start_date: string
    target_daily_volume: number
    current_daily_volume: number
    days_active: number
  }>(env.DB, 'SELECT * FROM warmup_config WHERE user_id = ?', [user.id])

  return new Response(JSON.stringify({ ok: true, config }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
