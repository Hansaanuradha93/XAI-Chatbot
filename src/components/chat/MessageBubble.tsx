"use client"

import { cn } from "@/lib/utils"

export function MessageBubble({ sender, text, isFormatted }: any) {
  return (
    <div
      className={cn(
        "flex w-full",
        sender === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          // 🔥 Full responsive bubble width logic
          // clamp(min, preferred, max) → prevents edge touching on tiny screens
          "w-fit max-w-full",
          "px-4 py-2 rounded-2xl shadow-sm text-sm leading-6",
          "break-words",
          "bubble-responsive",

          sender === "bot"
            ? "bg-gray-100 text-gray-900 rounded-bl-sm"
            : "bg-gray-900 text-white rounded-br-sm"
        )}
        style={{
          // The real fix → ensures 100% responsiveness at all screen widths
          maxWidth: "clamp(50%, 70%, 90%)",
        }}
        dangerouslySetInnerHTML={isFormatted ? { __html: text } : undefined}
      >
        {!isFormatted ? text : null}
      </div>
    </div>
  )
}
