import * as React from 'react'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  initials: string
  variant?: 'bot' | 'user'
}

export function Avatar({
  initials,
  variant = 'bot',
  className = '',
  ...props
}: AvatarProps) {
  const isBot = variant === 'bot'
  const base =
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold shadow-sm'
  const styles = isBot
    ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/40'
    : 'bg-slate-700 text-slate-50 border border-slate-600'

  return (
    <div className={`${base} ${styles} ${className}`} {...props}>
      {initials}
    </div>
  )
}
