import * as React from 'react'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={
          'flex min-h-[80px] w-full rounded-lg border border-slate-700/70 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none ring-offset-slate-950 focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ' +
          className
        }
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'
