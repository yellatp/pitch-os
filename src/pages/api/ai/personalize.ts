import type { APIRoute } from 'astro' 
 import { decryptKey } from '@/lib/encryption' 
 
 export const POST: APIRoute = async ({ request, locals }) => { 
   const user = locals.user 
   if (!user) return new Response('Unauthorized', { status: 401 }) 
 
   const env = locals.env 
 
   const body = await request.json() as { 
     recipientName: string 
     recipientRole?: string 
     company: string 
     linkedinHeadline?: string 
     recentPost?: string 
     templateCategory: string 
   } 
 
   // Get OpenAI key 
   const encrypted = await env.KEYS_KV.get(`keys:${user.id}:openai`) 
   if (!encrypted) { 
     return new Response( 
       JSON.stringify({ error: 'OpenAI API key not configured. Add it in /keys.' }), 
       { status: 400, headers: { 'Content-Type': 'application/json' } } 
     ) 
   } 
 
   const openaiKey = await decryptKey(encrypted, env.AUTH_SECRET, user.id) 
 
   const contextLines = [ 
     body.linkedinHeadline ? `LinkedIn: "${body.linkedinHeadline}"` : null, 
     body.recentPost ? `Recent post/activity: "${body.recentPost.slice(0, 200)}"` : null, 
   ].filter(Boolean).join('\n') 
 
   const categoryContext: Record<string, string> = { 
     job_search: 'a cold job application', 
     referral_request: 'a referral request', 
     mentorship_request: 'a mentorship request', 
     investor_pitch: 'a startup pitch', 
     partnership: 'a partnership proposal', 
     product_demo: 'a product demo request', 
     one_pager_share: 'sharing an executive one-pager', 
     recruiter_reach: 'outreach to a recruiter', 
     community_invite: 'a community invitation', 
     custom: 'a professional outreach email', 
   } 
 
   const purpose = categoryContext[body.templateCategory] ?? 'professional outreach' 
 
   const prompt = `You are writing the P.S. line at the end of ${purpose} email to ${body.recipientName}${body.recipientRole ? `, who is ${body.recipientRole}` : ''} at ${body.company}. 
 
 ${contextLines ? `Context about them:\n${contextLines}\n` : ''} 
 Write a single, natural-sounding P.S. line that: 
 - Is under 25 words 
 - Feels specific to THIS person (not generic) 
 - Sounds human and genuine, not salesy 
 - References something real about them or their work if context is available 
 - Does NOT start with "P.S." (that will be added automatically) 
 - Does NOT use exclamation marks 
 - Does NOT use phrases like "I'd love to" or "I'm passionate about" 
 
 Respond with ONLY the P.S. sentence. Nothing else.` 
 
   const res = await fetch('https://api.openai.com/v1/chat/completions', { 
     method: 'POST', 
     headers: { 
       'Content-Type': 'application/json', 
       Authorization: `Bearer ${openaiKey}`, 
     }, 
     body: JSON.stringify({ 
       model: 'gpt-4o-mini', 
       max_tokens: 80, 
       temperature: 0.85, 
       messages: [{ role: 'user', content: prompt }], 
     }), 
   }) 
 
   if (!res.ok) { 
     return new Response(JSON.stringify({ error: 'OpenAI API error' }), { 
       status: 502, 
       headers: { 'Content-Type': 'application/json' }, 
     }) 
   } 
 
   const data = await res.json() as { 
     choices: Array<{ message: { content: string } }> 
   } 
 
   const psLine = data.choices[0]?.message?.content?.trim() ?? '' 
 
   return new Response(JSON.stringify({ ps_line: psLine }), { 
     headers: { 'Content-Type': 'application/json' }, 
   }) 
 }