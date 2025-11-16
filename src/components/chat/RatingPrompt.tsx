"use client"

import { Button } from "@/components/ui/button"

export function RatingPrompt({
  ratingPending,
  ratingSubmitting,
  onRate,
}: {
  ratingPending: boolean
  ratingSubmitting: boolean
  onRate: (score: number) => void
}) {
  if (!ratingPending) return null

  return (
    <div className="flex flex-col gap-2 bg-gray-100 p-4 rounded-xl mb-3 shadow-sm">
      <p className="font-semibold text-gray-900 text-sm">
        On a scale of 1–5, how much do you trust this answer?
      </p>

      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <Button
            key={n}
            size="sm"
            variant="outline"
            onClick={() => onRate(n)}
            disabled={ratingSubmitting}
            className="w-8 p-0 font-medium"
          >
            {n}
          </Button>
        ))}
      </div>
    </div>
  )
}
