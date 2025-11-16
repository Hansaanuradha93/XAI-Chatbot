"use client"

import { cn } from "@/lib/utils"

export function MessageBubble({
  sender,
  text,
  isFormatted,
}: {
  sender: "user" | "bot"
  text: string
  isFormatted?: boolean
}) {
  return (
    <div
      className={cn(
        "flex w-full mb-3",
        sender === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2 shadow-sm text-sm leading-6 whitespace-pre-line",
          sender === "bot"
            ? "bg-gray-100 text-gray-900 rounded-bl-sm"
            : "bg-gray-900 text-white rounded-br-sm"
        )}
        dangerouslySetInnerHTML={isFormatted ? { __html: text } : undefined}
      >
        {!isFormatted ? text : null}
      </div>
    </div>
  )
}
