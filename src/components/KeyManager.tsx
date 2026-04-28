// src/components/KeyManager.tsx
import { useState, useEffect } from 'react'

type ServiceGroup = {
  label: string
  color: string
  services: { id: string; name: string; docsUrl: string; placeholder: string }[]
}

const SERVICE_GROUPS: ServiceGroup[] = [
  {
    label: 'Email Finders',
    color: '#a855f7',
    services: [
      { id: 'apollo',      name: 'Apollo.io',    docsUrl: 'https://apolloio.github.io/apollo-api-docs/', placeholder: 'Your Apollo API key' },
      { id: 'hunter',      name: 'Hunter.io',    docsUrl: 'https://hunter.io/api-documentation/v2', placeholder: 'Your Hunter API key' },
      { id: 'rocketreach', name: 'RocketReach',  docsUrl: 'https://rocketreach.co/api', placeholder: 'Your RocketReach API key' },
      { id: 'skrapp',      name: 'Skrapp.io',    docsUrl: 'https://skrapp.io/api', placeholder: 'Your Skrapp API key' },
      { id: 'prospeo',     name: 'Prospeo',      docsUrl: 'https://prospeo.io/api', placeholder: 'Your Prospeo API key' },
      { id: 'wiza',        name: 'Wiza',         docsUrl: 'https://wiza.co/api-docs', placeholder: 'Your Wiza API key' },
      { id: 'signalhire',  name: 'SignalHire',   docsUrl: 'https://www.signalhire.com/api', placeholder: 'Your SignalHire API key' },
      { id: 'aeroleads',   name: 'AeroLeads',    docsUrl: 'https://aeroleads.com/api-documentation', placeholder: 'Your AeroLeads API key' },
    ],
  },
  {
    label: 'Email Verifiers',
    color: '#22c55e',
    services: [
      { id: 'zerobounce',      name: 'ZeroBounce',      docsUrl: 'https://www.zerobounce.net/docs/', placeholder: 'Your ZeroBounce API key' },
      { id: 'neverbounce',     name: 'NeverBounce',     docsUrl: 'https://docs.neverbounce.com/', placeholder: 'Your NeverBounce API key' },
      { id: 'millionverifier', name: 'MillionVerifier', docsUrl: 'https://www.millionverifier.com/api', placeholder: 'Your MillionVerifier API key' },
      { id: 'debounce',        name: 'DeBounce',        docsUrl: 'https://debounce.io/api/', placeholder: 'Your DeBounce API key' },
      { id: 'emailable',       name: 'Emailable',       docsUrl: 'https://emailable.com/docs/api/', placeholder: 'Your Emailable API key' },
    ],
  },
  {
    label: 'Email Senders',
    color: '#3b82f6',
    services: [
      { id: 'resend',      name: 'Resend',      docsUrl: 'https://resend.com/docs/api-reference/introduction', placeholder: 're_xxxxxxxxxxxx' },
      { id: 'brevo',       name: 'Brevo',       docsUrl: 'https://developers.brevo.com/', placeholder: 'xkeysib-xxxxxxxxxxxx' },
      { id: 'mailersend',  name: 'MailerSend',  docsUrl: 'https://developers.mailersend.com/', placeholder: 'Your MailerSend API key' },
      { id: 'postmark',    name: 'Postmark',    docsUrl: 'https://postmarkapp.com/developer', placeholder: 'Your Postmark server token' },
      { id: 'mailgun',     name: 'Mailgun',     docsUrl: 'https://documentation.mailgun.com/en/latest/', placeholder: 'key-xxxxxxxxxxxx' },
    ],
  },
  {
    label: 'Warmup',
    color: '#eab308',
    services: [
      { id: 'mails_ai',    name: 'Mails.ai',    docsUrl: 'https://mails.ai', placeholder: 'Your Mails.ai API key' },
      { id: 'trulyinbox',  name: 'TrulyInbox',  docsUrl: 'https://trulyinbox.com', placeholder: 'Your TrulyInbox API key' },
    ],
  },
  {
    label: 'AI Personalization',
    color: '#f97316',
    services: [
      { id: 'openai', name: 'OpenAI', docsUrl: 'https://platform.openai.com/api-keys', placeholder: 'sk-xxxxxxxxxxxx' },
    ],
  },
]

type SavedKey = { service: string; savedAt: string | null }
type KeyStatus = 'idle' | 'saving' | 'saved' | 'testing' | 'ok' | 'error' | 'deleting'

