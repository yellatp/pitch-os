import type { APIRoute } from 'astro' 
 import { dbAll } from '@/lib/db' 
 
 export const GET: APIRoute = async ({ locals, request }) => { 
   const user = locals.user 
   if (!user) return new Response('Unauthorized', { status: 401 }) 
 
   const env = locals.env 
   const url = new URL(request.url) 
   const category = url.searchParams.get('category') ?? '' 
 
   let query = `SELECT id, name, category, subject_spintax, ai_ps_enabled, created_at, updated_at 
                FROM templates WHERE user_id = ?` 
   const params: string[] = [user.id] 
 
   if (category) { 
     query += ' AND category = ?' 
     params.push(category) 
   } 
 
   query += ' ORDER BY updated_at DESC' 
 
   const templates = await dbAll(env.DB, query, params) 
   return new Response(JSON.stringify({ templates }), { 
     headers: { 'Content-Type': 'application/json' }, 
   }) 
 }