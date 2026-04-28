import { useState, useRef } from 'react'
import Badge from '@/components/ui/Badge'
import { parseCSV, normalizeRow, toCSV } from '@/lib/csv'

type FindResult = {
  email: string | null
  source: string
  confidence: number
  attempts?: string[]
  firstName?: string
  lastName?: string
  company?: string
  role?: string
}

type BulkRow = FindResult & {
  firstName: string
  lastName: string
  company: string
  domain?: string
  role?: string
  error?: string
}

type Tab = 'single' | 'bulk' | 'domain'

function ConfidenceBadge({ score }: { score: number }) {
  const status = score >= 80 ? 'valid' : score >= 60 ? 'risky' : score > 0 ? 'unknown' : 'invalid'
  return <Badge status={status}>{score}% confidence</Badge>
}

export default function DiscoveryPanel() {
  const [tab, setTab] = useState<Tab>('single')

  // Single mode state
  const [form, setForm] = useState({ firstName: '', lastName: '', company: '', domain: '', role: '', linkedinUrl: '' })
  const [singleResult, setSingleResult] = useState<FindResult | null>(null)
  const [singleLoading, setSingleLoading] = useState(false)
  const [singleError, setSingleError] = useState('')

  // Domain mode state
  const [domainInput, setDomainInput] = useState('')
  const [domainResults, setDomainResults] = useState<{ email: string; firstName: string; lastName: string; role: string }[]>([])
  const [domainLoading, setDomainLoading] = useState(false)
  const [domainTotal, setDomainTotal] = useState(0)

  // Bulk mode state
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkSummary, setBulkSummary] = useState<{ total: number; found: number; notFound: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const setField = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  // ── Single search ──
  const handleSingle = async () => {
    if (!form.firstName || !form.lastName || !form.company) {
      setSingleError('First name, last name, and company are required')
      return
    }
    setSingleLoading(true)
    setSingleError('')
    setSingleResult(null)
    const res = await fetch('/api/discover/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'single', ...form }),
    })
    const data = await res.json() as FindResult
    setSingleResult(data)
    setSingleLoading(false)
  }

  // ── Domain search ──
  const handleDomain = async () => {
    if (!domainInput.trim()) return
    setDomainLoading(true)
    setDomainResults([])
    const res = await fetch('/api/discover/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'domain', domain: domainInput.trim() }),
    })
    const data = await res.json() as { emails: typeof domainResults; total: number }
    setDomainResults(data.emails)
    setDomainTotal(data.total)
    setDomainLoading(false)
  }

  // ── Bulk CSV ──
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const parsed = parseCSV(text)
    const rows = parsed.map(normalizeRow).filter(r => r.firstName && r.lastName && r.company)
    if (!rows.length) return

    setBulkLoading(true)
    setBulkRows([])
    setBulkSummary(null)

    const res = await fetch('/api/discover/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    })
    const data = await res.json() as { results: BulkRow[]; summary: typeof bulkSummary }
    setBulkRows(data.results)
    setBulkSummary(data.summary)
    setBulkLoading(false)
  }

  const downloadBulkCSV = () => {
    const csv = toCSV(bulkRows.map(r => ({
      first_name: r.firstName,
      last_name: r.lastName,
      company: r.company,
      role: r.role ?? '',
      email: r.email ?? '',
      confidence: r.confidence,
      source: r.source,
    })))
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'discovery-results.csv'
    a.click()
  }

  const inputCls = 'bg-[#0a0a0a] border border-[#2a2a2a] text-[#f0f0f0] text-xs font-mono px-3 py-2 outline-none focus:border-[#888888] placeholder:text-[#444444] w-full'
  const btnCls = 'px-4 py-2 text-xs font-mono border border-[#2a2a2a] text-[#f0f0f0] hover:bg-[#1a1a1a] disabled:opacity-30 transition-colors'

  return (
    <div className="max-w-3xl space-y-6">

      {/* Tabs */}
      <div className="flex border-b border-[#2a2a2a]">
        {(['single', 'domain', 'bulk'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-mono capitalize border-b-2 transition-colors ${
              tab === t
                ? 'border-[#a855f7] text-[#f0f0f0]'
                : 'border-transparent text-[#888888] hover:text-[#f0f0f0]'
            }`}
          >
            {t === 'single' ? 'Single Lookup' : t === 'domain' ? 'Domain Search' : 'Bulk CSV'}
          </button>
        ))}
      </div>

      {/* ── Single Lookup ── */}
      {tab === 'single' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-[#888888] block mb-1">FIRST NAME *</label>
              <input className={inputCls} placeholder="Jane" value={form.firstName} onChange={setField('firstName')} />
            </div>
            <div>
              <label className="text-[10px] font-mono text-[#888888] block mb-1">LAST NAME *</label>
              <input className={inputCls} placeholder="Smith" value={form.lastName} onChange={setField('lastName')} />
            </div>
            <div>
              <label className="text-[10px] font-mono text-[#888888] block mb-1">COMPANY *</label>
              <input className={inputCls} placeholder="Stripe" value={form.company} onChange={setField('company')} />
            </div>
            <div>
              <label className="text-[10px] font-mono text-[#888888] block mb-1">DOMAIN (optional)</label>
              <input className={inputCls} placeholder="stripe.com" value={form.domain} onChange={setField('domain')} />
            </div>
            <div>
              <label className="text-[10px] font-mono text-[#888888] block mb-1">ROLE (optional)</label>
              <input className={inputCls} placeholder="HR Manager" value={form.role} onChange={setField('role')} />
            </div>
            <div>
              <label className="text-[10px] font-mono text-[#888888] block mb-1">LINKEDIN URL (optional)</label>
              <input className={inputCls} placeholder="linkedin.com/in/..." value={form.linkedinUrl} onChange={setField('linkedinUrl')} />
            </div>
          </div>

          {singleError && <p className="text-[#ef4444] text-xs font-mono">{singleError}</p>}

          <button onClick={handleSingle} disabled={singleLoading} className={btnCls}>
            {singleLoading ? 'Searching…' : '⌖ Find Email'}
          </button>

          {/* Result card */}
          {singleResult && (
            <div className="border border-[#2a2a2a] bg-[#111111] p-4 space-y-3">
              {singleResult.email ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-[#22c55e] font-mono text-sm">{singleResult.email}</p>
                    <ConfidenceBadge score={singleResult.confidence} />
                  </div>
                  <p className="text-[#888888] text-xs font-mono">Found via: {singleResult.source}</p>
                  {singleResult.attempts && (
                    <p className="text-[#888888] text-xs font-mono">
                      Tried: {singleResult.attempts.join(' → ')}
                    </p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <a
                      href={`/verify?email=${encodeURIComponent(singleResult.email)}`}
                      className="text-xs font-mono border border-[#2a2a2a] px-3 py-1.5 text-[#f0f0f0] hover:bg-[#1a1a1a] transition-colors"
                    >
                      ✓ Verify
                    </a>
                    <button
                      onClick={() => navigator.clipboard.writeText(singleResult.email!)}
                      className="text-xs font-mono border border-[#2a2a2a] px-3 py-1.5 text-[#888888] hover:text-[#f0f0f0] transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </>
              ) : (
                <div>
                  <p className="text-[#888888] font-mono text-sm">No email found</p>
                  <p className="text-[#444444] text-xs font-mono mt-1">
                    Tried: {singleResult.attempts?.join(', ') || 'no keys configured'}
                  </p>
                  <p className="text-[#444444] text-xs font-mono">
                    Add more finder API keys in <a href="/keys" className="text-[#a855f7] underline">/keys</a> to improve coverage.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Domain Search ── */}
      {tab === 'domain' && (
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-mono text-[#888888] block mb-1">COMPANY DOMAIN</label>
            <div className="flex gap-2">
              <input
                className={inputCls}
                placeholder="stripe.com"
                value={domainInput}
                onChange={e => setDomainInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleDomain()}
              />
              <button onClick={handleDomain} disabled={domainLoading} className={btnCls}>
                {domainLoading ? 'Searching…' : 'Search'}
              </button>
            </div>
            <p className="text-[#444444] text-xs font-mono mt-1">
              Powered by Hunter.io domain search. Requires Hunter API key in <a href="/keys" className="text-[#a855f7] underline">/keys</a>.
            </p>
          </div>

          {domainResults.length > 0 && (
            <div>
              <p className="text-[#888888] text-xs font-mono mb-2">
                Showing {domainResults.length} of {domainTotal} contacts found at this domain
              </p>
              <div className="border border-[#2a2a2a] divide-y divide-[#2a2a2a]">
                {domainResults.map((r, i) => (
                  <div key={i} className="p-3 bg-[#111111] flex items-center justify-between">
                    <div>
                      <p className="text-[#f0f0f0] text-xs font-mono">{r.firstName} {r.lastName}</p>
                      <p className="text-[#888888] text-xs">{r.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#22c55e] font-mono text-xs">{r.email}</span>
                      <a
                        href={`/verify?email=${encodeURIComponent(r.email)}`}
                        className="text-[10px] font-mono border border-[#2a2a2a] px-2 py-1 text-[#888888] hover:text-[#f0f0f0]"
                      >
                        Verify
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Bulk CSV ── */}
      {tab === 'bulk' && (
        <div className="space-y-4">
          {/* CSV format guide */}
          <div className="border border-[#2a2a2a] bg-[#0a0a0a] p-3">
            <p className="text-[#888888] text-xs font-mono mb-2">Expected CSV columns (case-insensitive):</p>
            <code className="text-[#a855f7] text-xs font-mono block">
              first_name, last_name, company, domain (opt), role (opt)
            </code>
            <p className="text-[#444444] text-xs font-mono mt-2">Max 50 rows per upload. Results download as CSV.</p>
          </div>

          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFile}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={bulkLoading}
              className={`${btnCls} flex items-center gap-2`}
            >
              {bulkLoading ? (
                <><span className="animate-pulse">Processing rows…</span></>
              ) : (
                <>⊞ Upload CSV</>
              )}
            </button>
          </div>

          {bulkSummary && (
            <div className="flex gap-4">
              <div className="border border-[#2a2a2a] bg-[#111111] px-4 py-2 text-center">
                <p className="text-xl font-mono text-[#f0f0f0]">{bulkSummary.total}</p>
                <p className="text-[10px] font-mono text-[#888888]">Total</p>
              </div>
              <div className="border border-[#22c55e] bg-[#111111] px-4 py-2 text-center">
                <p className="text-xl font-mono text-[#22c55e]">{bulkSummary.found}</p>
                <p className="text-[10px] font-mono text-[#888888]">Found</p>
              </div>
              <div className="border border-[#2a2a2a] bg-[#111111] px-4 py-2 text-center">
                <p className="text-xl font-mono text-[#888888]">{bulkSummary.notFound}</p>
                <p className="text-[10px] font-mono text-[#888888]">Not Found</p>
              </div>
              <button onClick={downloadBulkCSV} className={`${btnCls} ml-auto`}>
                ↓ Download CSV
              </button>
            </div>
          )}

          {bulkRows.length > 0 && (
            <div className="border border-[#2a2a2a] divide-y divide-[#2a2a2a] max-h-96 overflow-y-auto">
              {bulkRows.map((r, i) => (
                <div key={i} className="p-3 bg-[#111111] flex items-center justify-between">
                  <div>
                    <p className="text-[#f0f0f0] text-xs font-mono">{r.firstName} {r.lastName} — {r.company}</p>
                    {r.role && <p className="text-[#888888] text-xs">{r.role}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {r.email ? (
                      <>
                        <span className="text-[#22c55e] font-mono text-xs">{r.email}</span>
                        <ConfidenceBadge score={r.confidence} />
                      </>
                    ) : (
                      <span className="text-[#444444] font-mono text-xs">not found</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}