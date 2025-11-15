'use client'

import * as React from 'react'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive'
type Size = 'default' | 'sm' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  default:
    'bg-primary text-primary-foreground hover:bg-emerald-500/90 border border-emerald-400/40',
  outline:
    'border border-slate-700/80 bg-transparent text-slate-100 hover:bg-slate-800/60',
  ghost:
    'bg-transparent text-slate-300 hover:bg-slate-800/60 border border-transparent',
  secondary:
    'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700/80',
  destructive:
    'bg-destructive text-destructive-foreground hover:bg-red-500 border border-red-500/70',
}

const sizeClasses: Record<Size, string> = {
  default: 'h-10 px-4 py-2 text-sm',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-11 px-5 text-sm',
  icon: 'h-9 w-9 p-0',
}

export function Button({
  className = '',
  variant = 'default',
  size = 'default',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-60 disabled:cursor-not-allowed'
  const merged = `${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  return <button className={merged} {...props} />
}
