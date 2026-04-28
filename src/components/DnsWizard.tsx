// src/components/DnsWizard.tsx
import { useState } from 'react'

type ProviderConfig = {
  id: string
  name: string
  spfInclude: string
  dkimNote: string
  dkimInstructions: string
}

type DNSCheckResult = {
  domain: string
  allValid: boolean
  checkedAt: string
  spf:  { valid: boolean; record: string | null; details: string }
  dkim: { valid: boolean; record: string | null; details: string }
  dmarc:{ valid: boolean; record: string | null; details: string; policy: string }
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'resend',
    name: 'Resend',
    spfInclude: 'include:amazonses.com',
    dkimNote: 'Resend provides 3 CNAME records in your dashboard under Domains.',
    dkimInstructions: 'Go to resend.com/domains → Add Domain → copy the 3 CNAME records shown.',
  },
  {
    id: 'brevo',
    name: 'Brevo',
    spfInclude: 'include:spf.sendinblue.com',
    dkimNote: 'Brevo provides a TXT record for DKIM in Senders & IP → Dedicated IPs or Senders.',
    dkimInstructions: 'Go to Brevo Settings → Senders & IP → Add a sender domain → copy the TXT record.',
  },
  {
    id: 'mailersend',
    name: 'MailerSend',
    spfInclude: 'include:_spf.mailersend.com',
    dkimNote: 'MailerSend generates DKIM keys in Domains → your domain → DNS records.',
    dkimInstructions: 'Go to mailersend.com → Domains → Add Domain → copy the TXT/CNAME records.',
  },
  {
    id: 'mailgun',
    name: 'Mailgun',
    spfInclude: 'include:mailgun.org',
    dkimNote: 'Mailgun provides DKIM TXT and tracking CNAME in Sending → Domains → DNS records.',
    dkimInstructions: 'Go to app.mailgun.com → Sending → Domains → your domain → DNS records tab.',
  },
  {
    id: 'postmark',
    name: 'Postmark',
    spfInclude: 'include:spf.mtasv.net',
    dkimNote: 'Postmark provides DKIM in Sender Signatures → your domain → DKIM tab.',
    dkimInstructions: 'Go to postmarkapp.com → Sender Signatures → Add Sender → copy the DKIM TXT.',
  },
]

const STEP_LABELS = ['Domain', 'Provider', 'SPF', 'DKIM', 'DMARC', 'Verify']

