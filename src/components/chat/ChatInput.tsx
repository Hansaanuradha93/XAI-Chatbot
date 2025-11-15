'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  thinking: boolean
}

export function ChatInput({
  value,
  onChange,
  onSend,
  thinking,
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <footer className="border-t border-slate-800/70 bg-slate-950/80 px-6 py-3">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            thinking
              ? 'Thinking...'
              : 'Ask a question about finance or loans...'
          }
          disabled={thinking}
        />
        <Button
          size="icon"
          disabled={!value.trim() || thinking}
          onClick={onSend}
          aria-label="Send message"
        >
          ➤
        </Button>
      </div>
    </footer>
  )
}
