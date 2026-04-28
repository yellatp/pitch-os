import type { APIRoute } from 'astro' 
 import { dbRun, dbGet } from '@/lib/db' 
 
 export const POST: APIRoute = async ({ request, locals }) => { 
   const user = locals.user 
   if (!user) return new Response('Unauthorized', { status: 401 }) 
 
   const env = locals.env 
   const { campaignId, action } = await request.json() as { 
     campaignId: string 
     action: 'pause' | 'resume' | 'delete' 
   } 
 
   const campaign = await dbGet<{ id: string; status: string }>( 
     env.DB, 'SELECT id, status FROM campaigns WHERE id = ? AND user_id = ?', 
     [campaignId, user.id] 
   ) 
   if (!campaign) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 }) 
 
   if (action === 'delete') { 
     await dbRun(env.DB, 'DELETE FROM campaigns WHERE id = ? AND user_id = ?', [campaignId, user.id]) 
   } else { 
     const newStatus = action === 'pause' ? 'paused' : 'running' 
     await dbRun(env.DB, 'UPDATE campaigns SET status = ? WHERE id = ?', [newStatus, campaignId]) 
   } 
 
   return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } }) 
 }