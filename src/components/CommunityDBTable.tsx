import { useState, useEffect, useCallback } from 'react' 
 
 type DBRow = { 
   id: string 
   email_masked: string 
   domain: string 
   first_name: string 
   last_name: string 
   company: string 
   role_title: string 
   role_category: string 
   verified_status: string 
   verified_by: string 
   verified_at: string 
   hit_count: number 
 } 
 
 type QueryResult = { 
   results: DBRow[] 
   page: number 
   hasMore: boolean 
   userCredits: number 
   userContributions: number 
 } 
 
 const ROLE_OPTIONS = ['', 'hr', 'engineering', 'founder', 'sales', 'marketing', 'finance', 'legal', 'other'] 
 
 export default function CommunityDBTable() { 
   const [query, setQuery] = useState('') 
   const [domain, setDomain] = useState('') 
   const [role, setRole] = useState('') 
   const [page, setPage] = useState(1) 
   const [data, setData] = useState<QueryResult | null>(null) 
   const [loading, setLoading] = useState(false) 
   const [revealed, setRevealed] = useState<Record<string, string>>({}) 
   const [revealing, setRevealing] = useState<string | null>(null) 
 
   const fetchData = useCallback(async (p = 1) => { 
     setLoading(true) 
     const params = new URLSearchParams({ 
       q: query, 
       domain, 
       role, 
       page: String(p), 
     }) 
     const res = await fetch(`/api/community/query?${params}`) 
     const json = await res.json() as QueryResult 
     setData(json) 
     setPage(p) 
     setLoading(false) 
   }, [query, domain, role]) 
 
   useEffect(() => { fetchData(1) }, [fetchData]) 
 
   const handleReveal = async (id: string) => { 
     setRevealing(id) 
     const res = await fetch('/api/community/reveal', { 
       method: 'POST', 
       headers: { 'Content-Type': 'application/json' }, 
       body: JSON.stringify({ id }), 
     }) 
     if (res.ok) { 
       const d = await res.json() as { email: string } 
       setRevealed(r => ({ ...r, [id]: d.email })) 
       if (data) { 
         setData({ ...data, userCredits: data.userCredits - 1 }) 
       } 
     } else { 
       const err = await res.json() as { error: string } 
       alert(err.error) 
     } 
     setRevealing(null) 
   } 
 
   const inputCls = 'bg-[#0a0a0a] border border-[#2a2a2a] text-[#f0f0f0] text-xs font-mono px-3 py-2 outline-none focus:border-[#888888] placeholder:text-[#444444]' 
 
   return ( 
     <div className="space-y-4"> 
 
       {/* Credit bar */} 
       {data && ( 
         <div className="flex items-center gap-6 border border-[#2a2a2a] bg-[#111111] px-4 py-3"> 
           <div> 
             <p className="text-[10px] font-mono text-[#888888]">YOUR CREDITS</p> 
             <p className="text-lg font-mono text-[#a855f7]">{data.userCredits}</p> 
           </div> 
           <div> 
             <p className="text-[10px] font-mono text-[#888888]">CONTRIBUTIONS</p> 
             <p className="text-lg font-mono text-[#f0f0f0]">{data.userContributions}</p> 
           </div> 
           <p className="text-xs text-[#888888] ml-auto"> 
             Contribute verified emails in <a href="/verify" className="text-[#a855f7] underline">/verify</a> to earn credits. 
             Spend 1 credit to reveal a full email address. 
           </p> 
         </div> 
       )} 
 
       {/* Filters */} 
       <div className="flex gap-2"> 
         <input 
           className={`${inputCls} flex-1`} 
           placeholder="Search company, domain, role…" 
           value={query} 
           onChange={e => setQuery(e.target.value)} 
           onKeyDown={e => e.key === 'Enter' && fetchData(1)} 
         /> 
         <input 
           className={`${inputCls} w-40`} 
           placeholder="domain.com" 
           value={domain} 
           onChange={e => setDomain(e.target.value)} 
         /> 
         <select 
           className={`${inputCls} w-36`} 
           value={role} 
           onChange={e => setRole(e.target.value)} 
         > 
           {ROLE_OPTIONS.map(r => ( 
             <option key={r} value={r}>{r || 'All roles'}</option> 
           ))} 
         </select> 
         <button 
           onClick={() => fetchData(1)} 
           className="px-4 py-2 text-xs font-mono border border-[#2a2a2a] text-[#f0f0f0] hover:bg-[#1a1a1a] transition-colors" 
         > 
           Search 
         </button> 
       </div> 
 
       {/* Table */} 
       {loading ? ( 
         <p className="text-[#888888] text-xs font-mono animate-pulse">Loading…</p> 
       ) : data && data.results.length > 0 ? ( 
         <> 
           <div className="border border-[#2a2a2a] divide-y divide-[#2a2a2a]"> 
             {/* Header */} 
             <div className="grid grid-cols-6 px-4 py-2 bg-[#0a0a0a] text-[10px] font-mono text-[#888888]"> 
               <span>EMAIL</span> 
               <span>COMPANY</span> 
               <span>ROLE</span> 
               <span>CATEGORY</span> 
               <span>VERIFIED</span> 
               <span>HITS</span> 
             </div> 
 
             {data.results.map(row => ( 
               <div key={row.id} className="grid grid-cols-6 px-4 py-3 bg-[#111111] text-xs items-center hover:bg-[#1a1a1a]"> 
                 <div> 
                   {revealed[row.id] ? ( 
                     <div> 
                       <p className="text-[#22c55e] font-mono">{revealed[row.id]}</p> 
                       <div className="flex gap-1 mt-1"> 
                         <button 
                           onClick={() => navigator.clipboard.writeText(revealed[row.id])} 
                           className="text-[10px] font-mono text-[#888888] hover:text-[#f0f0f0]" 
                         > 
                           copy 
                         </button> 
                         <span className="text-[#2a2a2a]">·</span> 
                         <a 
                           href={`/verify?email=${encodeURIComponent(revealed[row.id])}`} 
                           className="text-[10px] font-mono text-[#a855f7] hover:underline" 
                         > 
                           verify 
                         </a> 
                       </div> 
                     </div> 
                   ) : ( 
                     <div> 
                       <p className="text-[#888888] font-mono">{row.email_masked}</p> 
                       <button 
                         onClick={() => handleReveal(row.id)} 
                         disabled={revealing === row.id || (data?.userCredits ?? 0) < 1} 
                         className="text-[10px] font-mono text-[#a855f7] hover:underline disabled:opacity-30 mt-0.5" 
                       > 
                         {revealing === row.id ? 'revealing…' : 'reveal (1 credit)'} 
                       </button> 
                     </div> 
                   )} 
                 </div> 
                 <span className="text-[#f0f0f0]">{row.company ?? '—'}</span> 
                 <span className="text-[#888888]">{row.role_title ?? '—'}</span> 
                 <span className="text-[#888888] capitalize">{row.role_category ?? '—'}</span> 
                 <div> 
                   <p className={`font-mono ${row.verified_status === 'valid' ? 'text-[#22c55e]' : 'text-[#eab308]'}`}> 
                     {row.verified_status} 
                   </p> 
                   <p className="text-[#444444] text-[10px]">{row.verified_by}</p> 
                 </div> 
                 <span className="text-[#888888] font-mono">{row.hit_count}×</span> 
               </div> 
             ))} 
           </div> 
 
           {/* Pagination */} 
           <div className="flex gap-2"> 
             {page > 1 && ( 
               <button onClick={() => fetchData(page - 1)} className="text-xs font-mono text-[#888888] hover:text-[#f0f0f0]"> 
                 ← Previous 
               </button> 
             )} 
             <span className="text-xs font-mono text-[#888888]">Page {page}</span> 
             {data.hasMore && ( 
               <button onClick={() => fetchData(page + 1)} className="text-xs font-mono text-[#888888] hover:text-[#f0f0f0]"> 
                 Next → 
               </button> 
             )} 
           </div> 
         </> 
       ) : ( 
         <div className="border border-[#2a2a2a] bg-[#111111] p-8 text-center"> 
           <p className="text-[#888888] text-xs font-mono">No results yet.</p> 
           <p className="text-[#444444] text-xs font-mono mt-1"> 
             Be the first to contribute — verify an email at <a href="/verify" className="text-[#a855f7] underline">/verify</a>. 
           </p> 
         </div> 
       )} 
     </div> 
   ) 
 }