// src/components/DashboardWidgets.tsx
import { useState, useEffect } from 'react'

type DashboardStats = {
  emailsFound: number
  emailsVerified: number
  campaignsSent: number
  dbContributed: number
  todaySent: number
  activeCampaigns: Array<{
    id: string
    name: string
    status: string
    sent_count: number
    target_count: number
  }>
  recentActivity: Array<{
    id: string
    recipient_email: string
    status: string
    sent_via: string
    sent_at: string
    campaign_name: string
  }>
  warmup: {
    status: string
    current_daily_volume: number
    target_daily_volume: number
    days_active: number
  } | null
  dnsChecks: Array<{
    domain: string
    spf_valid: number
    dkim_valid: number
    dmarc_valid: number
  }>
}

const STATUS_COLORS: Record<string, string> = {
  running: '#22c55e',
  paused: '#eab308',
  draft: '#888888',
  completed: '#3b82f6',
  suspended_bounce: '#ef4444',
}

export default function DashboardWidgets() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json() as Promise<DashboardStats>)
      .then((d: DashboardStats) => {
        setStats(d)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="border border-[var(--border)] p-4 bg-[var(--bg-surface)] animate-pulse">
              <div className="h-3 w-16 bg-[#2a2a2a] mb-2" />
              <div className="h-6 w-12 bg-[#2a2a2a]" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return <p className="text-[#ef4444] text-xs font-mono">Failed to load dashboard stats.</p>
  }

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="border border-[var(--border)] p-4 bg-[var(--bg-surface)]">
          <p className="text-secondary text-xs font-mono mb-1">Emails Found</p>
          <p className="text-2xl text-primary font-mono">{stats.emailsFound.toLocaleString()}</p>
        </div>
        <div className="border border-[var(--border)] p-4 bg-[var(--bg-surface)]">
          <p className="text-secondary text-xs font-mono mb-1">Verified</p>
          <p className="text-2xl text-primary font-mono">{stats.emailsVerified.toLocaleString()}</p>
        </div>
        <div className="border border-[var(--border)] p-4 bg-[var(--bg-surface)]">
          <p className="text-secondary text-xs font-mono mb-1">Campaigns Sent</p>
          <p className="text-2xl text-primary font-mono">{stats.campaignsSent.toLocaleString()}</p>
        </div>
        <div className="border border-[var(--border)] p-4 bg-[var(--bg-surface)]">
          <p className="text-secondary text-xs font-mono mb-1">DB Contributed</p>
          <p className="text-2xl text-primary font-mono">{stats.dbContributed.toLocaleString()}</p>
        </div>
      </div>

      {/* Today's sends + Warmup status */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="border border-[var(--border)] p-4 bg-[var(--bg-surface)]">
          <p className="text-secondary text-xs font-mono mb-2">Today's Sends</p>
          <p className="text-3xl text-primary font-mono">{stats.todaySent}</p>
          {stats.todaySent > 0 && (
            <p className="text-[#22c55e] text-[10px] font-mono mt-1">✓ Sending active</p>
          )}
          {stats.todaySent === 0 && (
            <p className="text-[#888888] text-[10px] font-mono mt-1">No sends yet today</p>
          )}
        </div>

        <div className="border border-[var(--border)] p-4 bg-[var(--bg-surface)]">
          <p className="text-secondary text-xs font-mono mb-2">Warmup Status</p>
          {stats.warmup ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 border"
                  style={{
                    color: stats.warmup.status === 'ready' ? '#22c55e' : stats.warmup.status === 'warming' ? '#eab308' : '#888888',
                    borderColor: stats.warmup.status === 'ready' ? '#22c55e' : stats.warmup.status === 'warming' ? '#eab308' : '#888888',
                  }}
                >
                  {stats.warmup.status.toUpperCase()}
                </span>
                <span className="text-primary text-xs font-mono">
                  {stats.warmup.current_daily_volume}/{stats.warmup.target_daily_volume} vol
                </span>
              </div>
              <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.round((stats.warmup.current_daily_volume / stats.warmup.target_daily_volume) * 100))}%`,
                    background: stats.warmup.status === 'ready' ? '#22c55e' : '#eab308',
                  }}
                />
              </div>
              <p className="text-[#444444] text-[10px] font-mono mt-1">{stats.warmup.days_active} days active</p>
            </>
          ) : (
            <p className="text-[#888888] text-xs font-mono">Not configured</p>
          )}
        </div>
      </div>

      {/* Active campaigns */}
      <div className="border border-[var(--border)] p-4 bg-[var(--bg-surface)]">
        <p className="text-secondary text-xs font-mono mb-3">Active Campaigns</p>
        {stats.activeCampaigns.length === 0 ? (
          <p className="text-[#444444] text-xs font-mono">No active campaigns. Create one in /campaigns.</p>
        ) : (
          <div className="space-y-2">
            {stats.activeCampaigns.map(c => (
              <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-[#2a2a2a] last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-primary text-xs font-mono">{c.name}</span>
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: STATUS_COLORS[c.status] ?? '#888888' }}
                  >
                    {c.status}
                  </span>
                </div>
                <span className="text-[#888888] text-[10px] font-mono">
                  {c.sent_count}/{c.target_count} sent
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent activity */}
      <div className="border border-[var(--border)] p-4 bg-[var(--bg-surface)]">
        <p className="text-secondary text-xs font-mono mb-3">Recent Activity</p>
        {stats.recentActivity.length === 0 ? (
          <p className="text-[#444444] text-xs font-mono">No activity yet. Start sending in /campaigns.</p>
        ) : (
          <div className="divide-y divide-[#2a2a2a]">
            {stats.recentActivity.map(a => (
              <div key={a.id} className="py-2 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-primary text-xs font-mono truncate">{a.recipient_email}</p>
                  <p className="text-[#888888] text-[10px] font-mono truncate">{a.campaign_name}</p>
                </div>
                <div className="flex items-center gap-3 ml-3">
                  <span className={`text-[10px] font-mono ${
                    a.status === 'sent' ? 'text-[#22c55e]' :
                    a.status === 'failed' ? 'text-[#ef4444]' :
                    a.status === 'opened' ? 'text-[#3b82f6]' :
                    a.status === 'replied' ? 'text-[#a855f7]' :
                    'text-[#888888]'
                  }`}>
                    {a.status}
                  </span>
                  {a.sent_via && (
                    <span className="text-[#444444] text-[10px] font-mono">{a.sent_via}</span>
                  )}
                  <span className="text-[#444444] text-[10px] font-mono whitespace-nowrap">
                    {a.sent_at ? new Date(a.sent_at).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DNS checks */}
      {stats.dnsChecks.length > 0 && (
        <div className="border border-[var(--border)] p-4 bg-[var(--bg-surface)]">
          <p className="text-secondary text-xs font-mono mb-3">DNS Status</p>
          <div className="space-y-2">
            {stats.dnsChecks.map(d => (
              <div key={d.domain} className="flex items-center justify-between">
                <span className="text-primary text-xs font-mono">{d.domain}</span>
                <div className="flex gap-2">
                  <span className={`text-[10px] font-mono ${d.spf_valid ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                    SPF:{d.spf_valid ? '✓' : '✕'}
                  </span>
                  <span className={`text-[10px] font-mono ${d.dkim_valid ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                    DKIM:{d.dkim_valid ? '✓' : '✕'}
                  </span>
                  <span className={`text-[10px] font-mono ${d.dmarc_valid ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                    DMARC:{d.dmarc_valid ? '✓' : '✕'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
