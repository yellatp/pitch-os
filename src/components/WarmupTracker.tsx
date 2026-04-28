// src/components/WarmupTracker.tsx
import { useState, useEffect } from 'react'

type WarmupStatus = {
  status: string
  inbox_email: string | null
  provider: string | null
  start_date: string | null
  days_active: number
  target_daily_volume: number
  current_daily_volume: number
  readiness_score: number
  is_ready: boolean
  schedule: Array<{
    range: string
    target: number
    description: string
    done: boolean
  }>
}

const PROVIDERS = [
  { id: 'mails_ai',   name: 'Mails.ai',   free: true,  url: 'https://mails.ai' },
  { id: 'trulyinbox', name: 'TrulyInbox', free: true,  url: 'https://trulyinbox.com' },
  { id: 'instantly',  name: 'Instantly',  free: false, url: 'https://instantly.ai' },
  { id: 'smartlead',  name: 'Smartlead',  free: false, url: 'https://smartlead.ai' },
]

export default function WarmupTracker() {
  const [data, setData] = useState<WarmupStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [inboxEmail, setInboxEmail] = useState('')
  const [provider, setProvider] = useState('mails_ai')
  const [showSetup, setShowSetup] = useState(false)

  const fetchStatus = async () => {
    setLoading(true)
    const res = await fetch('/api/warmup/status')
    const d = await res.json() as WarmupStatus
    setData(d)
    if (d.inbox_email) setInboxEmail(d.inbox_email)
    if (d.provider) setProvider(d.provider)
    setLoading(false)
  }

  useEffect(() => { fetchStatus() }, [])

  const handleStart = async () => {
    if (!inboxEmail.includes('@')) return
    setSubmitting(true)
    await fetch('/api/warmup/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', inbox_email: inboxEmail, provider }),
    })
    await fetchStatus()
    setShowSetup(false)
    setSubmitting(false)
  }

  const handleStop = async () => {
    if (!confirm('Stop warmup? Your domain reputation progress will be paused.')) return
    await fetch('/api/warmup/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stop' }),
    })
    await fetchStatus()
  }

  const inputCls = 'bg-[#0a0a0a] border border-[#2a2a2a] text-[#f0f0f0] text-xs font-mono px-3 py-2 outline-none focus:border-[#888888] placeholder:text-[#444444] w-full'

  if (loading) return <p className="text-[#888888] text-xs font-mono animate-pulse">Loading warmup status…</p>
  if (!data) return null

  const isActive = data.status === 'warming'

  return (
    <div className="max-w-3xl space-y-6">

      {/* Status card */}
      <div className="border border-[#2a2a2a] bg-[#111111] p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`w-2 h-2 rounded-full ${isActive ? 'animate-pulse' : ''}`}
                style={{ background: isActive ? '#22c55e' : data.is_ready ? '#3b82f6' : '#888888' }}
              />
              <p className="text-[#f0f0f0] text-xs font-mono font-medium">
                {data.is_ready ? 'DOMAIN READY' : isActive ? 'WARMING UP' : 'INACTIVE'}
              </p>
            </div>
            {data.inbox_email && (
              <p className="text-[#888888] text-xs font-mono">{data.inbox_email} via {data.provider}</p>
            )}
          </div>

          {!isActive ? (
            <button
              onClick={() => setShowSetup(true)}
              className="px-3 py-1.5 text-xs font-mono border border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e] hover:text-black transition-colors"
            >
              {data.inbox_email ? 'Restart Warmup' : 'Start Warmup'}
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="px-3 py-1.5 text-xs font-mono border border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444] hover:text-white transition-colors"
            >
              Stop
            </button>
          )}
        </div>

        {/* Readiness progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-mono text-[#888888]">READINESS SCORE</p>
            <p className="text-[10px] font-mono text-[#f0f0f0]">{data.readiness_score}%</p>
          </div>
          <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className="h-full transition-all rounded-full"
              style={{
                width: `${data.readiness_score}%`,
                background: data.readiness_score >= 100 ? '#3b82f6' : '#22c55e',
              }}
            />
          </div>
          <p className="text-[#444444] text-xs font-mono mt-1">
            Day {data.days_active} of 30 · Target: {data.target_daily_volume} warmup emails/day
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Days Active',    value: String(data.days_active) },
            { label: 'Daily Target',   value: `${data.target_daily_volume} emails` },
            { label: 'Status',         value: data.is_ready ? 'Ready ✓' : isActive ? 'Warming' : 'Inactive' },
          ].map(s => (
            <div key={s.label} className="bg-[#0a0a0a] border border-[#2a2a2a] p-3">
              <p className="text-[#444444] text-[10px] font-mono">{s.label}</p>
              <p className="text-[#f0f0f0] text-xs font-mono mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Setup form */}
      {showSetup && (
        <div className="border border-[#2a2a2a] bg-[#111111] p-5 space-y-4">
          <p className="text-[#f0f0f0] text-xs font-mono font-medium">Configure Warmup</p>

          <div>
            <label className="text-[10px] font-mono text-[#888888] block mb-1">INBOX EMAIL TO WARM</label>
            <input
              className={inputCls}
              placeholder="you@yourname-careers.com"
              value={inboxEmail}
              onChange={e => setInboxEmail(e.target.value)}
            />
            <p className="text-[#444444] text-xs font-mono mt-1">
              Must be the same email you plan to send campaigns from.
            </p>
          </div>

          <div>
            <label className="text-[10px] font-mono text-[#888888] block mb-2">WARMUP PROVIDER</label>
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={`p-3 border text-left transition-colors ${
                    provider === p.id
                      ? 'border-[#a855f7] bg-[#a855f70a]'
                      : 'border-[#2a2a2a] hover:border-[#888888]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[#f0f0f0] text-xs font-mono">{p.name}</p>
                    {p.free && (
                      <span className="text-[10px] font-mono text-[#22c55e] border border-[#22c55e] px-1.5 py-0.5">FREE</span>
                    )}
                  </div>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-[10px] font-mono text-[#888888] hover:text-[#a855f7] underline mt-1 block"
                  >
                    {p.url.replace('https://', '')} →
                  </a>
                </button>
              ))}
            </div>
            <p className="text-[#444444] text-xs font-mono mt-2">
              Pitch OS tracks your warmup progress but does not control the warmup provider directly.
              Connect your inbox to the provider's dashboard separately.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleStart}
              disabled={submitting || !inboxEmail.includes('@')}
              className="px-4 py-2 text-xs font-mono border border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e] hover:text-black disabled:opacity-30 transition-colors"
            >
              {submitting ? 'Starting…' : '⟳ Start Warmup Tracking'}
            </button>
            <button
              onClick={() => setShowSetup(false)}
              className="px-4 py-2 text-xs font-mono border border-[#2a2a2a] text-[#888888] hover:text-[#f0f0f0] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Ramp schedule */}
      <div>
        <p className="text-[10px] font-mono text-[#888888] mb-3 tracking-widest">WARMUP RAMP SCHEDULE</p>
        <div className="border border-[#2a2a2a] divide-y divide-[#2a2a2a]">
          {data.schedule.map((stage, i) => {
            const isCurrentStage = !stage.done && (i === 0 || data.schedule[i - 1]?.done)
            return (
              <div
                key={stage.range}
                className={`flex items-center gap-4 px-4 py-3 ${
                  isCurrentStage ? 'bg-[#1a1a1a]' : 'bg-[#111111]'
                }`}
              >
                <div className="w-4 text-center">
                  {stage.done ? (
                    <span className="text-[#22c55e] text-xs">✓</span>
                  ) : isCurrentStage ? (
                    <span className="text-[#eab308] text-xs">→</span>
                  ) : (
                    <span className="text-[#2a2a2a] text-xs">○</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-xs font-mono ${stage.done ? 'text-[#888888]' : isCurrentStage ? 'text-[#f0f0f0]' : 'text-[#444444]'}`}>
                      {stage.range}
                    </p>
                    {isCurrentStage && (
                      <span className="text-[10px] font-mono text-[#eab308] border border-[#eab308] px-1.5 py-0.5">CURRENT</span>
                    )}
                  </div>
                  <p className="text-[#444444] text-xs">{stage.description}</p>
                </div>
                <p className={`text-xs font-mono ${stage.done ? 'text-[#888888]' : isCurrentStage ? 'text-[#22c55e]' : 'text-[#444444]'}`}>
                  {stage.target}/day
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Readiness gate notice */}
      {!data.is_ready && (
        <div className="border border-[#eab30844] bg-[#eab3080a] p-4">
          <p className="text-[#eab308] text-xs font-mono font-medium mb-1">⚠ Domain not yet ready</p>
          <p className="text-[#888888] text-xs">
            Campaign sending is available regardless of warmup status, but sending bulk cold emails
            from a cold domain risks deliverability and spam classification.
            Complete 30 days of warmup for best results.
          </p>
        </div>
      )}

      {data.is_ready && (
        <div className="border border-[#22c55e44] bg-[#22c55e0a] p-4">
          <p className="text-[#22c55e] text-xs font-mono font-medium">✓ Domain ready for campaigns</p>
          <p className="text-[#888888] text-xs mt-1">
            Your domain has completed the warmup ramp. Keep the warmup running in the background
            to maintain your sender reputation.
          </p>
        </div>
      )}
    </div>
  )
}
