'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface FeedbackPromptProps {
  visible: boolean
  feedback: string
  submitting: boolean
  onChange: (value: string) => void
  onSubmit: () => void
  onSkip: () => void
}

export function FeedbackPrompt({
  visible,
  feedback,
  submitting,
  onChange,
  onSubmit,
  onSkip,
}: FeedbackPromptProps) {
  if (!visible) return null

  return (
    <div className="mt-4 w-full max-w-md rounded-2xl border border-slate-700/80 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 shadow-sm">
      <p className="font-medium text-slate-50">Optional feedback</p>
      <p className="text-xs text-slate-400">
        Tell us why you trusted or didn’t trust this response.
      </p>

      <div className="mt-2">
        <Textarea
          rows={3}
          value={feedback}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Share your thoughts..."
        />
      </div>

      <div className="mt-3 flex gap-2">
        <Button size="sm" disabled={submitting} onClick={onSubmit}>
          Submit feedback
        </Button>
        <Button
          size="sm"
          variant="ghost"
          type="button"
          onClick={onSkip}
          disabled={submitting}
        >
          Skip
        </Button>
      </div>
    </div>
  )
}
