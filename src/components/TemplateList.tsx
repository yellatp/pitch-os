import { useState, useEffect } from 'react' 
 import TemplateEditor from '@/components/TemplateEditor' 
 
 type TemplateMeta = { 
   id: string 
   name: string 
   category: string 
   subject_spintax: string 
   ai_ps_enabled: number 
   updated_at: string 
 } 
 
 type FullTemplate = TemplateMeta & { 
   body_spintax: string 
 } 
 
 const CATEGORY_LABELS: Record<string, string> = { 
   job_search: 'Job Search', referral_request: 'Referral', mentorship_request: 'Mentorship', 
   investor_pitch: 'Investor Pitch', partnership: 'Partnership', product_demo: 'Product Demo', 
   one_pager_share: 'One-Pager', recruiter_reach: 'Recruiter', community_invite: 'Community', custom: 'Custom', 
 } 
 
 export default function TemplateList() { 
   const [templates, setTemplates] = useState<TemplateMeta[]>([]) 
   const [selectedCategory, setSelectedCategory] = useState('') 
   const [editingTemplate, setEditingTemplate] = useState<FullTemplate | null>(null) 
   const [creating, setCreating] = useState(false) 
   const [loading, setLoading] = useState(true) 
   const [seeded, setSeeded] = useState(false) 
 
   const fetchTemplates = async (cat = '') => { 
     setLoading(true) 
     const res = await fetch(`/api/templates/list?category=${cat}`) 
     const d = await res.json() as { templates: TemplateMeta[] } 
     setTemplates(d.templates) 
     setLoading(false) 
   } 
 
   const seedTemplates = async () => { 
     const res = await fetch('/api/templates/seed', { method: 'POST' }) 
     const d = await res.json() as { seeded: boolean } 
     if (d.seeded) await fetchTemplates() 
     setSeeded(true) 
   } 
 
   useEffect(() => { fetchTemplates() }, []) 
 
   const handleEdit = async (id: string) => { 
     const res = await fetch(`/api/templates/get?id=${id}`) 
     const d = await res.json() as { template: FullTemplate } 
     setEditingTemplate(d.template) 
     setCreating(false) 
   } 
 
   const handleDelete = async (id: string) => { 
     if (!confirm('Delete this template?')) return 
     await fetch('/api/templates/save', { 
       method: 'DELETE', 
       headers: { 'Content-Type': 'application/json' }, 
       body: JSON.stringify({ id }), 
     }) 
     setTemplates(t => t.filter(x => x.id !== id)) 
   } 
 
   const handleSaved = async (id: string) => { 
     await fetchTemplates(selectedCategory) 
     setCreating(false) 
     setEditingTemplate(null) 
   } 
 
   if (editingTemplate) { 
     return ( 
       <div> 
         <button onClick={() => setEditingTemplate(null)} className="text-xs font-mono text-[#888888] hover:text-[#f0f0f0] mb-4"> 
           ← Back to library 
         </button> 
         <TemplateEditor 
           initialTemplate={{ ...editingTemplate, ai_ps_enabled: Boolean(editingTemplate.ai_ps_enabled) }} 
           onSaved={handleSaved} 
         /> 
       </div> 
     ) 
   } 
 
   if (creating) { 
     return ( 
       <div> 
         <button onClick={() => setCreating(false)} className="text-xs font-mono text-[#888888] hover:text-[#f0f0f0] mb-4"> 
           ← Back to library 
         </button> 
         <TemplateEditor onSaved={handleSaved} /> 
       </div> 
     ) 
   } 
 
   return ( 
     <div className="space-y-4"> 
       {/* Actions row */} 
       <div className="flex items-center gap-3"> 
         <button 
           onClick={() => setCreating(true)} 
           className="px-4 py-2 text-xs font-mono border border-[#a855f7] text-[#a855f7] hover:bg-[#a855f7] hover:text-white transition-colors" 
         > 
           + New Template 
         </button> 
         {!seeded && templates.length === 0 && ( 
           <button 
             onClick={seedTemplates} 
             className="px-4 py-2 text-xs font-mono border border-[#2a2a2a] text-[#888888] hover:text-[#f0f0f0] transition-colors" 
           > 
             ⊞ Load 20 Starter Templates 
           </button> 
         )} 
         <select 
           className="bg-[#0a0a0a] border border-[#2a2a2a] text-[#888888] text-xs font-mono px-3 py-2 ml-auto" 
           value={selectedCategory} 
           onChange={e => { setSelectedCategory(e.target.value); fetchTemplates(e.target.value) }} 
         > 
           <option value="">All categories</option> 
           {Object.entries(CATEGORY_LABELS).map(([v, l]) => ( 
             <option key={v} value={v}>{l}</option> 
           ))} 
         </select> 
       </div> 
 
       {/* Template grid */} 
       {loading ? ( 
         <p className="text-[#888888] text-xs font-mono animate-pulse">Loading templates…</p> 
       ) : templates.length === 0 ? ( 
         <div className="border border-[#2a2a2a] bg-[#111111] p-8 text-center"> 
           <p className="text-[#888888] text-xs font-mono">No templates yet.</p> 
           <p className="text-[#444444] text-xs font-mono mt-1">Create one or load the 20 starter templates.</p> 
         </div> 
       ) : ( 
         <div className="border border-[#2a2a2a] divide-y divide-[#2a2a2a]"> 
           {templates.map(t => ( 
             <div key={t.id} className="p-4 bg-[#111111] flex items-start justify-between hover:bg-[#1a1a1a]"> 
               <div className="flex-1 min-w-0"> 
                 <div className="flex items-center gap-2 mb-1"> 
                   <p className="text-[#f0f0f0] text-xs font-sans">{t.name}</p> 
                   <span className="text-[10px] font-mono text-[#888888] border border-[#2a2a2a] px-1.5 py-0.5"> 
                     {CATEGORY_LABELS[t.category] ?? t.category} 
                   </span> 
                   {t.ai_ps_enabled ? ( 
                     <span className="text-[10px] font-mono text-[#a855f7] border border-[#a855f7] px-1.5 py-0.5">AI P.S.</span> 
                   ) : null} 
                 </div> 
                 <p className="text-[#444444] text-xs font-mono truncate">{t.subject_spintax}</p> 
               </div> 
               <div className="flex gap-2 ml-4 shrink-0"> 
                 <button 
                   onClick={() => handleEdit(t.id)} 
                   className="text-xs font-mono border border-[#2a2a2a] px-3 py-1.5 text-[#888888] hover:text-[#f0f0f0] transition-colors" 
                 > 
                   Edit 
                 </button> 
                 <button 
                   onClick={() => handleDelete(t.id)} 
                   className="text-xs font-mono border border-[#2a2a2a] px-3 py-1.5 text-[#ef4444] hover:bg-[#ef4444] hover:text-white transition-colors" 
                 > 
                   ✕ 
                 </button> 
               </div> 
             </div> 
           ))} 
         </div> 
       )} 
     </div> 
   ) 
 }