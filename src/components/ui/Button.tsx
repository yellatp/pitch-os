interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'danger'
}

export default function Button({ variant = 'default', className = '', children, ...props }: ButtonProps) {
  const base = 'px-3 py-1.5 text-sm border transition-colors font-sans disabled:opacity-40'
  const variants = {
    default: 'border-[var(--border)] text-primary hover:bg-[var(--bg-surface)]',
    ghost: 'border-transparent text-secondary hover:text-primary',
    danger: 'border-[var(--accent-red)] text-[var(--accent-red)] hover:bg-[var(--accent-red)] hover:text-white',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}