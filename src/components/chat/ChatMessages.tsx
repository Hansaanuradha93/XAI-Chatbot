'use client'

import { useEffect, useRef } from 'react'
import type { Message } from './types'
import { MessageBubble } from './MessageBubble'
import { RatingPrompt } from './RatingPrompt'
import { FeedbackPrompt } from './FeedbackPrompt'

interface ChatMessagesProps {
  messages: Message[]
  ratingPending: boolean
  ratingSubmitting: boolean
  feedbackPending: boolean
  feedback: string
  feedbackSubmitting: boolean
  onRate: (score: number) => void
  onFeedbackChange: (value: string) => void
  onFeedbackSubmit: () => void
  onFeedbackSkip: () => void
}

export function ChatMessages({
  messages,
  ratingPending,
  ratingSubmitting,
  feedbackPending,
  feedback,
  feedbackSubmitting,
  onRate,
  onFeedbackChange,
  onFeedbackSubmit,
  onFeedbackSkip,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, ratingPending, feedbackPending])

  return (
    <section className="flex-1 overflow-hidden">
      <div className="flex h-full flex-col gap-3 overflow-y-auto px-6 py-4">
        {messages.map((m, idx) => (
          <MessageBubble key={idx} message={m} />
        ))}

        <RatingPrompt
          visible={ratingPending}
          submitting={ratingSubmitting}
          onRate={onRate}
        />

        <FeedbackPrompt
          visible={feedbackPending}
          feedback={feedback}
          submitting={feedbackSubmitting}
          onChange={onFeedbackChange}
          onSubmit={onFeedbackSubmit}
          onSkip={onFeedbackSkip}
        />

        <div ref={bottomRef} />
      </div>
    </section>
  )
}
