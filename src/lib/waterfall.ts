// src/lib/waterfall.ts
// Waterfall email-finding engine with configurable timeouts & confidence thresholds

export type FinderService =
  | 'apollo'
  | 'rocketreach'
  | 'hunter'
  | 'skrapp'
  | 'prospeo'
  | 'getprospect'
  | 'contactout'
  | 'wiza'
  | 'signalhire'
  | 'aeroleads'
  | 'pattern'
  | 'none'

export type FinderResult = {
  email: string | null
  confidence: number // 0-100
  source: FinderService
  attempts?: string[] // list of patterns tried (for debugging)
}

export type FinderOptions = {
  firstName: string
  lastName: string
  company: string
  domain?: string // optional domain hint
  role?: string   // optional role hint
  linkedinUrl?: string
}

// Generic HTTP helper with timeout
async function fetchWithTimeout(url: string, init: RequestInit, timeout = 8000): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    clearTimeout(id)
    return res
  } catch (err) {
    clearTimeout(id)
    throw err
  }
}

// -------------------------------- Apollo --------------------------------
async function findApollo(opts: FinderOptions, apiKey: string): Promise<FinderResult> {
  try {
    const q = new URLSearchParams({
      api_key: apiKey,
      first_name: opts.firstName,
      last_name: opts.lastName,
      organization_name: opts.company,
    })
    const res = await fetchWithTimeout(`https://api.apollo.io/v1/people/search?${q}`, {})
    if (!res.ok) return { email: null, confidence: 0, source: 'apollo' }
    const d = (await res.json()) as { people?: { email?: string }[] }
    const email = d.people?.[0]?.email
    if (!email) return { email: null, confidence: 0, source: 'apollo' }
    return { email, confidence: 85, source: 'apollo' }
  } catch {
    return { email: null, confidence: 0, source: 'apollo' }
  }
}

// -------------------------------- RocketReach --------------------------------
async function findRocketReach(opts: FinderOptions, apiKey: string): Promise<FinderResult> {
  try {
    const res = await fetchWithTimeout(
      'https://api.rocketreach.co/v2/api/lookupProfile',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Api_Key: apiKey },
        body: JSON.stringify({ name: `${opts.firstName} ${opts.lastName}`, company: opts.company }),
      }
    )
    if (!res.ok) return { email: null, confidence: 0, source: 'rocketreach' }
    const d = (await res.json()) as { email?: string }
    if (!d.email) return { email: null, confidence: 0, source: 'rocketreach' }
    return { email: d.email, confidence: 80, source: 'rocketreach' }
  } catch {
    return { email: null, confidence: 0, source: 'rocketreach' }
  }
}

// -------------------------------- Hunter.io --------------------------------
async function findHunter(opts: FinderOptions, apiKey: string): Promise<FinderResult> {
  try {
    const q = new URLSearchParams({
      api_key: apiKey,
      first: opts.firstName,
      last: opts.lastName,
      company: opts.company,
    })
    const res = await fetchWithTimeout(`https://api.hunter.io/v2/email-finder?${q}`, {})
    if (!res.ok) return { email: null, confidence: 0, source: 'hunter' }
    const d = (await res.json()) as { data?: { email?: string; score?: number } }
    const email = d.data?.email
    if (!email) return { email: null, confidence: 0, source: 'hunter' }
    return { email, confidence: Math.round((d.data?.score ?? 0) * 100), source: 'hunter' }
  } catch {
    return { email: null, confidence: 0, source: 'hunter' }
  }
}

// -------------------------------- Skrapp --------------------------------
async function findSkrapp(opts: FinderOptions, apiKey: string): Promise<FinderResult> {
  try {
    const res = await fetchWithTimeout(
      'https://api.skrapp.io/api/v2/findemail',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Access-Key': apiKey },
        body: JSON.stringify({ first_name: opts.firstName, last_name: opts.lastName, company: opts.company }),
      }
    )
    if (!res.ok) return { email: null, confidence: 0, source: 'skrapp' }
    const d = (await res.json()) as { email?: string }
    if (!d.email) return { email: null, confidence: 0, source: 'skrapp' }
    return { email: d.email, confidence: 75, source: 'skrapp' }
  } catch {
    return { email: null, confidence: 0, source: 'skrapp' }
  }
}

// Fallback pattern generator (used when no service returns a hit)
function generatePatterns(opts: FinderOptions): string[] {
  const domain = opts.domain?.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  if (!domain) return []
  const cleanFirst = opts.firstName.toLowerCase().replace(/[^a-z]/g, '')
  const cleanLast = opts.lastName.toLowerCase().replace(/[^a-z]/g, '')
  const firstInitial = cleanFirst[0]
  const lastInitial = cleanLast[0]
  return [
    `${cleanFirst}@${domain}`,
    `${cleanLast}@${domain}`,
    `${cleanFirst}.${cleanLast}@${domain}`,
    `${firstInitial}${cleanLast}@${domain}`,
    `${cleanFirst}${lastInitial}@${domain}`,
    `${firstInitial}.${cleanLast}@${domain}`,
    `${cleanFirst}.${lastInitial}@${domain}`,
  ]
}

// -------------------------------- Main waterfall --------------------------------
export async function waterfallFind(
  opts: FinderOptions,
  keys: Record<FinderService, string | undefined>,
  stopAtConfidence = 80
): Promise<FinderResult & { attempts: string[] }> {
  const attempts: string[] = []
  const services: Array<{ fn: (o: FinderOptions, k: string) => Promise<FinderResult>; key?: string }> = [
    { fn: findApollo, key: keys.apollo },
    { fn: findRocketReach, key: keys.rocketreach },
    { fn: findHunter, key: keys.hunter },
    { fn: findSkrapp, key: keys.skrapp },
  ]

  for (const svc of services) {
    if (!svc.key) {
      attempts.push(`${svc.fn.name.replace('find', '').toLowerCase()} (no key)`)
      continue
    }
    attempts.push(svc.fn.name.replace('find', '').toLowerCase())
    const res = await svc.fn(opts, svc.key)
    if (res.email && res.confidence >= stopAtConfidence) {
      return { ...res, attempts }
    }
    if (res.email) {
      // keep going but remember this as a fallback
    }
  }

  // No service hit — try fallback patterns
  const patterns = generatePatterns(opts)
  attempts.push(...patterns)
  if (patterns.length > 0) {
    return { email: null, confidence: 0, source: 'pattern', attempts }
  }

  return { email: null, confidence: 0, source: 'none', attempts }
}