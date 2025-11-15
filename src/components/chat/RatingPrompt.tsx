'use client'

import { Button } from '@/components/ui/button'

interface RatingPromptProps {
  visible: boolean
  submitting: boolean
  onRate: (score: number) => void
}

export function RatingPrompt({
  visible,
  submitting,
  onRate,
}: RatingPromptProps) {
  if (!visible) return null

  return (
    <div className="mt-4 w-full max-w-md rounded-2xl border border-slate-700/80 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 shadow-sm">
      <p className="font-medium text-slate-50">
        On a scale of 1–5, how much do you trust this answer?
      </p>
      <div className="mt-2 flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <Button
            key={n}
            variant="outline"
            size="sm"
            disabled={submitting}
            onClick={() => onRate(n)}
          >
            {n}
          </Button>
        ))}
      </div>
    </div>
  )
}
