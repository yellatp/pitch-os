interface BadgeProps {
  status: 'valid' | 'invalid' | 'risky' | 'unknown' | 'neutral'
  children: React.ReactNode
}

export default function Badge({ status, children }: BadgeProps) {
  const colors = {
    valid:   'text-[var(--accent-green)] border-[var(--accent-green)]',
    invalid: 'text-[var(--accent-red)] border-[var(--accent-red)]',
    risky:   'text-[var(--accent-yellow)] border-[var(--accent-yellow)]',
    unknown: 'text-secondary border-[var(--border)]',
    neutral: 'text-secondary border-[var(--border)]',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs border font-mono ${colors[status]}`}>
      {children}
    </span>
  )
}