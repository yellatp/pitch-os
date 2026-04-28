import type { APIRoute } from 'astro'
import { dbAll, dbGet } from '@/lib/db'

export const GET: APIRoute = async ({ request, locals }) => {
  const user = locals.user
  if (!user) return new Response('Unauthorized', { status: 401 })

  const env = locals.env
  const url = new URL(request.url)
  const campaignId = url.searchParams.get('campaignId')
  if (!campaignId) return new Response(JSON.stringify({ error: 'campaignId required' }), { status: 400 })

  // Verify ownership
  const campaign = await dbGet(env.DB, 'SELECT id FROM campaigns WHERE id = ? AND user_id = ?', [campaignId, user.id])
  if (!campaign) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })

  const logs = await dbAll(
    env.DB,
    `SELECT id, recipient_email, recipient_name, recipient_company, status,
            rendered_subject, sent_via, sent_at, opened_at, replied_at, bounced
     FROM outreach_log WHERE campaign_id = ? ORDER BY sent_at DESC LIMIT 500`,
    [campaignId]
  )

  return new Response(JSON.stringify({ logs }), {
    headers: { 'Content-Type': 'application/json' },
  })
}