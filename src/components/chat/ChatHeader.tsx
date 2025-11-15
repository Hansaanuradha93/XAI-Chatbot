'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ChatHeaderProps {
  email: string | null
  mode: 'xai' | 'baseline'
  userRole: 'admin' | 'user'
  onToggleMode: () => void
  onSignOut: () => void
  onGoAdmin: () => void
}

export function ChatHeader({
  email,
  mode,
  userRole,
  onToggleMode,
  onSignOut,
  onGoAdmin,
}: ChatHeaderProps) {
  const initials = email ? email.charAt(0).toUpperCase() : '?'
  const isXai = mode === 'xai'

  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-800/70 bg-slate-950/70 px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-sm font-semibold text-emerald-300 border border-emerald-500/40">
          TA
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-slate-50">
            TrustAI Research Portal
          </span>
          <span className="text-xs text-slate-400">
            Experimenting with explainable loan decisions
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge>
          {isXai ? 'Explainable mode (XAI)' : 'Baseline model'}
        </Badge>

        {userRole === 'admin' && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleMode}
              className="text-xs"
            >
              Toggle mode
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onGoAdmin}
              className="text-xs"
            >
              Admin
            </Button>
          </>
        )}

        <div className="flex items-center gap-2 pl-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-50 border border-slate-500/80">
            {initials}
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-300 max-w-[180px] truncate">
              {email ?? 'Guest'}
            </span>
            <button
              onClick={onSignOut}
              className="text-[11px] text-slate-400 hover:text-red-400 transition-colors text-left"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
