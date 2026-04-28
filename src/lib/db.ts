// src/lib/db.ts

export async function dbGet<T>(
  db: D1Database,
  query: string,
  params: unknown[] = []
): Promise<T | null> {
  const stmt = db.prepare(query)
  const bound = params.length ? stmt.bind(...params) : stmt
  return bound.first<T>()
}

export async function dbAll<T>(
  db: D1Database,
  query: string,
  params: unknown[] = []
): Promise<T[]> {
  const stmt = db.prepare(query)
  const bound = params.length ? stmt.bind(...params) : stmt
  const result = await bound.all<T>()
  return result.results
}

export async function dbRun(
  db: D1Database,
  query: string,
  params: unknown[] = []
): Promise<D1Result> {
  const stmt = db.prepare(query)
  const bound = params.length ? stmt.bind(...params) : stmt
  return bound.run()
}

// Hash helper (for community email dedup)
export async function sha256(text: string): Promise<string> {
  const buffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text.toLowerCase().trim())
  )
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}