import * as React from 'react'

export function Card({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={
        'rounded-xl border border-slate-800/80 bg-slate-950/80 shadow-elevated backdrop-blur-xl ' +
        className
      }
      {...props}
    />
  )
}

export function CardHeader({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={
        'flex items-center justify-between gap-4 border-b border-slate-800/70 px-6 py-4 ' +
        className
      }
      {...props}
    />
  )
}

export function CardContent({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={'px-6 py-4 ' + className} {...props} />
  )
}

export function CardFooter({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={
        'flex items-center gap-3 border-t border-slate-800/70 px-6 py-4 ' +
        className
      }
      {...props}
    />
  )
}
