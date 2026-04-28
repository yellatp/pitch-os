// src/pages/api/dns/check.ts
// POST — perform DNS check for a domain (SPF, DKIM, DMARC)
// GET  — list cached DNS checks for current user

import type { APIRoute } from 'astro'
import { dbRun, dbAll } from '@/lib/db'
import { nanoid } from 'nanoid'

// ─── DNS record lookup via public DNS-over-HTTPS ────────────────────────────

async function resolveTXT(domain: string, recordName?: string): Promise<string[]> {
  const name = recordName ?? domain
  const url = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=TXT`
  const res = await fetch(url)
  if (!res.ok) return []
  const data = await res.json() as { Answer?: Array<{ data: string }> }
  return data.Answer?.map(a => a.data.replace(/"/g, '')) ?? []
}

function checkSPF(txtRecords: string[]): { valid: boolean; record: string | null; details: string } {
  const spfRecord = txtRecords.find(r => r.startsWith('v=spf1'))
  if (!spfRecord) {
    return { valid: false, record: null, details: 'No SPF record found. Email may be marked as spam.' }
  }
  const hasAll = spfRecord.includes(' -all') || spfRecord.includes(' ~all')
  return {
    valid: hasAll,
    record: spfRecord,
    details: hasAll
      ? 'SPF record found with hard/soft fail. ✓'
      : 'SPF record found but missing -all or ~all mechanism. Add one to prevent spoofing.',
  }
}

function checkDKIM(txtRecords: string[], selector = 'default'): { valid: boolean; record: string | null; details: string } {
  const dkimRecord = txtRecords.find(r => r.includes('v=DKIM1'))
  if (!dkimRecord) {
    return { valid: false, record: null, details: `No DKIM record found for selector "${selector}". Email providers may flag as spam.` }
  }
  return {
    valid: true,
    record: dkimRecord,
    details: 'DKIM record found. ✓',
  }
}

function checkDMARC(txtRecords: string[]): { valid: boolean; record: string | null; details: string } {
  const dmarcRecord = txtRecords.find(r => r.startsWith('v=DMARC1'))
  if (!dmarcRecord) {
    return { valid: false, record: null, details: 'No DMARC record found. Consider adding one for deliverability reporting.' }
  }
  const hasPolicy = dmarcRecord.includes('p=')
  return {
    valid: hasPolicy,
    record: dmarcRecord,
    details: hasPolicy
      ? 'DMARC record found with policy. ✓'
      : 'DMARC record found but missing policy (p=). Add p=quarantine or p=reject.',
  }
}

// ─── API Handlers ───────────────────────────────────────────────────────────

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user
  if (!user) return new Response('Unauthorized', { status: 401 })

  const env = locals.env
  const { domain } = await request.json() as { domain: string }

  if (!domain || !domain.includes('.')) {
    return new Response(JSON.stringify({ error: 'Valid domain required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const cleanDomain = domain.toLowerCase().trim()

  // Resolve DNS records
  const domainTxt = await resolveTXT(cleanDomain)
  const dkimSelector = 'default'
  const dkimTxt = await resolveTXT(cleanDomain, `${dkimSelector}._domainkey.${cleanDomain}`)
  const dmarcTxt = await resolveTXT(cleanDomain, `_dmarc.${cleanDomain}`)

  const spf = checkSPF(domainTxt)
  const dkim = checkDKIM(dkimTxt, dkimSelector)
  const dmarc = checkDMARC(dmarcTxt)

  // Cache result
  await dbRun(env.DB,
    `INSERT INTO dns_checks (id, user_id, domain, spf_valid, dkim_valid, dmarc_valid, last_checked)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, domain) DO UPDATE SET
       spf_valid = excluded.spf_valid,
       dkim_valid = excluded.dkim_valid,
       dmarc_valid = excluded.dmarc_valid,
       last_checked = excluded.last_checked`,
    [nanoid(), user.id, cleanDomain, spf.valid ? 1 : 0, dkim.valid ? 1 : 0, dmarc.valid ? 1 : 0]
  )

  return new Response(JSON.stringify({
    domain: cleanDomain,
    spf,
    dkim,
    dmarc,
    allPassing: spf.valid && dkim.valid && dmarc.valid,
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user
  if (!user) return new Response('Unauthorized', { status: 401 })

  const env = locals.env

  const checks = await dbAll<{
    id: string
    domain: string
    spf_valid: number
    dkim_valid: number
    dmarc_valid: number
    last_checked: string
  }>(
    env.DB,
    'SELECT domain, spf_valid, dkim_valid, dmarc_valid, last_checked FROM dns_checks WHERE user_id = ? ORDER BY last_checked DESC',
    [user.id]
  )

  return new Response(JSON.stringify({ checks }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
