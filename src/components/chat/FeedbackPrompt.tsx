"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function FeedbackPrompt({
  feedbackPending,
  feedback,
  setFeedback,
  feedbackSubmitting,
  onSubmit,
  onSkip,
}: {
  feedbackPending: boolean
  feedback: string
  setFeedback: (v: string) => void
  feedbackSubmitting: boolean
  onSubmit: () => void
  onSkip: () => void
}) {
  if (!feedbackPending) return null

  return (
    <div className="bg-gray-100 p-4 rounded-xl mb-3 shadow-sm">
      <p className="font-semibold text-gray-900 text-sm mb-2">
        Optional feedback
      </p>

      <Textarea
        rows={3}
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Share your thoughts…"
        className="mb-3 bg-white"
      />

      <div className="flex gap-2">
        <Button onClick={onSubmit} disabled={feedbackSubmitting}>
          Submit
        </Button>

        <Button variant="outline" onClick={onSkip}>
          Skip
        </Button>
      </div>
    </div>
  )
}
