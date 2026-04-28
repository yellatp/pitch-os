import type { APIRoute } from 'astro' 
 import { dbGet, dbRun } from '@/lib/db' 
 import { STARTER_TEMPLATES } from '@/lib/starterTemplates' 
 import { nanoid } from 'nanoid' 
 
 export const POST: APIRoute = async ({ locals }) => { 
   const user = locals.user 
   if (!user) return new Response('Unauthorized', { status: 401 }) 
 
   const env = locals.env 
 
   // Check if user already has templates 
   const existing = await dbGet<{ count: number }>( 
     env.DB, 
     'SELECT COUNT(*) as count FROM templates WHERE user_id = ?', 
     [user.id] 
   ) 
 
   if (existing && existing.count > 0) { 
     return new Response(JSON.stringify({ ok: true, seeded: false, reason: 'already_has_templates' }), { 
       headers: { 'Content-Type': 'application/json' }, 
     }) 
   } 
 
   // Insert all starter templates 
   for (const t of STARTER_TEMPLATES) { 
     await dbRun(env.DB, 
       `INSERT INTO templates (id, user_id, name, category, subject_spintax, body_spintax, ai_ps_enabled) 
        VALUES (?, ?, ?, ?, ?, ?, 0)`, 
       [nanoid(), user.id, t.name, t.category, t.subject, t.body] 
     ) 
   } 
 
   return new Response(JSON.stringify({ ok: true, seeded: true, count: STARTER_TEMPLATES.length }), { 
     headers: { 'Content-Type': 'application/json' }, 
   }) 
 }