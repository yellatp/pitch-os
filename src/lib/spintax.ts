// src/lib/spintax.ts 
 
 /** 
  * Resolves {option1|option2|option3} blocks recursively. 
  * Supports nesting: {Hi|{Hey|Hello}} {Name} 
  * Variables wrapped in double-braces are substituted first: {{FirstName}} 
  */ 
 
 // ─── Variable substitution ──────────────────────────────────────────────────── 
 
 export function substituteVariables( 
   template: string, 
   variables: Record<string, string> 
 ): string { 
   return template.replace(/\{\{(\w+)\}\}/g, (_, key) => { 
     return variables[key] ?? variables[key.toLowerCase()] ?? `{{${key}}}` 
   }) 
 } 
 
 // ─── Spintax resolver ───────────────────────────────────────────────────────── 
 
 export function resolveSpintax(template: string): string { 
   // Keep resolving until no more spintax blocks remain 
   let result = template 
   let iterations = 0 
   while (result.includes('{') && iterations < 20) { 
     result = resolveSinglePass(result) 
     iterations++ 
   } 
   return result 
 } 
 
 function resolveSinglePass(text: string): string { 
   // Find innermost {...|...} blocks (no nested braces inside) 
   return text.replace(/\{([^{}]+)\}/g, (_, inner: string) => { 
     const options = inner.split('|') 
     return options[Math.floor(Math.random() * options.length)] 
   }) 
 } 
 
 // ─── Preview multiple variants ──────────────────────────────────────────────── 
 
 export function previewVariants(template: string, count = 3): string[] { 
   return Array.from({ length: count }, () => resolveSpintax(template)) 
 } 
 
 // ─── Full render pipeline ───────────────────────────────────────────────────── 
 // 1. Substitute {{variables}} 
 // 2. Resolve {spintax|options} 
 // Returns the final rendered string 
 
 export function renderTemplate( 
   template: string, 
   variables: Record<string, string> = {} 
 ): string { 
   const withVars = substituteVariables(template, variables) 
   return resolveSpintax(withVars) 
 } 
 
 // ─── Extract variable names from template ───────────────────────────────────── 
 
 export function extractVariables(template: string): string[] { 
   const matches = template.matchAll(/\{\{(\w+)\}\}/g) 
   return [...new Set([...matches].map(m => m[1]))] 
 } 
 
 // ─── Validate spintax (detect unclosed braces) ──────────────────────────────── 
 
 export function validateSpintax(template: string): { valid: boolean; error?: string } { 
   let depth = 0 
   for (const char of template) { 
     if (char === '{') depth++ 
     if (char === '}') depth-- 
     if (depth < 0) return { valid: false, error: 'Unexpected closing brace }' } 
   } 
   if (depth !== 0) return { valid: false, error: `${depth} unclosed brace(s) {` } 
   return { valid: true } 
 }