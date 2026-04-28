import { useState, useEffect, useCallback } from 'react' 
 import { renderTemplate, extractVariables, validateSpintax, previewVariants } from '@/lib/spintax' 
 
 type Template = { 
   id?: string 
   name: string 
   category: string 
   subject_spintax: string 
   body_spintax: string 
   ai_ps_enabled: boolean 
 } 
 
 const CATEGORIES = [ 
   { value: 'job_search',         label: 'Job Search' }, 
   { value: 'referral_request',   label: 'Referral Request' }, 
   { value: 'mentorship_request', label: 'Mentorship Request' }, 
   { value: 'investor_pitch',     label: 'Investor Pitch' }, 
   { value: 'partnership',        label: 'Partnership' }, 
   { value: 'product_demo',       label: 'Product Demo' }, 
   { value: 'one_pager_share',    label: 'One-Pager Share' }, 
   { value: 'recruiter_reach',    label: 'Recruiter Reach' }, 
   { value: 'community_invite',   label: 'Community Invite' }, 
   { value: 'custom',             label: 'Custom' }, 
 ] 
 
 export default function TemplateEditor({ 
   initialTemplate, 
   onSaved, 
 }: { 
   initialTemplate?: Template 
   onSaved?: (id: string) => void 
 }) { 
   const [template, setTemplate] = useState<Template>( 
     initialTemplate ?? { 
       name: '', 
       category: 'job_search', 
       subject_spintax: '', 
       body_spintax: '', 
       ai_ps_enabled: false, 
     } 
   ) 
 
   const [previewVars, setPreviewVars] = useState<Record<string, string>>({}) 
   const [renderedSubject, setRenderedSubject] = useState('') 
   const [renderedBody, setRenderedBody] = useState('') 
   const [variants, setVariants] = useState<string[]>([]) 
   const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'variants'>('edit') 
   const [saving, setSaving] = useState(false) 
   const [saveError, setSaveError] = useState('') 
   const [subjectError, setSubjectError] = useState('') 
   const [bodyError, setBodyError] = useState('') 
 
   const requiredVars = [ 
     ...extractVariables(template.subject_spintax), 
     ...extractVariables(template.body_spintax), 
   ].filter((v, i, a) => a.indexOf(v) === i) 
 
   const updatePreview = useCallback(() => { 
     setRenderedSubject(renderTemplate(template.subject_spintax, previewVars)) 
     setRenderedBody(renderTemplate(template.body_spintax, previewVars)) 
   }, [template.subject_spintax, template.body_spintax, previewVars]) 
 
   useEffect(() => { updatePreview() }, [updatePreview]) 
 
   const regenerateVariants = () => { 
     setVariants(previewVariants(template.body_spintax, 3)) 
   } 
 
   useEffect(() => { regenerateVariants() }, [template.body_spintax]) 
 
   const handleSubjectChange = (v: string) => { 
     const validation = validateSpintax(v) 
     setSubjectError(validation.valid ? '' : validation.error ?? '') 
     setTemplate(t => ({ ...t, subject_spintax: v })) 
   } 
 
   const handleBodyChange = (v: string) => { 
     const validation = validateSpintax(v) 
     setBodyError(validation.valid ? '' : validation.error ?? '') 
     setTemplate(t => ({ ...t, body_spintax: v })) 
   } 
 
   const handleSave = async () => { 
     if (subjectError || bodyError) return 
     if (!template.name || !template.subject_spintax || !template.body_spintax) { 
       setSaveError('Name, subject, and body are required') 
       return 
     } 
     setSaving(true) 
     setSaveError('') 
 
     const res = await fetch('/api/templates/save', { 
       method: 'POST', 
       headers: { 'Content-Type': 'application/json' }, 
       body: JSON.stringify({ 
         id: template.id, 
         name: template.name, 
         category: template.category, 
         subjectSpintax: template.subject_spintax, 
         bodySpintax: template.body_spintax, 
         aiPsEnabled: template.ai_ps_enabled, 
       }), 
     }) 
 
     if (res.ok) { 
       const d = await res.json() as { id: string } 
       onSaved?.(d.id) 
       setTemplate(t => ({ ...t, id: d.id })) 
     } else { 
       const err = await res.json() as { error: string } 
       setSaveError(err.error) 
     } 
     setSaving(false) 
   } 
 
   const textareaCls = 'w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#f0f0f0] text-xs font-mono px-3 py-2 outline-none focus:border-[#888888] placeholder:text-[#444444] resize-none' 
   const inputCls = 'bg-[#0a0a0a] border border-[#2a2a2a] text-[#f0f0f0] text-xs font-mono px-3 py-2 outline-none focus:border-[#888888] placeholder:text-[#444444] w-full' 
   const tabBtn = (active: boolean) => 
     `px-4 py-2 text-xs font-mono border-b-2 transition-colors ${active ? 'border-[#a855f7] text-[#f0f0f0]' : 'border-transparent text-[#888888] hover:text-[#f0f0f0]'}` 
 
   return ( 
     <div className="space-y-4 max-w-4xl"> 
 
       {/* Meta row */} 
       <div className="flex gap-3"> 
         <div className="flex-1"> 
           <label className="text-[10px] font-mono text-[#888888] block mb-1">TEMPLATE NAME</label> 
           <input 
             className={inputCls} 
             placeholder="My job search template" 
             value={template.name} 
             onChange={e => setTemplate(t => ({ ...t, name: e.target.value }))} 
           /> 
         </div> 
         <div className="w-52"> 
           <label className="text-[10px] font-mono text-[#888888] block mb-1">CATEGORY</label> 
           <select 
             className={inputCls} 
             value={template.category} 
             onChange={e => setTemplate(t => ({ ...t, category: e.target.value }))} 
           > 
             {CATEGORIES.map(c => ( 
               <option key={c.value} value={c.value}>{c.label}</option> 
             ))} 
           </select> 
         </div> 
       </div> 
 
       {/* Tabs */} 
       <div className="flex border-b border-[#2a2a2a]"> 
         <button onClick={() => setActiveTab('edit')} className={tabBtn(activeTab === 'edit')}>Edit</button> 
         <button onClick={() => setActiveTab('preview')} className={tabBtn(activeTab === 'preview')}>Preview</button> 
         <button onClick={() => setActiveTab('variants')} className={tabBtn(activeTab === 'variants')}>Variants (3)</button> 
       </div> 
 
       {/* ── Edit tab ── */} 
       {activeTab === 'edit' && ( 
         <div className="space-y-3"> 
           <div className="bg-[#0a0a0a] border border-[#2a2a2a] p-3 text-xs font-mono text-[#888888]"> 
             <p className="text-[#a855f7] mb-1">Spintax syntax</p> 
             <p>{'{option1|option2|option3}'} — randomly picks one option</p> 
             <p>{'{{VariableName}}'} — replaced with actual value at send time</p> 
           </div> 
 
           <div> 
             <label className="text-[10px] font-mono text-[#888888] block mb-1">SUBJECT LINE</label> 
             <input 
               className={`${inputCls} ${subjectError ? 'border-[#ef4444]' : ''}`} 
               placeholder="{Excited about|Interested in} {{Company}}" 
               value={template.subject_spintax} 
               onChange={e => handleSubjectChange(e.target.value)} 
             /> 
             {subjectError && <p className="text-[#ef4444] text-xs font-mono mt-1">{subjectError}</p>} 
           </div> 
 
           <div> 
             <label className="text-[10px] font-mono text-[#888888] block mb-1">BODY</label> 
             <textarea 
               className={`${textareaCls} ${bodyError ? 'border-[#ef4444]' : ''}`} 
               rows={16} 
               placeholder="{Hi|Hello} {{FirstName}}, ..." 
               value={template.body_spintax} 
               onChange={e => handleBodyChange(e.target.value)} 
             /> 
             {bodyError && <p className="text-[#ef4444] text-xs font-mono mt-1">{bodyError}</p>} 
           </div> 
 
           {/* AI PS toggle */} 
           <label className="flex items-center gap-3 cursor-pointer"> 
             <div 
               onClick={() => setTemplate(t => ({ ...t, ai_ps_enabled: !t.ai_ps_enabled }))} 
               className={`w-9 h-5 rounded-full transition-colors relative ${template.ai_ps_enabled ? 'bg-[#a855f7]' : 'bg-[#2a2a2a]'}`} 
             > 
               <span 
                 className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${template.ai_ps_enabled ? 'translate-x-4' : 'translate-x-0.5'}`} 
               /> 
             </div> 
             <span className="text-xs font-mono text-[#888888]"> 
               AI P.S. line (GPT-4o mini writes a personalized P.S. per recipient — requires OpenAI key) 
             </span> 
           </label> 
         </div> 
       )} 
 
       {/* ── Preview tab ── */} 
       {activeTab === 'preview' && ( 
         <div className="space-y-4"> 
           {/* Variable inputs */} 
           {requiredVars.length > 0 && ( 
             <div> 
               <p className="text-[10px] font-mono text-[#888888] mb-2">FILL IN VARIABLES FOR PREVIEW</p> 
               <div className="grid grid-cols-2 gap-2"> 
                 {requiredVars.map(v => ( 
                   <div key={v}> 
                     <label className="text-[10px] font-mono text-[#444444] block mb-1">{'{{' + v + '}}'}</label> 
                     <input 
                       className={inputCls} 
                       placeholder={v} 
                       value={previewVars[v] ?? ''} 
                       onChange={e => setPreviewVars(p => ({ ...p, [v]: e.target.value }))} 
                     /> 
                   </div> 
                 ))} 
               </div> 
             </div> 
           )} 
 
           <div className="border border-[#2a2a2a] bg-[#111111] p-4 space-y-3"> 
             <div className="border-b border-[#2a2a2a] pb-2"> 
               <p className="text-[10px] font-mono text-[#888888] mb-1">SUBJECT</p> 
               <p className="text-[#f0f0f0] text-sm font-sans">{renderedSubject || '—'}</p> 
             </div> 
             <div> 
               <p className="text-[10px] font-mono text-[#888888] mb-2">BODY</p> 
               <pre className="text-[#f0f0f0] text-xs font-sans whitespace-pre-wrap leading-relaxed"> 
                 {renderedBody || '—'} 
               </pre> 
             </div> 
           </div> 
 
           <button onClick={updatePreview} className="text-xs font-mono border border-[#2a2a2a] px-3 py-1.5 text-[#888888] hover:text-[#f0f0f0] transition-colors"> 
             ↺ Re-roll spintax 
           </button> 
         </div> 
       )} 
 
       {/* ── Variants tab ── */} 
       {activeTab === 'variants' && ( 
         <div className="space-y-3"> 
           <div className="flex items-center justify-between"> 
             <p className="text-xs text-[#888888] font-mono">3 different resolved versions of this template</p> 
             <button onClick={regenerateVariants} className="text-xs font-mono border border-[#2a2a2a] px-3 py-1.5 text-[#888888] hover:text-[#f0f0f0] transition-colors"> 
               ↺ Regenerate 
             </button> 
           </div> 
           {variants.map((v, i) => ( 
             <div key={i} className="border border-[#2a2a2a] bg-[#111111] p-4"> 
               <p className="text-[10px] font-mono text-[#888888] mb-2">VARIANT {i + 1}</p> 
               <pre className="text-[#f0f0f0] text-xs font-sans whitespace-pre-wrap leading-relaxed">{v}</pre> 
             </div> 
           ))} 
         </div> 
       )} 
 
       {/* Save */} 
       {saveError && <p className="text-[#ef4444] text-xs font-mono">{saveError}</p>} 
       <div className="flex gap-2"> 
         <button 
           onClick={handleSave} 
           disabled={saving || !!subjectError || !!bodyError} 
           className="px-4 py-2 text-xs font-mono border border-[#a855f7] text-[#a855f7] hover:bg-[#a855f7] hover:text-white disabled:opacity-30 transition-colors" 
         > 
           {saving ? 'Saving…' : template.id ? '✓ Update Template' : '+ Save Template'} 
         </button> 
       </div> 
     </div> 
   ) 
 }