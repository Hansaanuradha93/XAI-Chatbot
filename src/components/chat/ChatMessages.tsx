"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageBubble } from "./MessageBubble"
import { RatingPrompt } from "./RatingPrompt"
import { FeedbackPrompt } from "./FeedbackPrompt"
import { useEffect, useRef } from "react"

export function ChatMessages({
  messages,
  ratingPending,
  ratingSubmitting,
  onRate,
  feedback,
  setFeedback,
  feedbackPending,
  feedbackSubmitting,
  onSubmitFeedback,
  onSkipFeedback,
}: any) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, ratingPending, feedbackPending])

  return (
    <ScrollArea className="flex-1 px-4 py-4">
      {/* Centered chat column with responsive max width */}
      <div className="flex flex-col w-full max-w-3xl mx-auto space-y-3">

        {messages.map((msg: any, index: number) => {
          const formatted =
            msg.text.includes("**Decision") ||
            msg.text.includes("**Main") ||
            msg.text.includes("**Conclusion")

          const html = formatted
            ? msg.text
                .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
                .replace(/- /g, "• ")
                .replace(/\n/g, "<br/>")
            : msg.text

          return (
            <MessageBubble
              key={index}
              sender={msg.sender}
              text={html}
              isFormatted={formatted}
            />
          )
        })}

        {/* Rating bubble */}
        <RatingPrompt
          ratingPending={ratingPending}
          ratingSubmitting={ratingSubmitting}
          onRate={onRate}
        />

        {/* Feedback bubble */}
        <FeedbackPrompt
          feedbackPending={feedbackPending}
          feedback={feedback}
          setFeedback={setFeedback}
          feedbackSubmitting={feedbackSubmitting}
          onSubmit={onSubmitFeedback}
          onSkip={onSkipFeedback}
        />

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
