import { useState, useEffect } from 'react'

type Campaign = {
  id: string
  name: string
  template_name: string
  status: string
  target_count: number
  sent_count: number
  opened_count: number
  replied_count: number
  bounced_count: number
  bounce_rate: number | null
  from_email: string
  created_at: string
}

type Log = {
  id: string
  recipient_email: string
  recipient_name: string
  recipient_company: string
  status: string
  rendered_subject: string
  sent_via: string
  sent_at: string
  bounced: number
}

const STATUS_COLORS: Record<string, string> = {
  draft:             '#888888',
  running:           '#22c55e',
  paused:            '#eab308',
  completed:         '#3b82f6',
  suspended_bounce:  '#ef4444',
}

export default function CampaignTable() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const fetchCampaigns = async () => {
    setLoading(true)
    const res = await fetch('/api/campaigns/list')
    const d = await res.json() as { campaigns: Campaign[] }
    setCampaigns(d.campaigns)
    setLoading(false)
  }

  useEffect(() => { fetchCampaigns() }, [])

  const viewLogs = async (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setLogsLoading(true)
    const res = await fetch(`/api/campaigns/logs?campaignId=${campaign.id}`)
    const d = await res.json() as { logs: Log[] }
    setLogs(d.logs)
    setLogsLoading(false)
  }

  const control = async (campaignId: string, action: 'pause' | 'resume' | 'delete') => {
    if (action === 'delete' && !confirm('Delete this campaign and all its logs?')) return
    await fetch('/api/campaigns/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId, action }),
    })
    await fetchCampaigns()
  }

  const progress = (c: Campaign) =>
    c.target_count > 0 ? Math.round((c.sent_count / c.target_count) * 100) : 0

  if (selectedCampaign) {
    return (
      <div>
        <button onClick={() => setSelectedCampaign(null)} className="text-xs font-mono text-[#888888] hover:text-[#f0f0f0] mb-4">
          ← Back to campaigns
        </button>

        <div className="mb-4">
          <h3 className="text-[#f0f0f0] text-sm font-sans mb-1">{selectedCampaign.name}</h3>
          <div className="flex gap-4 text-xs font-mono text-[#888888]">
            <span>Sent: <span className="text-[#f0f0f0]">{selectedCampaign.sent_count}</span></span>
            <span>Opened: <span className="text-[#3b82f6]">{selectedCampaign.opened_count}</span></span>
            <span>Replied: <span className="text-[#22c55e]">{selectedCampaign.replied_count}</span></span>
            <span>Bounced: <span className={selectedCampaign.bounced_count > 0 ? 'text-[#ef4444]' : 'text-[#f0f0f0]'}>
              {selectedCampaign.bounced_count} {selectedCampaign.bounce_rate !== null ? `(${selectedCampaign.bounce_rate}%)` : ''}
            </span></span>
          </div>
        </div>

        {logsLoading ? (
          <p className="text-[#888888] text-xs font-mono animate-pulse">Loading log…</p>
        ) : (
          <div className="border border-[#2a2a2a] divide-y divide-[#2a2a2a]">
            <div className="grid grid-cols-5 px-4 py-2 bg-[#0a0a0a] text-[10px] font-mono text-[#888888]">
              <span>RECIPIENT</span>
              <span>SUBJECT</span>
              <span>STATUS</span>
              <span>SENT VIA</span>
              <span>SENT AT</span>
            </div>
            {logs.map(log => (
              <div key={log.id} className="grid grid-cols-5 px-4 py-2 bg-[#111111] text-xs items-center">
                <div>
                  <p className="text-[#f0f0f0] font-mono">{log.recipient_email}</p>
                  {log.recipient_name && <p className="text-[#888888]">{log.recipient_name}</p>}
                </div>
                <p className="text-[#888888] truncate pr-4">{log.rendered_subject ?? '—'}</p>
                <p className={`font-mono ${
                  log.status === 'sent' ? 'text-[#22c55e]' :
                  log.status === 'failed' ? 'text-[#ef4444]' :
                  log.bounced ? 'text-[#ef4444]' : 'text-[#888888]'
                }`}>
                  {log.bounced ? 'bounced' : log.status}
                </p>
                <p className="text-[#888888] font-mono">{log.sent_via ?? '—'}</p>
                <p className="text-[#888888] text-[10px]">
                  {log.sent_at ? new Date(log.sent_at).toLocaleString() : '—'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 text-xs font-mono border border-[#a855f7] text-[#a855f7] hover:bg-[#a855f7] hover:text-white transition-colors"
        >
          + New Campaign
        </button>
      </div>

      {showCreate && <CreateCampaignForm onCreated={async () => { setShowCreate(false); await fetchCampaigns() }} />}

      {loading ? (
        <p className="text-[#888888] text-xs font-mono animate-pulse">Loading campaigns…</p>
      ) : campaigns.length === 0 ? (
        <div className="border border-[#2a2a2a] bg-[#111111] p-8 text-center">
          <p className="text-[#888888] text-xs font-mono">No campaigns yet.</p>
          <p className="text-[#444444] text-xs font-mono mt-1">Create one to start sending outreach at scale.</p>
        </div>
      ) : (
        <div className="border border-[#2a2a2a] divide-y divide-[#2a2a2a]">
          {campaigns.map(c => {
            const isSuspended = c.status === 'suspended_bounce'
            return (
              <div key={c.id} className={`p-4 bg-[#111111] ${isSuspended ? 'border-l-2 border-l-[#ef4444]' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[#f0f0f0] text-xs font-sans">{c.name}</p>
                      <span className="text-[10px] font-mono" style={{ color: STATUS_COLORS[c.status] ?? '#888888' }}>
                        {c.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[#888888] text-xs">Template: {c.template_name} · From: {c.from_email}</p>
                    {isSuspended && (
                      <p className="text-[#ef4444] text-xs font-mono mt-1">
                        ⚠ Bounce rate too high. Fix your list before resuming.
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => viewLogs(c)} className="text-xs font-mono border border-[#2a2a2a] px-3 py-1.5 text-[#888888] hover:text-[#f0f0f0] transition-colors">
                      Log
                    </button>
                    {c.status === 'running' && (
                      <button onClick={() => control(c.id, 'pause')} className="text-xs font-mono border border-[#eab308] px-3 py-1.5 text-[#eab308] hover:bg-[#eab308] hover:text-black transition-colors">
                        Pause
                      </button>
                    )}
                    {(c.status === 'paused' || c.status === 'draft') && (
                      <button onClick={() => control(c.id, 'resume')} className="text-xs font-mono border border-[#22c55e] px-3 py-1.5 text-[#22c55e] hover:bg-[#22c55e] hover:text-black transition-colors">
                        Resume
                      </button>
                    )}
                    <button onClick={() => control(c.id, 'delete')} className="text-xs font-mono border border-[#2a2a2a] px-3 py-1.5 text-[#ef4444] hover:bg-[#ef4444] hover:text-white transition-colors">
                      ✕
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#22c55e] transition-all"
                      style={{ width: `${progress(c)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[#888888] whitespace-nowrap">
                    {c.sent_count}/{c.target_count} sent
                  </span>
                  {c.bounce_rate !== null && c.bounce_rate > 0 && (
                    <span className={`text-[10px] font-mono ${c.bounce_rate > 3 ? 'text-[#ef4444]' : 'text-[#888888]'}`}>
                      {c.bounce_rate}% bounce
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Create Campaign Form ──────────────────────────────────────────────────────

function CreateCampaignForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [templates, setTemplates] = useState<{ id: string; name: string; category: string }[]>([])
  const [fromEmail, setFromEmail] = useState('')
  const [fromName, setFromName] = useState('')
  const [csvText, setCsvText] = useState('')
  const [parsedCount, setParsedCount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/templates/list')
      .then(r => r.json())
      .then((d: any) => setTemplates(d.templates))
  }, [])

  const handleCSV = (text: string) => {
    setCsvText(text)
    const lines = text.trim().split('\n').filter(Boolean)
    setParsedCount(Math.max(0, lines.length - 1))
  }

  const handleSubmit = async () => {
    if (!name || !templateId || !fromEmail || !csvText) {
      setError('All fields required')
      return
    }

    const { parseCSV, normalizeRow } = await import('@/lib/csv')
    const rows = parseCSV(csvText).map((r: any) => {
      const n = normalizeRow(r)
      return {
        email: r.email || r.email_address || '',
        name: `${n.firstName} ${n.lastName}`.trim(),
        company: n.company,
        role: n.role,
      }
    }).filter((r: any) => r.email && r.email.includes('@'))

    if (!rows.length) {
      setError('No valid email addresses found in CSV. Ensure column is named "email".')
      return
    }

    setSubmitting(true)
    const res = await fetch('/api/campaigns/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, templateId, fromEmail, fromName, recipients: rows }),
    })
    if (res.ok) {
      onCreated()
    } else {
      const d = await res.json() as { error: string }
      setError(d.error)
    }
    setSubmitting(false)
  }

  const inputCls = 'bg-[#0a0a0a] border border-[#2a2a2a] text-[#f0f0f0] text-xs font-mono px-3 py-2 outline-none focus:border-[#888888] placeholder:text-[#444444] w-full'

  return (
    <div className="border border-[#2a2a2a] bg-[#111111] p-5 space-y-3">
      <p className="text-[#f0f0f0] text-xs font-mono font-medium">New Campaign</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-mono text-[#888888] block mb-1">CAMPAIGN NAME</label>
          <input className={inputCls} placeholder="Q1 Job Search" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-mono text-[#888888] block mb-1">TEMPLATE</label>
          <select className={inputCls} value={templateId} onChange={e => setTemplateId(e.target.value)}>
            <option value="">Select template…</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-mono text-[#888888] block mb-1">FROM EMAIL</label>
          <input className={inputCls} placeholder="you@yourname-careers.com" value={fromEmail} onChange={e => setFromEmail(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] font-mono text-[#888888] block mb-1">FROM NAME</label>
          <input className={inputCls} placeholder="Your Name" value={fromName} onChange={e => setFromName(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-mono text-[#888888] block mb-1">
          RECIPIENT CSV (paste or type) — columns: email, first_name, last_name, company, role
        </label>
        <textarea
          className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#f0f0f0] text-xs font-mono px-3 py-2 outline-none focus:border-[#888888] placeholder:text-[#444444] resize-none"
          rows={6}
          placeholder="email,first_name,last_name,company,role&#10;jane@stripe.com,Jane,Smith,Stripe,HR Manager"
          value={csvText}
          onChange={e => handleCSV(e.target.value)}
        />
        {parsedCount > 0 && (
          <p className="text-[#22c55e] text-xs font-mono mt-1">{parsedCount} recipient(s) parsed</p>
        )}
      </div>

      {error && <p className="text-[#ef4444] text-xs font-mono">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="px-4 py-2 text-xs font-mono border border-[#a855f7] text-[#a855f7] hover:bg-[#a855f7] hover:text-white disabled:opacity-30 transition-colors"
      >
        {submitting ? 'Creating…' : '⊞ Create Campaign'}
      </button>
    </div>
  )
}
