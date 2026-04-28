// src/lib/csv.ts
// Tiny, zero-dependency CSV parser / serializer that tolerates Excel quirks

export function parseCSV(text: string): string[][] {
  const lines: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  let i = 0

  function flushCell() {
    row.push(cell.trim())
    cell = ''
  }

  function flushRow() {
    if (row.length > 0 || cell.trim()) {
      flushCell()
      lines.push(row)
      row = []
    }
  }

  while (i < text.length) {
    const char = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          cell += '"'
          i += 2
          continue
        } else {
          inQuotes = false
          i++
          continue
        }
      } else {
        cell += char
        i++
        continue
      }
    }

    if (char === '"') {
      inQuotes = true
      i++
      continue
    }

    if (char === ',') {
      flushCell()
      i++
      continue
    }

    if (char === '\r' && next === '\n') {
      flushRow()
      i += 2
      continue
    }

    if (char === '\n' || char === '\r') {
      flushRow()
      i++
      continue
    }

    cell += char
    i++
  }

  flushRow() // last row
  return lines
}

// Case-insensitive header lookup
function pick(headers: string[], ...variants: string[]): string | undefined {
  const map = new Map(headers.map((h, i) => [h.toLowerCase().trim(), i]))
  for (const v of variants) {
    const idx = map.get(v.toLowerCase())
    if (idx !== undefined) return headers[idx]
  }
  return undefined
}

export function normalizeRow(raw: string[]): {
  firstName: string
  lastName: string
  company: string
  domain?: string
  role?: string
  error?: string
} {
  if (raw.length === 0) return { firstName: '', lastName: '', company: '', error: 'Empty row' }

  // Detect header row (skip if all cells are alphabetic)
  const isHeader = raw.every(c => /^[a-zA-Z\s]+$/.test(c.trim()))
  if (isHeader) return { firstName: '', lastName: '', company: '', error: 'Header row' }

  const headers = raw.map(c => c.trim())

  // Try to find columns by common names
  const firstNameCol = pick(headers, 'first_name', 'firstname', 'first name', 'fname')
  const lastNameCol = pick(headers, 'last_name', 'lastname', 'last name', 'lname')
  const companyCol = pick(headers, 'company', 'organization', 'org')
  const domainCol = pick(headers, 'domain', 'website', 'company_domain')
  const roleCol = pick(headers, 'role', 'title', 'position', 'job_title')

  // If we found named columns, use them
  if (firstNameCol && lastNameCol && companyCol) {
    const firstNameIdx = headers.indexOf(firstNameCol)
    const lastNameIdx = headers.indexOf(lastNameCol)
    const companyIdx = headers.indexOf(companyCol)
    const domainIdx = domainCol ? headers.indexOf(domainCol) : -1
    const roleIdx = roleCol ? headers.indexOf(roleCol) : -1

    return {
      firstName: raw[firstNameIdx] || '',
      lastName: raw[lastNameIdx] || '',
      company: raw[companyIdx] || '',
      domain: domainIdx >= 0 ? raw[domainIdx] : undefined,
      role: roleIdx >= 0 ? raw[roleIdx] : undefined,
    }
  }

  // Fallback: assume first 3 columns are firstName, lastName, company
  return {
    firstName: raw[0] || '',
    lastName: raw[1] || '',
    company: raw[2] || '',
    domain: raw[3] || undefined,
    role: raw[4] || undefined,
  }
}

export function toCSV(rows: Record<string, any>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (s: any) => {
    const str = String(s ?? '')
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"'
    }
    return str
  }
  const lines = [
    headers.join(','),
    ...rows.map(row => headers.map(h => escape(row[h])).join(',')),
  ]
  return lines.join('\n')
}