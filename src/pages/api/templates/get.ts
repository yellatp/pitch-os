import type { APIRoute } from 'astro' 
 import { dbGet } from '@/lib/db' 
 
 export const GET: APIRoute = async ({ request, locals }) => { 
   const user = locals.user 
   if (!user) return new Response('Unauthorized', { status: 401 }) 
 
   const env = locals.env 
   const url = new URL(request.url) 
   const id = url.searchParams.get('id') 
   if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 }) 
 
   const template = await dbGet( 
     env.DB, 
     'SELECT * FROM templates WHERE id = ? AND user_id = ?', 
     [id, user.id] 
   ) 
 
   if (!template) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 }) 
 
   return new Response(JSON.stringify({ template }), { 
     headers: { 'Content-Type': 'application/json' }, 
   }) 
 }