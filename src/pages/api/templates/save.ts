import type { APIRoute } from 'astro' 
 import { dbRun, dbGet } from '@/lib/db' 
 import { validateSpintax } from '@/lib/spintax' 
 import { nanoid } from 'nanoid' 
 
 export const POST: APIRoute = async ({ request, locals }) => { 
   const user = locals.user 
   if (!user) return new Response('Unauthorized', { status: 401 }) 
 
   const env = locals.env 
   const body = await request.json() as { 
     id?: string 
     name: string 
     category: string 
     subjectSpintax: string 
     bodySpintax: string 
     aiPsEnabled?: boolean 
   } 
 
   const subjectValidation = validateSpintax(body.subjectSpintax) 
   const bodyValidation = validateSpintax(body.bodySpintax) 
 
   if (!subjectValidation.valid) { 
     return new Response(JSON.stringify({ error: `Subject: ${subjectValidation.error}` }), { status: 400 }) 
   } 
   if (!bodyValidation.valid) { 
     return new Response(JSON.stringify({ error: `Body: ${bodyValidation.error}` }), { status: 400 }) 
   } 
 
   if (body.id) { 
     // Update existing 
     const existing = await dbGet(env.DB, 'SELECT id FROM templates WHERE id = ? AND user_id = ?', [body.id, user.id]) 
     if (!existing) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 }) 
 
     await dbRun(env.DB, 
       `UPDATE templates SET name=?, category=?, subject_spintax=?, body_spintax=?, ai_ps_enabled=?, updated_at=datetime('now') 
        WHERE id = ? AND user_id = ?`, 
       [body.name, body.category, body.subjectSpintax, body.bodySpintax, body.aiPsEnabled ? 1 : 0, body.id, user.id] 
     ) 
     return new Response(JSON.stringify({ ok: true, id: body.id, action: 'updated' }), { 
       headers: { 'Content-Type': 'application/json' }, 
     }) 
   } 
 
   // Create new 
   const id = nanoid() 
   await dbRun(env.DB, 
     `INSERT INTO templates (id, user_id, name, category, subject_spintax, body_spintax, ai_ps_enabled) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`, 
     [id, user.id, body.name, body.category, body.subjectSpintax, body.bodySpintax, body.aiPsEnabled ? 1 : 0] 
   ) 
 
   return new Response(JSON.stringify({ ok: true, id, action: 'created' }), { 
     headers: { 'Content-Type': 'application/json' }, 
   }) 
 } 
 
 export const DELETE: APIRoute = async ({ request, locals }) => { 
   const user = locals.user 
   if (!user) return new Response('Unauthorized', { status: 401 }) 
 
   const env = locals.env 
   const { id } = await request.json() as { id: string } 
 
   await dbRun(env.DB, 'DELETE FROM templates WHERE id = ? AND user_id = ?', [id, user.id]) 
   return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } }) 
 }