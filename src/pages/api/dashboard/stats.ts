// src/pages/api/dashboard/stats.ts
// GET — aggregate dashboard statistics for the current user

import type { APIRoute } from 'astro'
import { dbAll, dbGet } from '@/lib/db'

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user
  if (!user) return new Response('Unauthorized', { status: 401 })

  const env = locals.env

  // ── Emails Found (from community_emails contributed by this user) ──────
  const emailsFound = await dbGet<{ count: number }>(
    env.DB,
    'SELECT COUNT(*) as count FROM community_emails WHERE contributed_by = ?',
    [user.id]
  )

  // ── Emails Verified (from outreach_log sent by this user) ──────────────
  const emailsVerified = await dbGet<{ count: number }>(
    env.DB,
    'SELECT COUNT(*) as count FROM outreach_log WHERE user_id = ? AND status IN (\'sent\', \'opened\', \'replied\')',
    [user.id]
  )

  // ── Campaigns Sent ─────────────────────────────────────────────────────
  const campaignsSent = await dbGet<{ count: number }>(
    env.DB,
    'SELECT COUNT(*) as count FROM campaigns WHERE user_id = ? AND sent_count > 0',
    [user.id]
  )

  // ── DB Contributed (community emails contributed) ──────────────────────
  const dbContributed = await dbGet<{ count: number }>(
    env.DB,
    'SELECT COUNT(*) as count FROM community_emails WHERE contributed_by = ?',
    [user.id]
  )

  // ── Today's sends ──────────────────────────────────────────────────────
  const todaySent = await dbGet<{ count: number }>(
    env.DB,
    "SELECT COUNT(*) as count FROM outreach_log WHERE user_id = ? AND status = 'sent' AND date(sent_at) = date('now')",
    [user.id]
  )

  // ── Active campaigns ───────────────────────────────────────────────────
  const activeCampaigns = await dbAll<{ id: string; name: string; status: string; sent_count: number; target_count: number }>(
    env.DB,
    "SELECT id, name, status, sent_count, target_count FROM campaigns WHERE user_id = ? AND status IN ('running', 'paused') ORDER BY updated_at DESC LIMIT 5",
    [user.id]
  )

  // ── Recent activity (last 10 sends) ────────────────────────────────────
  const recentActivity = await dbAll<{
    id: string
    recipient_email: string
    status: string
    sent_via: string
    sent_at: string
    campaign_name: string
  }>(
    env.DB,
    `SELECT l.id, l.recipient_email, l.status, l.sent_via, l.sent_at, c.name as campaign_name
     FROM outreach_log l
     JOIN campaigns c ON c.id = l.campaign_id
     WHERE l.user_id = ? AND l.status IN ('sent', 'opened', 'replied', 'failed')
     ORDER BY l.sent_at DESC LIMIT 10`,
    [user.id]
  )

  // ── Warmup status ──────────────────────────────────────────────────────
  const warmup = await dbGet<{ status: string; current_daily_volume: number; target_daily_volume: number; days_active: number }>(
    env.DB,
    'SELECT status, current_daily_volume, target_daily_volume, days_active FROM warmup_config WHERE user_id = ?',
    [user.id]
  )

  // ── DNS checks ─────────────────────────────────────────────────────────
  const dnsChecks = await dbAll<{ domain: string; spf_valid: number; dkim_valid: number; dmarc_valid: number }>(
    env.DB,
    'SELECT domain, spf_valid, dkim_valid, dmarc_valid FROM dns_checks WHERE user_id = ? ORDER BY last_checked DESC LIMIT 3',
    [user.id]
  )

  return new Response(JSON.stringify({
    emailsFound: emailsFound?.count ?? 0,
    emailsVerified: emailsVerified?.count ?? 0,
    campaignsSent: campaignsSent?.count ?? 0,
    dbContributed: dbContributed?.count ?? 0,
    todaySent: todaySent?.count ?? 0,
    activeCampaigns,
    recentActivity,
    warmup,
    dnsChecks,
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
