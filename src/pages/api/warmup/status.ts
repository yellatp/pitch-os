// src/pages/api/warmup/status.ts
import type { APIRoute } from 'astro'
import { dbGet, dbRun } from '@/lib/db'

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user
  if (!user) return new Response('Unauthorized', { status: 401 })

  const env = locals.env

  const config = await dbGet<{
    inbox_email: string | null
    provider: string | null
    status: string
    start_date: string | null
    target_daily_volume: number
    current_daily_volume: number
    days_active: number
  }>(
    env.DB,
    'SELECT * FROM warmup_config WHERE user_id = ?',
    [user.id]
  )

  if (!config) {
    // Create default row
    await dbRun(
      env.DB,
      `INSERT OR IGNORE INTO warmup_config (user_id) VALUES (?)`,
      [user.id]
    )
    return new Response(
      JSON.stringify({
        status: 'inactive',
        inbox_email: null,
        provider: null,
        start_date: null,
        target_daily_volume: 5,
        current_daily_volume: 0,
        days_active: 0,
        readiness_score: 0,
        schedule: buildSchedule(0),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  const daysActive = config.start_date
    ? Math.floor((Date.now() - new Date(config.start_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const targetVolume = getTargetVolume(daysActive)
  const readinessScore = Math.min(100, Math.round((daysActive / 30) * 100))

  return new Response(
    JSON.stringify({
      ...config,
      days_active: daysActive,
      target_daily_volume: targetVolume,
      readiness_score: readinessScore,
      is_ready: daysActive >= 30,
      schedule: buildSchedule(daysActive),
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user
  if (!user) return new Response('Unauthorized', { status: 401 })

  const env = locals.env
  const body = await request.json() as {
    action: 'start' | 'stop' | 'update'
    inbox_email?: string
    provider?: string
  }

  if (body.action === 'start') {
    await dbRun(
      env.DB,
      `INSERT INTO warmup_config (user_id, inbox_email, provider, status, start_date, current_daily_volume)
       VALUES (?, ?, ?, 'warming', datetime('now'), 5)
       ON CONFLICT(user_id) DO UPDATE SET
         inbox_email = excluded.inbox_email,
         provider = excluded.provider,
         status = 'warming',
         start_date = datetime('now'),
         current_daily_volume = 5`,
      [user.id, body.inbox_email ?? null, body.provider ?? null]
    )
  } else if (body.action === 'stop') {
    await dbRun(
      env.DB,
      `UPDATE warmup_config SET status = 'inactive', start_date = NULL WHERE user_id = ?`,
      [user.id]
    )
  } else if (body.action === 'update') {
    await dbRun(
      env.DB,
      `UPDATE warmup_config SET inbox_email = ?, provider = ? WHERE user_id = ?`,
      [body.inbox_email ?? null, body.provider ?? null, user.id]
    )
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

// Warmup ramp schedule
function getTargetVolume(daysActive: number): number {
  if (daysActive <= 0)  return 5
  if (daysActive <= 3)  return 5
  if (daysActive <= 7)  return 10
  if (daysActive <= 14) return 20
  if (daysActive <= 21) return 40
  if (daysActive <= 30) return 70
  return 100
}

function buildSchedule(currentDay: number) {
  return [
    { range: 'Days 1–3',   target: 5,   description: 'Initial trust signals',      done: currentDay > 3 },
    { range: 'Days 4–7',   target: 10,  description: 'Building engagement',        done: currentDay > 7 },
    { range: 'Days 8–14',  target: 20,  description: 'Establishing reputation',    done: currentDay > 14 },
    { range: 'Days 15–21', target: 40,  description: 'Scaling up volume',          done: currentDay > 21 },
    { range: 'Days 22–30', target: 70,  description: 'Final ramp to cruising speed', done: currentDay > 30 },
    { range: 'Day 30+',    target: 100, description: 'Domain is ready to campaign', done: false },
  ]
}
