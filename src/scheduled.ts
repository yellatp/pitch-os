import { randomSendDelay } from '@/lib/ratelimiter'
import { dbGet, dbAll, dbRun } from '@/lib/db'

// Worker that runs every 60 seconds to process queued emails
export async function processSendQueue(env: any) {
  const now = new Date().toISOString()

  // Find campaigns that are "running" and have queued recipients
  const running = await dbAll(
    env.DB,
    `SELECT c.id, c.user_id, c.from_email, c.from_name, c.template_id, t.ai_ps_enabled
     FROM campaigns c
     JOIN templates t ON t.id = c.template_id
     WHERE c.status = 'running'
       AND EXISTS (
         SELECT 1 FROM outreach_log l
         WHERE l.campaign_id = c.id AND l.status = 'queued'
         LIMIT 1
       )
     ORDER BY c.created_at`
  ) as any[]

  for (const campaign of running) {
    // Pick one queued recipient for this campaign
    const next = await dbGet<{
      id: string
      recipient_email: string
      recipient_name: string
      recipient_company: string
      recipient_role: string
      linkedin_headline: string
    }>(
      env.DB,
      `SELECT id, recipient_email, recipient_name, recipient_company, recipient_role, linkedin_headline
       FROM outreach_log
       WHERE campaign_id = ? AND status = 'queued'
       ORDER BY created_at
       LIMIT 1`,
      [campaign.id]
    )

    if (!next) continue

    // Rate-limit check before dispatch
    const rateCheck = await import('@/lib/ratelimiter').then(m =>
      m.checkRateLimit(env.DB, campaign.user_id, campaign.id, next.recipient_email)
    )

    if (!rateCheck.allowed) {
      // Mark as rate-limited so we don't retry immediately
      await dbRun(env.DB, `UPDATE outreach_log SET status='rate_limited', updated_at=? WHERE id=?`, [now, next.id])
      continue
    }

    // Call the dispatcher
    const dispatchRes = await fetch(`${env.APP_URL}/api/send/dispatch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': env.QUEUE_API_KEY || 'dev-key',
      },
      body: JSON.stringify({
        logId: next.id,
        campaignId: campaign.id,
        fromEmail: campaign.from_email,
        fromName: campaign.from_name,
        recipientEmail: next.recipient_email,
        recipientName: next.recipient_name,
        recipientCompany: next.recipient_company,
        recipientRole: next.recipient_role,
        linkedinHeadline: next.linkedin_headline,
      }),
    })

    // If dispatcher returns 429 (rate limited), wait and retry later
    if (dispatchRes.status === 429) {
      // Keep status as 'queued' so it will be retried
      // Optional: add a small exponential backoff by updating created_at
      await dbRun(
        env.DB,
        `UPDATE outreach_log SET created_at = datetime('now', '+5 minutes') WHERE id = ?`,
        [next.id]
      )
    }

    // Random delay between sends (90–180 seconds) to mimic human cadence
    await new Promise(r => setTimeout(r, randomSendDelay()))
  }
}

// Scheduled event entry point (Cloudflare Cron)
export default {
  async scheduled(event: any, env: any, ctx: any) {
    ctx.waitUntil(processSendQueue(env))
  },
}