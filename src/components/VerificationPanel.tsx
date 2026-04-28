import { useState, useEffect } from 'react' 
  
 
 type VerifyResult = { 
   email: string 
   status: 'valid' | 'invalid' | 'catch-all' | 'unknown' | 'spamtrap' | 'abuse' 
   subStatus: string 
   score: number 
   safe_to_send: boolean 
   verifiedBy: string 
   verifiedAt: string 
   freeEmail: boolean 
   mxFound: boolean 
   fromCache?: boolean 
 } 
 
 type ContributeForm = { 
   firstName: string 
   lastName: string 
   company: string 
   roleTitle: string 
   roleCategory: string 
 } 
 
 const ROLE_CATEGORIES = [ 
   'hr', 'engineering', 'founder', 'sales', 'marketing', 'finance', 'legal', 'other', 
 ] 
 
 const STATUS_DESCRIPTIONS: Record<string, string> = { 
   valid:    'Email address exists and can receive mail. Safe to send.', 
   invalid:  'Email address does not exist or cannot receive mail. Do not send.', 
   'catch-all': 'Domain accepts all emails. Existence of this address is unconfirmed. Send at your own risk.', 
   unknown:  'Could not determine status. Check your verifier API key.', 
   spamtrap: 'This address is a spam trap. Sending will severely harm your reputation. Do not send.', 
   abuse:    'This address is associated with abuse reports. Do not send.', 
 } 
 
 export default function VerificationPanel() { 
   const [email, setEmail] = useState('') 
   const [result, setResult] = useState<VerifyResult | null>(null) 
   const [loading, setLoading] = useState(false) 
   const [contributed, setContributed] = useState(false) 
   const [showContribute, setShowContribute] = useState(false) 
   const [contributeForm, setContributeForm] = useState<ContributeForm>({ 
     firstName: '', lastName: '', company: '', roleTitle: '', roleCategory: 'other', 
   }) 
   const [contributing, setContributing] = useState(false) 
 
   // Pre-fill email from URL param (?email=...) 
   useEffect(() => { 
     const params = new URLSearchParams(window.location.search) 
     const e = params.get('email') 
     if (e) setEmail(e) 
   }, []) 
 
   const handleVerify = async () => { 
     if (!email.trim() || !email.includes('@')) return 
     setLoading(true) 
     setResult(null) 
     setContributed(false) 
     setShowContribute(false) 
 
     const res = await fetch('/api/verify/check', { 
       method: 'POST', 
       headers: { 'Content-Type': 'application/json' }, 
       body: JSON.stringify({ email: email.trim().toLowerCase() }), 
     }) 
     const data = await res.json() as VerifyResult 
     setResult(data) 
     setLoading(false) 
 
     // Show contribution prompt for valid/catch-all results not from cache 
     if ((data.status === 'valid' || data.status === 'catch-all') && !data.fromCache) { 
       setTimeout(() => setShowContribute(true), 500) 
     } 
   } 
 
   const handleContribute = async () => { 
     if (!result) return 
     setContributing(true) 
     await fetch('/api/community/contribute', { 
       method: 'POST', 
       headers: { 'Content-Type': 'application/json' }, 
       body: JSON.stringify({ 
         email: result.email, 
         firstName: contributeForm.firstName || undefined, 
         lastName: contributeForm.lastName || undefined, 
         company: contributeForm.company || undefined, 
         roleTitle: contributeForm.roleTitle || undefined, 
         roleCategory: contributeForm.roleCategory, 
         verifiedStatus: result.status === 'valid' ? 'valid' : 'catch-all', 
         verifiedBy: result.verifiedBy, 
         verifiedAt: result.verifiedAt, 
       }), 
     }) 
     setContributed(true) 
     setShowContribute(false) 
     setContributing(false) 
   } 
 
   const statusColors: Record<string, string> = { 
     valid:    '#22c55e', 
     invalid:  '#ef4444', 
     'catch-all': '#eab308', 
     unknown:  '#888888', 
     spamtrap: '#ef4444', 
     abuse:    '#ef4444', 
   } 
 
   const inputCls = 'bg-[#0a0a0a] border border-[#2a2a2a] text-[#f0f0f0] text-xs font-mono px-3 py-2 outline-none focus:border-[#888888] placeholder:text-[#444444] w-full' 
 
   return ( 
     <div className="max-w-2xl space-y-6"> 
 
       {/* Email input */} 
       <div> 
         <label className="text-[10px] font-mono text-[#888888] block mb-1">EMAIL ADDRESS</label> 
         <div className="flex gap-2"> 
           <input 
             type="email" 
             className={inputCls} 
             placeholder="jane@stripe.com" 
             value={email} 
             onChange={e => setEmail(e.target.value)} 
             onKeyDown={e => e.key === 'Enter' && handleVerify()} 
           /> 
           <button 
             onClick={handleVerify} 
             disabled={loading || !email.includes('@')} 
             className="px-4 py-2 text-xs font-mono border border-[#2a2a2a] text-[#f0f0f0] hover:bg-[#1a1a1a] disabled:opacity-30 transition-colors whitespace-nowrap" 
           > 
             {loading ? 'Verifying…' : '✓ Verify'} 
           </button> 
         </div> 
         <p className="text-[#444444] text-xs font-mono mt-1"> 
           Requires at least one verifier key in <a href="/keys" className="text-[#a855f7] underline">/keys</a>. 
           Community DB is checked first (free, no API cost). 
         </p> 
       </div> 
 
       {/* Result */} 
       {result && ( 
         <div 
           className="border p-5 space-y-4" 
           style={{ borderColor: statusColors[result.status] + '44' }} 
         > 
           {/* Status header */} 
           <div className="flex items-start justify-between"> 
             <div> 
               <p className="font-mono text-sm" style={{ color: statusColors[result.status] }}> 
                 {result.status.toUpperCase()} 
               </p> 
               <p className="text-[#888888] text-xs mt-0.5">{result.email}</p> 
             </div> 
             <div className="text-right"> 
               <p className="font-mono text-lg" style={{ color: statusColors[result.status] }}> 
                 {result.score}/10 
               </p> 
               <p className="text-[#444444] text-xs">score</p> 
             </div> 
           </div> 
 
           {/* Description */} 
           <p className="text-[#888888] text-xs border-l-2 pl-3" style={{ borderColor: statusColors[result.status] }}> 
             {STATUS_DESCRIPTIONS[result.status]} 
           </p> 
 
           {/* Metadata grid */} 
           <div className="grid grid-cols-2 gap-2 text-xs font-mono"> 
             {[ 
               ['Verified by', result.verifiedBy], 
               ['Sub-status', result.subStatus || '—'], 
               ['Free email', result.freeEmail ? 'Yes' : 'No'], 
               ['MX record', result.mxFound ? 'Found' : 'Not found'], 
               ['From cache', result.fromCache ? 'Yes (community DB)' : 'No (live check)'], 
               ['Checked at', new Date(result.verifiedAt).toLocaleString()], 
             ].map(([label, value]) => ( 
               <div key={label} className="bg-[#0a0a0a] p-2"> 
                 <p className="text-[#444444] text-[10px]">{label}</p> 
                 <p className="text-[#f0f0f0] mt-0.5">{value}</p> 
               </div> 
             ))} 
           </div> 
 
           {/* Safe to send banner */} 
           <div 
             className="flex items-center gap-2 p-3 border text-xs font-mono" 
             style={{ 
               borderColor: result.safe_to_send ? '#22c55e44' : '#ef444444', 
               background: result.safe_to_send ? '#22c55e0a' : '#ef44440a', 
             }} 
           > 
             <span style={{ color: result.safe_to_send ? '#22c55e' : '#ef4444' }}> 
               {result.safe_to_send ? '✓' : '✕'} 
             </span> 
             <span style={{ color: result.safe_to_send ? '#22c55e' : '#ef4444' }}> 
               {result.safe_to_send 
                 ? 'Safe to send — this email can receive mail' 
                 : 'Not safe to send — do not add to campaigns'} 
             </span> 
           </div> 
 
           {/* Actions */} 
           {result.safe_to_send && ( 
             <div className="flex gap-2"> 
               <a 
                 href={`/compose?email=${encodeURIComponent(result.email)}`} 
                 className="text-xs font-mono border border-[#2a2a2a] px-3 py-1.5 text-[#f0f0f0] hover:bg-[#1a1a1a] transition-colors" 
               > 
                 ✎ Compose Email 
               </a> 
               <button 
                 onClick={() => navigator.clipboard.writeText(result.email)} 
                 className="text-xs font-mono border border-[#2a2a2a] px-3 py-1.5 text-[#888888] hover:text-[#f0f0f0] transition-colors" 
               > 
                 Copy 
               </button> 
             </div> 
           )} 
         </div> 
       )} 
 
       {/* Community contribution prompt */} 
       {showContribute && result && !contributed && ( 
         <div className="border border-[#a855f744] bg-[#a855f70a] p-5 space-y-4"> 
           <div> 
             <p className="text-[#a855f7] text-xs font-mono font-medium mb-1"> 
               ◎ Contribute to Community Database? 
             </p> 
             <p className="text-[#888888] text-xs"> 
               Adding this verified email helps other Pitch OS users find contacts faster.
               You earn <strong className="text-[#f0f0f0]">+1 community credit</strong> per contribution. 
               Credits let you reveal emails from the community database. 
             </p> 
           </div> 
 
           <div className="grid grid-cols-2 gap-2"> 
             {[ 
               { key: 'firstName', label: 'FIRST NAME', placeholder: 'Jane' }, 
               { key: 'lastName',  label: 'LAST NAME',  placeholder: 'Smith' }, 
               { key: 'company',   label: 'COMPANY',    placeholder: 'Stripe' }, 
               { key: 'roleTitle', label: 'ROLE TITLE', placeholder: 'HR Manager' }, 
             ].map(f => ( 
               <div key={f.key}> 
                 <label className="text-[10px] font-mono text-[#888888] block mb-1">{f.label} (optional)</label> 
                 <input 
                   className={inputCls} 
                   placeholder={f.placeholder} 
                   value={contributeForm[f.key as keyof ContributeForm]} 
                   onChange={e => setContributeForm(p => ({ ...p, [f.key]: e.target.value }))} 
                 /> 
               </div> 
             ))} 
           </div> 
 
           <div> 
             <label className="text-[10px] font-mono text-[#888888] block mb-1">ROLE CATEGORY</label> 
             <select 
               className={inputCls} 
               value={contributeForm.roleCategory} 
               onChange={e => setContributeForm(p => ({ ...p, roleCategory: e.target.value }))} 
             > 
               {ROLE_CATEGORIES.map(c => ( 
                 <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option> 
               ))} 
             </select> 
           </div> 
 
           <div className="flex gap-2"> 
             <button 
               onClick={handleContribute} 
               disabled={contributing} 
               className="px-4 py-2 text-xs font-mono border border-[#a855f7] text-[#a855f7] hover:bg-[#a855f7] hover:text-white disabled:opacity-30 transition-colors" 
             > 
               {contributing ? 'Contributing…' : '◎ Contribute +1 credit'} 
             </button> 
             <button 
               onClick={() => setShowContribute(false)} 
               className="px-4 py-2 text-xs font-mono border border-[#2a2a2a] text-[#888888] hover:text-[#f0f0f0] transition-colors" 
             > 
               Skip 
             </button> 
           </div> 
         </div> 
       )} 
 
       {/* Contribution success */} 
       {contributed && ( 
         <div className="border border-[#22c55e44] bg-[#22c55e0a] p-3"> 
           <p className="text-[#22c55e] text-xs font-mono"> 
             ✓ Contributed to community database. +1 credit added to your account. 
           </p> 
         </div> 
       )} 
     </div> 
   ) 
 }