export default function KeyManager() {
  const [savedKeys, setSavedKeys] = useState<SavedKey[]>([])
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [statuses, setStatuses] = useState<Record<string, KeyStatus>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/keys/list')
      .then(r => r.json())
      .then((d: any) => {
        setSavedKeys(d.keys)
        setLoading(false)
      })
  }, [])

  const hasSaved = (service: string) => savedKeys.some(k => k.service === service)

  const setStatus = (service: string, status: KeyStatus) =>
    setStatuses(s => ({ ...s, [service]: status }))

  const handleSave = async (service: string) => {
    const key = inputs[service]?.trim()
    if (!key) return
    setStatus(service, 'saving')
    const res = await fetch('/api/keys/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service, key }),
    })
    if (res.ok) {
      setSavedKeys(prev => [
        ...prev.filter(k => k.service !== service),
        { service, savedAt: new Date().toISOString() },
      ])
      setInputs(i => ({ ...i, [service]: '' }))
      setStatus(service, 'saved')
      setTimeout(() => setStatus(service, 'idle'), 2000)
    } else {
      setStatus(service, 'error')
    }
  }

  const handleTest = async (service: string) => {
    setStatus(service, 'testing')
    const res = await fetch('/api/keys/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service }),
    })
    const d = await res.json() as { ok: boolean }
    setStatus(service, d.ok ? 'ok' : 'error')
    setTimeout(() => setStatus(service, 'idle'), 3000)
  }

  const handleDelete = async (service: string) => {
    if (!confirm(`Remove ${service} API key?`)) return
    setStatus(service, 'deleting')
    await fetch('/api/keys/save', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service }),
    })
    setSavedKeys(prev => prev.filter(k => k.service !== service))
    setStatus(service, 'idle')
  }

  const statusLabel = (service: string) => {
    const s = statuses[service]
    if (s === 'saving')   return <span className="text-secondary font-mono text-xs">saving…</span>
    if (s === 'saved')    return <span className="text-[#22c55e] font-mono text-xs">✓ saved</span>
    if (s === 'testing')  return <span className="text-secondary font-mono text-xs">testing…</span>
    if (s === 'ok')       return <span className="text-[#22c55e] font-mono text-xs">✓ working</span>
    if (s === 'error')    return <span className="text-[#ef4444] font-mono text-xs">✕ failed</span>
    if (s === 'deleting') return <span className="text-secondary font-mono text-xs">removing…</span>
    return null
  }

  if (loading) {
    return <div className="text-secondary text-xs font-mono animate-pulse">Loading keys…</div>
  }

  return (
    <div className="space-y-8 max-w-3xl">

      {/* Security notice */}
      <div className="border border-[#2a2a2a] bg-[#111111] p-4 text-xs font-mono">
        <p className="text-[#22c55e] mb-1">⚿ AES-256-GCM encrypted</p>
        <p className="text-[#888888]">
          Keys are encrypted with a key derived from your user ID before storage.
          They are never logged, never returned to the client, and decrypted only
          inside the Cloudflare Worker at request time.
        </p>
      </div>

      {SERVICE_GROUPS.map(group => (
        <div key={group.label}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{ background: group.color }} />
            <h2 className="text-xs font-mono tracking-widest uppercase" style={{ color: group.color }}>
              {group.label}
            </h2>
          </div>

          <div className="border border-[#2a2a2a] divide-y divide-[#2a2a2a]">
            {group.services.map(svc => {
              const saved = hasSaved(svc.id)
              return (
                <div key={svc.id} className="p-4 bg-[#111111]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[#f0f0f0] text-sm">{svc.name}</span>
                      {saved && (
                        <span className="text-[10px] border border-[#22c55e] text-[#22c55e] px-1.5 py-0.5 font-mono">
                          CONNECTED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {statusLabel(svc.id)}
                      <a
                        href={svc.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-[#888888] hover:text-[#f0f0f0] font-mono underline"
                      >
                        Get key →
                      </a>
                    </div>
                  </div>

                  {!saved ? (
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder={svc.placeholder}
                        value={inputs[svc.id] || ''}
                        onChange={e => setInputs(i => ({ ...i, [svc.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleSave(svc.id)}
                        className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] text-[#f0f0f0] text-xs font-mono px-3 py-2 outline-none focus:border-[#888888] placeholder:text-[#444444]"
                      />
                      <button
                        onClick={() => handleSave(svc.id)}
                        disabled={!inputs[svc.id]?.trim()}
                        className="px-3 py-2 text-xs font-mono border border-[#2a2a2a] text-[#f0f0f0] hover:bg-[#1a1a1a] disabled:opacity-30 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] px-3 py-2 text-xs font-mono text-[#444444]">
                        ••••••••••••••••••••••••••••••••
                      </div>
                      <button
                        onClick={() => handleTest(svc.id)}
                        className="px-3 py-2 text-xs font-mono border border-[#2a2a2a] text-[#888888] hover:text-[#f0f0f0] hover:bg-[#1a1a1a] transition-colors"
                      >
                        Test
                      </button>
                      <button
                        onClick={() => handleDelete(svc.id)}
                        className="px-3 py-2 text-xs font-mono border border-[#2a2a2a] text-[#ef4444] hover:bg-[#ef4444] hover:text-white transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}