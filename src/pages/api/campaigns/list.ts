import type { APIRoute } from 'astro' 
 import { dbAll } from '@/lib/db' 
 
 export const GET: APIRoute = async ({ locals }) => { 
   const user = locals.user 
   if (!user) return new Response('Unauthorized', { status: 401 }) 
 
   const env = locals.env 
   const campaigns = await dbAll( 
     env.DB, 
     `SELECT c.*, t.name as template_name, 
       ROUND(CAST(c.bounced_count AS FLOAT) / NULLIF(c.sent_count, 0) * 100, 1) as bounce_rate 
      FROM campaigns c 
      LEFT JOIN templates t ON c.template_id = t.id 
      WHERE c.user_id = ? 
      ORDER BY c.created_at DESC`, 
     [user.id] 
   ) 
 
   return new Response(JSON.stringify({ campaigns }), { 
     headers: { 'Content-Type': 'application/json' }, 
   }) 
 }