export default function DnsWizard() {
  const [step, setStep] = useState(0)
  const [domain, setDomain] = useState('')
  const [selectedProvider, setSelectedProvider] = useState<ProviderConfig | null>(null)
  const [checkResult, setCheckResult] = useState<DNSCheckResult | null>(null)
  const [checking, setChecking] = useState(false)

  const provider = selectedProvider

  const runCheck = async () => {
    setChecking(true)
    const res = await fetch('/api/dns/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
    })
    const d = await res.json() as DNSCheckResult
    setCheckResult(d)
    setChecking(false)
  }

  const inputCls = 'bg-[#0a0a0a] border border-[#2a2a2a] text-[#f0f0f0] text-xs font-mono px-3 py-2 outline-none focus:border-[#888888] placeholder:text-[#444444] w-full'
  const codeCls = 'bg-[#0a0a0a] border border-[#2a2a2a] p-3 font-mono text-xs text-[#a855f7] block w-full select-all'

  // Status indicator
  const StatusDot = ({ valid }: { valid: boolean | undefined }) => (
    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${valid === true ? 'bg-[#22c55e]' : valid === false ? 'bg-[#ef4444]' : 'bg-[#888888]'}`} />
  )

  return (
    <div className="max-w-2xl space-y-6">

      {/* Step progress */}
      <div className="flex items-center gap-0">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono transition-colors ${
                i === step
                  ? 'text-[#f0f0f0] bg-[#1a1a1a] border border-[#2a2a2a]'
                  : i < step
                  ? 'text-[#22c55e] cursor-pointer hover:text-[#f0f0f0]'
                  : 'text-[#444444] cursor-default'
              }`}
            >
              {i < step ? '✓' : <span className="text-[#888888]">{i + 1}</span>}
              {label}
            </button>
            {i < STEP_LABELS.length - 1 && (
              <div className={`w-4 h-px ${i < step ? 'bg-[#22c55e]' : 'bg-[#2a2a2a]'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 0: Domain ── */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <p className="text-[#f0f0f0] text-sm font-sans mb-1">Enter your sender domain</p>
            <p className="text-[#888888] text-xs mb-4">
              This is the domain you bought for outreach — e.g. <code className="text-[#a855f7]">yourname-careers.com</code>.
              Never use your main personal or company domain.
            </p>
            <label className="text-[10px] font-mono text-[#888888] block mb-1">DOMAIN</label>
            <input
              className={inputCls}
              placeholder="yourname-careers.com"
              value={domain}
              onChange={e => setDomain(e.target.value.toLowerCase().trim())}
              onKeyDown={e => e.key === 'Enter' && domain.includes('.') && setStep(1)}
            />
          </div>

          <div className="border border-[#eab30844] bg-[#eab3080a] p-3">
            <p className="text-[#eab308] text-xs font-mono mb-1">⚠ Use a burner domain</p>
            <p className="text-[#888888] text-xs">
              Buy a secondary domain (~$10/yr on Namecheap or Cloudflare) like{' '}
              <code className="text-[#a855f7]">yourname-jobs.com</code>. If this domain gets
              blacklisted from over-sending, your main domain stays clean.
            </p>
          </div>

          <button
            onClick={() => setStep(1)}
            disabled={!domain.includes('.')}
            className="px-4 py-2 text-xs font-mono border border-[#a855f7] text-[#a855f7] hover:bg-[#a855f7] hover:text-white disabled:opacity-30 transition-colors"
          >
            Next → Choose Provider
          </button>
        </div>
      )}

      {/* ── Step 1: Provider ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <p className="text-[#f0f0f0] text-sm font-sans mb-1">Select your sending provider</p>
            <p className="text-[#888888] text-xs mb-4">
              Each provider requires different DNS records. We'll show you exactly what to add.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {PROVIDERS.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProvider(p)}
                className={`p-3 border text-left transition-colors ${
                  selectedProvider?.id === p.id
                    ? 'border-[#a855f7] bg-[#a855f70a]'
                    : 'border-[#2a2a2a] bg-[#111111] hover:border-[#888888]'
                }`}
              >
                <p className="text-[#f0f0f0] text-xs font-mono">{p.name}</p>
                <p className="text-[#444444] text-xs font-mono mt-0.5">SPF: {p.spfInclude}</p>
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(0)} className="px-4 py-2 text-xs font-mono border border-[#2a2a2a] text-[#888888] hover:text-[#f0f0f0] transition-colors">← Back</button>
            <button
              onClick={() => setStep(2)}
              disabled={!selectedProvider}
              className="px-4 py-2 text-xs font-mono border border-[#a855f7] text-[#a855f7] hover:bg-[#a855f7] hover:text-white disabled:opacity-30 transition-colors"
            >
              Next → SPF Setup
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: SPF ── */}
      {step === 2 && provider && (
        <div className="space-y-4">
          <div>
            <p className="text-[#f0f0f0] text-sm font-sans mb-1">Add SPF Record</p>
            <p className="text-[#888888] text-xs mb-4">
              SPF tells the world that {provider.name} is authorised to send email on behalf of{' '}
              <code className="text-[#a855f7]">{domain}</code>.
              Add this TXT record to your domain's DNS (Cloudflare, Namecheap, GoDaddy, etc.).
            </p>
          </div>

          <div className="border border-[#2a2a2a] bg-[#0a0a0a] p-4 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-[#888888]">
              <span>TYPE</span><span>NAME</span><span>VALUE</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <code className={codeCls}>TXT</code>
              <code className={codeCls}>@</code>
              <code className={`${codeCls} col-span-1`}>v=spf1 {provider.spfInclude} ~all</code>
            </div>
          </div>

          <div className="border border-[#2a2a2a] bg-[#111111] p-3">
            <p className="text-[#888888] text-xs">
              <span className="text-[#a855f7] font-mono">Note:</span> If you already have an SPF record,
              add <code className="text-[#a855f7]">{provider.spfInclude}</code> inside the existing record —
              don't create a second one. Only one SPF TXT record is allowed per domain.
            </p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="px-4 py-2 text-xs font-mono border border-[#2a2a2a] text-[#888888] hover:text-[#f0f0f0] transition-colors">← Back</button>
            <button onClick={() => setStep(3)} className="px-4 py-2 text-xs font-mono border border-[#a855f7] text-[#a855f7] hover:bg-[#a855f7] hover:text-white transition-colors">
              Next → DKIM Setup
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: DKIM ── */}
      {step === 3 && provider && (
        <div className="space-y-4">
          <div>
            <p className="text-[#f0f0f0] text-sm font-sans mb-1">Add DKIM Record</p>
            <p className="text-[#888888] text-xs mb-4">
              DKIM adds a cryptographic signature to every email, proving it wasn't tampered with in transit.
              This record comes directly from {provider.name}'s dashboard.
            </p>
          </div>

          <div className="border border-[#2a2a2a] bg-[#111111] p-4 space-y-2">
            <p className="text-[#a855f7] text-xs font-mono">{provider.dkimNote}</p>
            <p className="text-[#888888] text-xs">{provider.dkimInstructions}</p>
          </div>

          <div className="border border-[#2a2a2a] bg-[#0a0a0a] p-4">
            <p className="text-[10px] font-mono text-[#888888] mb-2">TYPICAL DKIM RECORD FORMAT</p>
            <code className="text-[#a855f7] text-xs font-mono block">
              {`[selector]._domainkey.${domain}`}<br />
              TYPE: TXT (or CNAME for Resend/MailerSend)<br />
              VALUE: v=DKIM1; k=rsa; p=[long public key from provider]
            </code>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="px-4 py-2 text-xs font-mono border border-[#2a2a2a] text-[#888888] hover:text-[#f0f0f0] transition-colors">← Back</button>
            <button onClick={() => setStep(4)} className="px-4 py-2 text-xs font-mono border border-[#a855f7] text-[#a855f7] hover:bg-[#a855f7] hover:text-white transition-colors">
              Next → DMARC Setup
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: DMARC ── */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <p className="text-[#f0f0f0] text-sm font-sans mb-1">Add DMARC Record</p>
            <p className="text-[#888888] text-xs mb-4">
              DMARC tells receiving mail servers what to do if SPF and DKIM fail.
              As of 2024, Gmail and Yahoo <strong className="text-[#f0f0f0]">reject emails without DMARC</strong>.
              This is mandatory.
            </p>
          </div>

          <div className="border border-[#2a2a2a] bg-[#0a0a0a] p-4 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-[#888888]">
              <span>TYPE</span><span>NAME</span><span>VALUE</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <code className={codeCls}>TXT</code>
              <code className={codeCls}>_dmarc</code>
              <code className={`${codeCls} text-[10px]`}>
                {`v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}; pct=100`}
              </code>
            </div>
          </div>

          <div className="border border-[#2a2a2a] bg-[#111111] p-3 space-y-2 text-xs font-mono text-[#888888]">
            <p><span className="text-[#f0f0f0]">p=quarantine</span> — failed emails go to spam (safer than p=reject to start)</p>
            <p><span className="text-[#f0f0f0]">rua=</span> — where DMARC aggregate reports are sent (optional but useful)</p>
            <p><span className="text-[#f0f0f0]">pct=100</span> — apply policy to 100% of emails</p>
            <p className="text-[#444444] pt-1">After 30 days without issues, upgrade to p=reject for maximum trust.</p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(3)} className="px-4 py-2 text-xs font-mono border border-[#2a2a2a] text-[#888888] hover:text-[#f0f0f0] transition-colors">← Back</button>
            <button onClick={() => setStep(5)} className="px-4 py-2 text-xs font-mono border border-[#a855f7] text-[#a855f7] hover:bg-[#a855f7] hover:text-white transition-colors">
              Next → Verify DNS
            </button>
          </div>
        </div>
      )}

      {/* ── Step 5: Verify ── */}
      {step === 5 && (
        <div className="space-y-4">
          <div>
            <p className="text-[#f0f0f0] text-sm font-sans mb-1">Verify DNS Records</p>
            <p className="text-[#888888] text-xs mb-4">
              DNS propagation can take up to 48 hours. Run this check after adding your records.
              Once all three show green, your domain is ready to send.
            </p>
          </div>

          <div className="border border-[#2a2a2a] bg-[#111111] p-3 flex items-center gap-2">
            <code className="text-[#a855f7] text-xs font-mono flex-1">{domain}</code>
            <button
              onClick={runCheck}
              disabled={checking}
              className="px-4 py-2 text-xs font-mono border border-[#2a2a2a] text-[#f0f0f0] hover:bg-[#1a1a1a] disabled:opacity-30 transition-colors"
            >
              {checking ? 'Checking…' : '⚡ Run DNS Check'}
            </button>
          </div>

          {checkResult && (
            <div className="border border-[#2a2a2a] divide-y divide-[#2a2a2a]">
              {[
                { key: 'spf',   label: 'SPF',   data: checkResult.spf },
                { key: 'dkim',  label: 'DKIM',  data: checkResult.dkim },
                { key: 'dmarc', label: 'DMARC', data: checkResult.dmarc },
              ].map(({ label, data }) => (
                <div key={label} className="p-4 bg-[#111111]">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusDot valid={data.valid} />
                    <p className="text-[#f0f0f0] text-xs font-mono">{label}</p>
                    <span className={`text-[10px] font-mono ml-auto ${data.valid ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                      {data.valid ? '✓ VALID' : '✕ MISSING / INVALID'}
                    </span>
                  </div>
                  <p className="text-[#888888] text-xs ml-4">{data.details}</p>
                  {data.record && (
                    <code className="text-[#444444] text-[10px] font-mono ml-4 block mt-1 break-all">
                      {data.record}
                    </code>
                  )}
                </div>
              ))}

              <div className={`p-4 ${checkResult.allValid ? 'bg-[#22c55e0a]' : 'bg-[#ef44440a]'}`}>
                <p className={`text-xs font-mono font-medium ${checkResult.allValid ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {checkResult.allValid
                    ? '✓ All DNS records valid — domain is ready to send'
                    : '✕ Some records missing — fix them and re-run check'}
                </p>
                <p className="text-[#888888] text-xs mt-1">
                  Checked at {new Date(checkResult.checkedAt).toLocaleTimeString()}.
                  DNS changes can take up to 48 hours to propagate.
                </p>
              </div>
            </div>
          )}

          <button onClick={() => setStep(4)} className="px-4 py-2 text-xs font-mono border border-[#2a2a2a] text-[#888888] hover:text-[#f0f0f0] transition-colors">← Back</button>
        </div>
      )}
    </div>
  )
}
