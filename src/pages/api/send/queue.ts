import type { APIRoute } from 'astro'
import { dbAll, dbRun, dbGet } from '@/lib/db'
import { randomSendDelay } from '@/lib/ratelimiter'

// Manual trigger endpoint (for dev/testing)
export const POST: APIRoute = async ({ locals }) => {
  const user = locals.user
  if (!user) return new Response('Unauthorized', { status: 401 })

  const env = locals.env

  // Find one queued recipient for any running campaign owned by this user
  const next = await dbGet<{
    id: string
    campaign_id: string
    recipient_email: string
    recipient_name: string
    recipient_company: string
    recipient_role: string
    linkedin_headline: string
  }>(
    env.DB,
    `SELECT l.id, l.campaign_id, l.recipient_email, l.recipient_name, l.recipient_company, l.recipient_role, l.linkedin_headline
     FROM outreach_log l
     JOIN campaigns c ON c.id = l.campaign_id
     WHERE c.user_id = ? AND c.status = 'running' AND l.status = 'queued'
     ORDER BY l.created_at
     LIMIT 1`,
    [user.id]
  )

  if (!next) {
    return new Response(JSON.stringify({ ok: false, reason: 'No queued emails for your running campaigns.' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Get campaign details
  const campaign = await dbGet<{ from_email: string; from_name: string }>(
    env.DB,
    'SELECT from_email, from_name FROM campaigns WHERE id = ?',
    [next.campaign_id]
  )
  if (!campaign) {
    return new Response(JSON.stringify({ ok: false, reason: 'Campaign not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Call the dispatcher
  const dispatchRes = await fetch(`${env.APP_URL}/api/send/dispatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      logId: next.id,
      campaignId: next.campaign_id,
      fromEmail: campaign.from_email,
      fromName: campaign.from_name,
      recipientEmail: next.recipient_email,
      recipientName: next.recipient_name,
      recipientCompany: next.recipient_company,
      recipientRole: next.recipient_role,
      linkedinHeadline: next.linkedin_headline,
    }),
  })

  if (!dispatchRes.ok) {
    const d = await dispatchRes.json() as { reason?: string }
    return new Response(JSON.stringify({ ok: false, reason: d.reason || 'Dispatch failed' }), {
      status: dispatchRes.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const d = await dispatchRes.json() as { sentVia?: string; renderedSubject?: string }

  // Optional delay to mimic human cadence (dev mode only)
  if (env.DEV_MODE) {
    await new Promise(r => setTimeout(r, randomSendDelay()))
  }

  return new Response(JSON.stringify({ ok: true, sentVia: d.sentVia, renderedSubject: d.renderedSubject }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

// GET: show queue status
export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user
  if (!user) return new Response('Unauthorized', { status: 401 })

  const env = locals.env

  const queued = await dbAll(
    env.DB,
    `SELECT c.name, COUNT(*) as queued
     FROM outreach_log l
     JOIN campaigns c ON c.id = l.campaign_id
     WHERE c.user_id = ? AND c.status = 'running' AND l.status = 'queued'
     GROUP BY c.id
     ORDER BY queued DESC`,
    [user.id]
  )

  const rateLimited = await dbAll(
    env.DB,
    `SELECT c.name, COUNT(*) as rate_limited
     FROM outreach_log l
     JOIN campaigns c ON c.id = l.campaign_id
     WHERE c.user_id = ? AND l.status = 'rate_limited'
     GROUP BY c.id
     ORDER BY rate_limited DESC`,
    [user.id]
  )

  return new Response(JSON.stringify({ queued, rateLimited }), {
    headers: { 'Content-Type': 'application/json' },
  })
}