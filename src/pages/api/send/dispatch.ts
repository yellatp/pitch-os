import type { APIRoute } from 'astro'
import { checkRateLimit } from '@/lib/ratelimiter'
import { renderTemplate } from '@/lib/spintax'
import { decryptKey } from '@/lib/encryption'
import { dbGet, dbRun } from '@/lib/db'

// ─── Sender adapters ──────────────────────────────────────────────────────────

async function sendViaResend(params: {
  from: string; fromName: string; to: string; subject: string; body: string
}, apiKey: string): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: `${params.fromName} <${params.from}>`,
      to: [params.to],
      subject: params.subject,
      text: params.body,
    }),
  })
  return res.ok
}

async function sendViaBrevo(params: {
  from: string; fromName: string; to: string; toName: string; subject: string; body: string
}, apiKey: string): Promise<boolean> {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
    body: JSON.stringify({
      sender: { name: params.fromName, email: params.from },
      to: [{ email: params.to, name: params.toName }],
      subject: params.subject,
      textContent: params.body,
    }),
  })
  return res.ok
}

async function sendViaMailerSend(params: {
  from: string; fromName: string; to: string; subject: string; body: string
}, apiKey: string): Promise<boolean> {
  const res = await fetch('https://api.mailersend.com/v1/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: { email: params.from, name: params.fromName },
      to: [{ email: params.to }],
      subject: params.subject,
      text: params.body,
    }),
  })
  return res.ok
}

async function sendViaPostmark(params: {
  from: string; to: string; subject: string; body: string
}, apiKey: string): Promise<boolean> {
  const res = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': apiKey,
    },
    body: JSON.stringify({
      From: params.from,
      To: params.to,
      Subject: params.subject,
      TextBody: params.body,
    }),
  })
  return res.ok
}

async function sendViaMailgun(params: {
  from: string; to: string; subject: string; body: string; domain: string
}, apiKey: string): Promise<boolean> {
  const formData = new FormData()
  formData.append('from', params.from)
  formData.append('to', params.to)
  formData.append('subject', params.subject)
  formData.append('text', params.body)

  const res = await fetch(`https://api.mailgun.net/v3/${params.domain}/messages`, {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`api:${apiKey}`)}` },
    body: formData,
  })
  return res.ok
}

// ─── Sender selection (try in priority order) ─────────────────────────────────

async function selectAndSend(
  params: {
    from: string; fromName: string; to: string; toName: string; subject: string; body: string
  },
  kv: KVNamespace,
  authSecret: string,
  userId: string
): Promise<{ success: boolean; sentVia: string }> {
  const senders = [
    { service: 'resend',     fn: async (k: string) => sendViaResend({ ...params }, k) },
    { service: 'brevo',      fn: async (k: string) => sendViaBrevo({ ...params }, k) },
    { service: 'mailersend', fn: async (k: string) => sendViaMailerSend({ ...params }, k) },
    { service: 'postmark',   fn: async (k: string) => sendViaPostmark({ ...params }, k) },
  ]

  for (const sender of senders) {
    const encrypted = await kv.get(`keys:${userId}:${sender.service}`)
    if (!encrypted) continue

    let apiKey: string
    try {
      apiKey = await decryptKey(encrypted, authSecret, userId)
    } catch { continue }

    try {
      const success = await sender.fn(apiKey)
      if (success) return { success: true, sentVia: sender.service }
    } catch { continue }
  }

  return { success: false, sentVia: 'none' }
}

// ─── Main dispatch handler ────────────────────────────────────────────────────

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user
  if (!user) return new Response('Unauthorized', { status: 401 })

  const env = locals.env

  const body = await request.json() as {
    logId: string           // outreach_log.id to dispatch
    campaignId: string
    fromEmail: string
    fromName: string
    recipientEmail: string
    recipientName?: string
    recipientCompany?: string
    recipientRole?: string
    variables?: Record<string, string>
    linkedinHeadline?: string
  }

  // Rate limit check
  const rateCheck = await checkRateLimit(env.DB, user.id, body.campaignId, body.recipientEmail)
  if (!rateCheck.allowed) {
    return new Response(JSON.stringify({ ok: false, reason: rateCheck.reason }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Get template
  const campaign = await dbGet<{ template_id: string }>(
    env.DB, 'SELECT template_id FROM campaigns WHERE id = ? AND user_id = ?',
    [body.campaignId, user.id]
  )
  if (!campaign) return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404 })

  const template = await dbGet<{
    subject_spintax: string; body_spintax: string; ai_ps_enabled: number
  }>(
    env.DB, 'SELECT subject_spintax, body_spintax, ai_ps_enabled FROM templates WHERE id = ?',
    [campaign.template_id]
  )
  if (!template) return new Response(JSON.stringify({ error: 'Template not found' }), { status: 404 })

  // Prepare variables
  const variables: Record<string, string> = {
    FirstName: body.recipientName?.split(' ')[0] ?? '',
    FullName:  body.recipientName ?? '',
    Company:   body.recipientCompany ?? '',
    Role:      body.recipientRole ?? '',
    ...(body.variables ?? {}),
  }

  // Render template (substitute vars + resolve spintax)
  const renderedSubject = renderTemplate(template.subject_spintax, variables)
  let renderedBody = renderTemplate(template.body_spintax, variables)

  // AI P.S. injection (if enabled + OpenAI key present)
  if (template.ai_ps_enabled) {
    try {
      const psRes = await fetch(`${env.APP_URL}/api/ai/personalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('Cookie') ?? '' },
        body: JSON.stringify({
          recipientName: body.recipientName ?? '',
          recipientRole: body.recipientRole,
          company: body.recipientCompany ?? '',
          linkedinHeadline: body.linkedinHeadline,
          templateCategory: 'custom',
        }),
      })
      if (psRes.ok) {
        const psData = await psRes.json() as { ps_line?: string }
        if (psData.ps_line) {
          renderedBody += `\n\nP.S. ${psData.ps_line}`
        }
      }
    } catch {
      // Non-fatal — send without PS if AI fails
    }
  }

  // Send
  const { success, sentVia } = await selectAndSend(
    {
      from: body.fromEmail,
      fromName: body.fromName,
      to: body.recipientEmail,
      toName: body.recipientName ?? '',
      subject: renderedSubject,
      body: renderedBody,
    },
    env.KEYS_KV,
    env.AUTH_SECRET,
    user.id
  )

  const now = new Date().toISOString()

  if (success) {
    // Update outreach_log
    await dbRun(env.DB,
      `UPDATE outreach_log SET status='sent', sent_via=?, rendered_subject=?, sent_at=? WHERE id=?`,
      [sentVia, renderedSubject, now, body.logId]
    )

    // Increment campaign sent_count
    await dbRun(env.DB,
      `UPDATE campaigns SET sent_count = sent_count + 1, updated_at=datetime('now') WHERE id=?`,
      [body.campaignId]
    )

    // Increment user total_sent
    await dbRun(env.DB, 'UPDATE users SET total_sent = total_sent + 1 WHERE id=?', [user.id])

    return new Response(JSON.stringify({ ok: true, sentVia, renderedSubject }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Failed — update status
  await dbRun(env.DB, `UPDATE outreach_log SET status='failed' WHERE id=?`, [body.logId])

  return new Response(
    JSON.stringify({ ok: false, reason: 'All configured senders failed. Check keys in /keys.' }),
    { status: 502, headers: { 'Content-Type': 'application/json' } }
  )
}