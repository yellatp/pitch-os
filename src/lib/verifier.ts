// src/lib/verifier.ts 
 import { decryptKey } from '@/lib/encryption' 
 
 export interface VerifyResult { 
   email: string 
   status: 'valid' | 'invalid' | 'catch-all' | 'unknown' | 'spamtrap' | 'abuse' 
   subStatus: string 
   score: number          // 0–10 
   safe_to_send: boolean 
   verifiedBy: string 
   verifiedAt: string 
   freeEmail: boolean 
   mxFound: boolean 
 } 
 
 // ─── ZeroBounce ─────────────────────────────────────────────────────────────── 
 async function verifyZeroBounce(email: string, apiKey: string): Promise<VerifyResult | null> { 
   const res = await fetch( 
     `https://api.zerobounce.net/v2/validate?api_key=${apiKey}&email=${encodeURIComponent(email)}` 
   ) 
   if (!res.ok) return null 
   const d = await res.json() as { 
     status: string 
     sub_status: string 
     free_email: boolean 
     mx_found: string 
     error?: string 
   } 
   if (d.error) return null 
 
   const statusMap: Record<string, VerifyResult['status']> = { 
     valid:    'valid', 
     invalid:  'invalid', 
     'catch-all': 'catch-all', 
     unknown:  'unknown', 
     spamtrap: 'spamtrap', 
     abuse:    'abuse', 
     do_not_mail: 'invalid', 
   } 
 
   const status = statusMap[d.status] ?? 'unknown' 
   const score = status === 'valid' ? 9 : status === 'catch-all' ? 5 : 1 
 
   return { 
     email, 
     status, 
     subStatus: d.sub_status ?? '', 
     score, 
     safe_to_send: status === 'valid', 
     verifiedBy: 'zerobounce', 
     verifiedAt: new Date().toISOString(), 
     freeEmail: d.free_email, 
     mxFound: d.mx_found === 'true', 
   } 
 } 
 
 // ─── NeverBounce ────────────────────────────────────────────────────────────── 
 async function verifyNeverBounce(email: string, apiKey: string): Promise<VerifyResult | null> { 
   const res = await fetch( 
     `https://api.neverbounce.com/v4/single/check?key=${apiKey}&email=${encodeURIComponent(email)}` 
   ) 
   if (!res.ok) return null 
   const d = await res.json() as { 
     result: string 
     flags?: string[] 
     status: string 
   } 
   if (d.status !== 'success') return null 
 
   const statusMap: Record<string, VerifyResult['status']> = { 
     valid:       'valid', 
     invalid:     'invalid', 
     catchall:    'catch-all', 
     unknown:     'unknown', 
     disposable:  'invalid', 
   } 
   const status = statusMap[d.result] ?? 'unknown' 
 
   return { 
     email, 
     status, 
     subStatus: d.flags?.join(',') ?? '', 
     score: status === 'valid' ? 8 : status === 'catch-all' ? 5 : 1, 
     safe_to_send: status === 'valid', 
     verifiedBy: 'neverbounce', 
     verifiedAt: new Date().toISOString(), 
     freeEmail: d.flags?.includes('free_email_host') ?? false, 
     mxFound: !d.flags?.includes('no_mx_record'), 
   } 
 } 
 
 // ─── MillionVerifier ────────────────────────────────────────────────────────── 
 async function verifyMillionVerifier(email: string, apiKey: string): Promise<VerifyResult | null> { 
   const res = await fetch( 
     `https://api.millionverifier.com/api/v3/?api=${apiKey}&email=${encodeURIComponent(email)}&timeout=10` 
   ) 
   if (!res.ok) return null 
   const d = await res.json() as { result: string; subresult: string; free: number; role: number } 
 
   const statusMap: Record<string, VerifyResult['status']> = { 
     ok:          'valid', 
     error:       'invalid', 
     unknown:     'unknown', 
     catchall:    'catch-all', 
   } 
   const status = statusMap[d.result] ?? 'unknown' 
 
   return { 
     email, 
     status, 
     subStatus: d.subresult ?? '', 
     score: status === 'valid' ? 8 : status === 'catch-all' ? 4 : 1, 
     safe_to_send: status === 'valid', 
     verifiedBy: 'millionverifier', 
     verifiedAt: new Date().toISOString(), 
     freeEmail: d.free === 1, 
     mxFound: true, 
   } 
 } 
 
 // ─── DeBounce ───────────────────────────────────────────────────────────────── 
 async function verifyDeBounce(email: string, apiKey: string): Promise<VerifyResult | null> { 
   const res = await fetch( 
     `https://api.debounce.io/v1/?api=${apiKey}&email=${encodeURIComponent(email)}` 
   ) 
   if (!res.ok) return null 
   const d = await res.json() as { 
     debounce?: { 
       result: string 
       reason: string 
       send_transactional: string 
       free_email: string 
       mx_found: string 
     } 
   } 
   if (!d.debounce) return null 
 
   const result = d.debounce.result 
   const statusMap: Record<string, VerifyResult['status']> = { 
     'Safe to Send':   'valid', 
     'Risky':          'catch-all', 
     'Invalid':        'invalid', 
     'Unknown':        'unknown', 
   } 
   const status = statusMap[result] ?? 'unknown' 
 
   return { 
     email, 
     status, 
     subStatus: d.debounce.reason ?? '', 
     score: d.debounce.send_transactional === '1' ? 9 : status === 'catch-all' ? 4 : 1, 
     safe_to_send: d.debounce.send_transactional === '1', 
     verifiedBy: 'debounce', 
     verifiedAt: new Date().toISOString(), 
     freeEmail: d.debounce.free_email === '1', 
     mxFound: d.debounce.mx_found === '1', 
   } 
 } 
 
 // ─── Waterfall verifier ─────────────────────────────────────────────────────── 
 
 const VERIFIERS: { service: string; fn: (e: string, k: string) => Promise<VerifyResult | null> }[] = [ 
   { service: 'zerobounce',      fn: verifyZeroBounce }, 
   { service: 'neverbounce',     fn: verifyNeverBounce }, 
   { service: 'millionverifier', fn: verifyMillionVerifier }, 
   { service: 'debounce',        fn: verifyDeBounce }, 
 ] 
 
 export async function waterfallVerify( 
   email: string, 
   kv: KVNamespace, 
   authSecret: string, 
   userId: string 
 ): Promise<VerifyResult> { 
   for (const v of VERIFIERS) { 
     const encrypted = await kv.get(`keys:${userId}:${v.service}`) 
     if (!encrypted) continue 
 
     let apiKey: string 
     try { 
       apiKey = await decryptKey(encrypted, authSecret, userId) 
     } catch { continue } 
 
     try { 
       const result = await v.fn(email, apiKey) 
       if (result) return result 
     } catch { continue } 
   } 
 
   // No verifier available 
   return { 
     email, 
     status: 'unknown', 
     subStatus: 'no_verifier_configured', 
     score: 0, 
     safe_to_send: false, 
     verifiedBy: 'none', 
     verifiedAt: new Date().toISOString(), 
     freeEmail: false, 
     mxFound: false, 
   } 
 }