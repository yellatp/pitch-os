// src/pages/api/community/reveal.ts 
 import type { APIRoute } from 'astro' 
 import { dbGet, dbRun } from '@/lib/db' 
 
 export const POST: APIRoute = async ({ request, locals }) => { 
   const user = locals.user 
   if (!user) return new Response('Unauthorized', { status: 401 }) 
 
   const env = locals.env 
   const { id } = await request.json() as { id: string } 
 
   // Check user has credits 
   const userRow = await dbGet<{ community_credits: number }>( 
     env.DB, 
     'SELECT community_credits FROM users WHERE id = ?', 
     [user.id] 
   ) 
 
   if (!userRow || userRow.community_credits < 1) { 
     return new Response( 
       JSON.stringify({ error: 'Insufficient credits. Contribute verified emails to earn credits.' }), 
       { status: 402, headers: { 'Content-Type': 'application/json' } } 
     ) 
   } 
 
   const record = await dbGet<{ email: string; company: string; role_title: string }>( 
     env.DB, 
     'SELECT email, company, role_title FROM community_emails WHERE id = ? AND is_active = 1', 
     [id] 
   ) 
 
   if (!record) { 
     return new Response(JSON.stringify({ error: 'Record not found' }), { 
       status: 404, 
       headers: { 'Content-Type': 'application/json' }, 
     }) 
   } 
 
   // Deduct 1 credit 
   await dbRun( 
     env.DB, 
     'UPDATE users SET community_credits = community_credits - 1 WHERE id = ?', 
     [user.id] 
   ) 
 
   return new Response( 
     JSON.stringify({ ok: true, email: record.email, company: record.company, roleTitle: record.role_title }), 
     { headers: { 'Content-Type': 'application/json' } } 
   ) 
 }