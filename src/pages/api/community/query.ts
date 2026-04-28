// src/pages/api/community/query.ts 
 import type { APIRoute } from 'astro' 
 import { dbAll, dbGet } from '@/lib/db' 
 
 export const GET: APIRoute = async ({ request, locals }) => { 
   const user = locals.user 
   if (!user) return new Response('Unauthorized', { status: 401 }) 
 
   const env = locals.env 
   const url = new URL(request.url) 
 
   const q        = url.searchParams.get('q') ?? '' 
   const domain   = url.searchParams.get('domain') ?? '' 
   const role     = url.searchParams.get('role') ?? '' 
   const page     = Math.max(1, parseInt(url.searchParams.get('page') ?? '1')) 
   const limit    = 20 
   const offset   = (page - 1) * limit 
 
   let query = ` 
     SELECT id, domain, first_name, last_name, company, role_title, role_category, 
            verified_status, verified_by, verified_at, hit_count, last_seen, 
            -- Mask email: j***@company.com 
            substr(email, 1, 1) || '***@' || domain AS email_masked 
     FROM community_emails 
     WHERE is_active = 1 
   ` 
   const params: string[] = [] 
 
   if (q) { 
     query += ` AND (company LIKE ? OR role_title LIKE ? OR domain LIKE ?)` 
     params.push(`%${q}%`, `%${q}%`, `%${q}%`) 
   } 
   if (domain) { 
     query += ` AND domain = ?` 
     params.push(domain) 
   } 
   if (role) { 
     query += ` AND role_category = ?` 
     params.push(role) 
   } 
 
   query += ` ORDER BY hit_count DESC, verified_at DESC LIMIT ? OFFSET ?` 
   params.push(String(limit), String(offset)) 
 
   const rows = await dbAll(env.DB, query, params) 
 
   // Get user's credit balance 
   const userRow = await dbGet<{ community_credits: number; contribution_count: number }>( 
     env.DB, 
     'SELECT community_credits, contribution_count FROM users WHERE id = ?', 
     [user.id] 
   ) 
 
   return new Response( 
     JSON.stringify({ 
       results: rows, 
       page, 
       hasMore: rows.length === limit, 
       userCredits: userRow?.community_credits ?? 0, 
       userContributions: userRow?.contribution_count ?? 0, 
     }), 
     { headers: { 'Content-Type': 'application/json' } } 
   ) 
 }