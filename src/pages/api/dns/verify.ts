// src/pages/api/dns/verify.ts
import type { APIRoute } from 'astro'
import { dbRun } from '@/lib/db'
import { nanoid } from 'nanoid'

type DNSRecord = { data: string }

async function dnsLookup(name: string, type: string): Promise<string[]> {
  const res = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
    { headers: { Accept: 'application/dns-json' } }
  )
  if (!res.ok) return []
  const data = await res.json() as { Answer?: DNSRecord[]; Status: number }
  if (data.Status !== 0 || !data.Answer) return []
  return data.Answer.map(r => r.data.replace(/^"|"$/g, ''))
}

async function checkSPF(domain: string): Promise<{ valid: boolean; record: string | null; details: string }> {
  const records = await dnsLookup(domain, 'TXT')
  const spf = records.find(r => r.startsWith('v=spf1'))
  if (!spf) return { valid: false, record: null, details: 'No SPF record found at root domain.' }
  if (!spf.includes('~all') && !spf.includes('-all')) {
    return { valid: false, record: spf, details: 'SPF record found but missing ~all or -all qualifier.' }
  }
  return { valid: true, record: spf, details: 'SPF record is valid.' }
}

async function checkDKIM(
  domain: string,
  selector = 'resend'
): Promise<{ valid: boolean; record: string | null; details: string }> {
  // Try common selectors: resend, brevo, mailgun, google, s1, s2, default
  const selectors = [selector, 'resend', 'brevo', 'mailgun', 'google', 's1', 's2', 'default', 'smtp']
  for (const sel of selectors) {
    const records = await dnsLookup(`${sel}._domainkey.${domain}`, 'TXT')
    const dkim = records.find(r => r.includes('v=DKIM1') || r.includes('p='))
    if (dkim) {
      return {
        valid: true,
        record: dkim.slice(0, 80) + '…',
        details: `DKIM record found at selector: ${sel}._domainkey.${domain}`,
      }
    }
  }
  return {
    valid: false,
    record: null,
    details: 'No DKIM record found. Add the CNAME/TXT records from your sending provider.',
  }
}

async function checkDMARC(domain: string): Promise<{ valid: boolean; record: string | null; details: string; policy: string }> {
  const records = await dnsLookup(`_dmarc.${domain}`, 'TXT')
  const dmarc = records.find(r => r.startsWith('v=DMARC1'))
  if (!dmarc) {
    return { valid: false, record: null, details: 'No DMARC record found at _dmarc.' + domain, policy: 'none' }
  }
  const policyMatch = dmarc.match(/p=(\w+)/)
  const policy = policyMatch?.[1] ?? 'none'
  if (policy === 'none') {
    return {
      valid: false,
      record: dmarc,
      details: 'DMARC found but policy is "none" — upgrade to p=quarantine or p=reject.',
      policy,
    }
  }
  return { valid: true, record: dmarc, details: `DMARC valid. Policy: ${policy}.`, policy }
}

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

  const [spf, dkim, dmarc] = await Promise.all([
    checkSPF(domain),
    checkDKIM(domain),
    checkDMARC(domain),
  ])

  const allValid = spf.valid && dkim.valid && dmarc.valid

  // Cache result in D1
  await dbRun(
    env.DB,
    `INSERT INTO dns_checks (id, user_id, domain, spf_valid, dkim_valid, dmarc_valid, last_checked)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id, domain) DO UPDATE SET
       spf_valid = excluded.spf_valid,
       dkim_valid = excluded.dkim_valid,
       dmarc_valid = excluded.dmarc_valid,
       last_checked = datetime('now')`,
    [nanoid(), user.id, domain, spf.valid ? 1 : 0, dkim.valid ? 1 : 0, dmarc.valid ? 1 : 0]
  )

  return new Response(
    JSON.stringify({ domain, allValid, spf, dkim, dmarc, checkedAt: new Date().toISOString() }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
