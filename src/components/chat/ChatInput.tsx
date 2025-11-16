"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function ChatInput({
  input,
  setInput,
  onSend,
  disabled = false,
}: {
  input: string
  setInput: (v: string) => void
  onSend: () => void
  disabled?: boolean
}) {
  return (
    <div className="border-t bg-white p-4 flex items-center gap-3">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSend()}
        placeholder="Ask a question about finance..."
        disabled={disabled}
        className={cn(
          "rounded-full bg-gray-100 px-4 py-2",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />

      <Button
        onClick={onSend}
        disabled={disabled}
        className="rounded-full w-11 h-11 p-0 flex items-center justify-center"
      >
        ➤
      </Button>
    </div>
  )
}
