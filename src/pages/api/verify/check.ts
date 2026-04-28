// src/pages/api/verify/check.ts 
 import type { APIRoute } from 'astro' 
 import { waterfallVerify } from '@/lib/verifier' 
 import { dbGet } from '@/lib/db' 
 import { sha256 } from '@/lib/db' 
 
 export const POST: APIRoute = async ({ request, locals }) => { 
   const user = locals.user 
   if (!user) return new Response('Unauthorized', { status: 401 }) 
 
   const env = locals.env 
   const { email } = await request.json() as { email: string } 
 
   if (!email || !email.includes('@')) { 
     return new Response(JSON.stringify({ error: 'Valid email required' }), { 
       status: 400, 
       headers: { 'Content-Type': 'application/json' }, 
     }) 
   } 
 
   // Check community DB first — skip API call if already verified recently 
   const emailHash = await sha256(email) 
   const cached = await dbGet<{ 
     verified_status: string 
     verified_by: string 
     verified_at: string 
     company: string 
     role_title: string 
   }>( 
     env.DB, 
     `SELECT verified_status, verified_by, verified_at, company, role_title 
      FROM community_emails 
      WHERE email_hash = ? AND is_active = 1 
      AND datetime(verified_at) > datetime('now', '-7 days')`, 
     [emailHash] 
   ) 
 
   if (cached) { 
     return new Response( 
       JSON.stringify({ 
         email, 
         status: cached.verified_status, 
         subStatus: 'cached_from_community_db', 
         score: cached.verified_status === 'valid' ? 9 : 5, 
         safe_to_send: cached.verified_status === 'valid', 
         verifiedBy: cached.verified_by, 
         verifiedAt: cached.verified_at, 
         freeEmail: false, 
         mxFound: true, 
         fromCache: true, 
         company: cached.company, 
         roleTitle: cached.role_title, 
       }), 
       { headers: { 'Content-Type': 'application/json' } } 
     ) 
   } 
 
   // Run live verification 
   const result = await waterfallVerify(email, env.KEYS_KV, env.AUTH_SECRET, user.id) 
 
   return new Response(JSON.stringify({ ...result, fromCache: false }), { 
     headers: { 'Content-Type': 'application/json' }, 
   }) 
 }