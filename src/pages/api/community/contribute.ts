// src/pages/api/community/contribute.ts 
 import type { APIRoute } from 'astro' 
 import { dbRun, dbGet, sha256 } from '@/lib/db' 
 import { nanoid } from 'nanoid' 
 
 export const POST: APIRoute = async ({ request, locals }) => { 
   const user = locals.user 
   if (!user) return new Response('Unauthorized', { status: 401 }) 
 
   const env = locals.env 
 
   const body = await request.json() as { 
     email: string 
     firstName?: string 
     lastName?: string 
     company?: string 
     roleTitle?: string 
     roleCategory?: string 
     linkedinUrl?: string 
     verifiedStatus: 'valid' | 'catch-all' 
     verifiedBy: string 
     verifiedAt: string 
   } 
 
   if (!body.email || !body.verifiedStatus || !body.verifiedBy) { 
     return new Response(JSON.stringify({ error: 'email, verifiedStatus, verifiedBy required' }), { 
       status: 400, 
       headers: { 'Content-Type': 'application/json' }, 
     }) 
   } 
 
   const emailHash = await sha256(body.email) 
   const domain = body.email.split('@')[1] ?? '' 
 
   // Upsert — if email already in DB, increment hit_count and update last_seen 
   const existing = await dbGet<{ id: string }>( 
     env.DB, 
     'SELECT id FROM community_emails WHERE email_hash = ?', 
     [emailHash] 
   ) 
 
   if (existing) { 
     await dbRun( 
       env.DB, 
       `UPDATE community_emails 
        SET hit_count = hit_count + 1, last_seen = datetime('now') 
        WHERE id = ?`, 
       [existing.id] 
     ) 
     // Still award credit to the contributor (they confirmed it's still valid) 
     await dbRun( 
       env.DB, 
       'UPDATE users SET community_credits = community_credits + 1, contribution_count = contribution_count + 1 WHERE id = ?', 
       [user.id] 
     ) 
     return new Response(JSON.stringify({ ok: true, action: 'updated', id: existing.id }), { 
       headers: { 'Content-Type': 'application/json' }, 
     }) 
   } 
 
   // Insert new record 
   const id = nanoid() 
   await dbRun( 
     env.DB, 
     `INSERT INTO community_emails 
      (id, email, email_hash, domain, first_name, last_name, company, role_title, 
       role_category, linkedin_url, verified_status, verified_by, verified_at, contributed_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
     [ 
       id, 
       body.email, 
       emailHash, 
       domain, 
       body.firstName ?? null, 
       body.lastName ?? null, 
       body.company ?? null, 
       body.roleTitle ?? null, 
       body.roleCategory ?? 'other', 
       body.linkedinUrl ?? null, 
       body.verifiedStatus, 
       body.verifiedBy, 
       body.verifiedAt, 
       user.id, 
     ] 
   ) 
 
   // Award 1 credit to contributor 
   await dbRun( 
     env.DB, 
     'UPDATE users SET community_credits = community_credits + 1, contribution_count = contribution_count + 1 WHERE id = ?', 
     [user.id] 
   ) 
 
   return new Response(JSON.stringify({ ok: true, action: 'inserted', id }), { 
     headers: { 'Content-Type': 'application/json' }, 
   }) 
 }