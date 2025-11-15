import * as React from 'react'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={
          'flex h-10 w-full rounded-lg border border-slate-700/70 bg-slate-900/80 px-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none ring-offset-slate-950 focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ' +
          className
        }
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'
