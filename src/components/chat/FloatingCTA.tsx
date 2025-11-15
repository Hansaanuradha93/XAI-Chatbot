'use client'

import { Button } from '@/components/ui/button'

interface FloatingCTAProps {
  visible: boolean
  onClick: () => void
}

export function FloatingCTA({ visible, onClick }: FloatingCTAProps) {
  if (!visible) return null

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full bg-emerald-500/90 px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 ring-1 ring-emerald-400/80 hover:bg-emerald-400 transition-transform hover:translate-y-[-1px]"
    >
      Apply for a loan
    </button>
  )
}
