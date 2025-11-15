import * as React from 'react'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline'
}

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  const base =
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-tight'
  const styles =
    variant === 'outline'
      ? 'border-slate-700/80 text-slate-300 bg-slate-900/40'
      : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'

  return <div className={`${base} ${styles} ${className}`} {...props} />
}
