import type { APIRoute } from 'astro' 
 import { dbRun, dbGet } from '@/lib/db' 
 import { nanoid } from 'nanoid' 
 
 export const POST: APIRoute = async ({ request, locals }) => { 
   const user = locals.user 
   if (!user) return new Response('Unauthorized', { status: 401 }) 
 
   const env = locals.env 
   const body = await request.json() as { 
     name: string 
     templateId: string 
     fromEmail: string 
     fromName: string 
     recipients: Array<{ 
       email: string 
       name?: string 
       company?: string 
       role?: string 
       variables?: Record<string, string> 
     }> 
   } 
 
   if (!body.name || !body.templateId || !body.fromEmail || !body.recipients?.length) { 
     return new Response(JSON.stringify({ error: 'name, templateId, fromEmail, recipients required' }), { status: 400 }) 
   } 
 
   // Verify template exists and belongs to user 
   const template = await dbGet<{ id: string }>( 
     env.DB, 
     'SELECT id FROM templates WHERE id = ? AND user_id = ?', 
     [body.templateId, user.id] 
   ) 
   if (!template) { 
     return new Response(JSON.stringify({ error: 'Template not found' }), { status: 404 }) 
   } 
 
   const campaignId = nanoid() 
 
   // Create campaign 
   await dbRun(env.DB, 
     `INSERT INTO campaigns (id, user_id, name, template_id, from_email, from_name, target_count) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`, 
     [campaignId, user.id, body.name, body.templateId, body.fromEmail, body.fromName, body.recipients.length] 
   ) 
 
   // Queue recipients in outreach_log 
   for (const r of body.recipients) { 
     await dbRun(env.DB, 
       `INSERT INTO outreach_log (id, campaign_id, user_id, recipient_email, recipient_name, recipient_company, recipient_role, template_id, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'queued')`, 
       [nanoid(), campaignId, user.id, r.email, r.name ?? null, r.company ?? null, r.role ?? null, body.templateId] 
     ) 
   } 
 
   return new Response(JSON.stringify({ ok: true, campaignId }), { 
     headers: { 'Content-Type': 'application/json' }, 
   }) 
 }