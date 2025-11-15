'use client'

import { Avatar } from '@/components/ui/avatar'
import type { Message } from './types'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isBot = message.sender === 'bot'
  const isDetailedExplanation =
    message.text.includes('**Decision Outcome') ||
    message.text.includes('**Main Financial Factors') ||
    message.text.includes('**Conclusion')

  const formattedText = isDetailedExplanation
    ? message.text
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/- /g, '• ')
        .replace(/\n/g, '<br/>')
    : message.text.replace(/\n/g, '<br/>')

  return (
    <div
      className={`flex w-full gap-3 ${
        isBot ? 'justify-start' : 'justify-end'
      }`}
    >
      {isBot && <Avatar initials="AI" variant="bot" />}

      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isBot
            ? 'bg-slate-900/80 text-slate-100 border border-slate-700/80'
            : 'bg-emerald-500/90 text-slate-950 border border-emerald-400/70'
        }`}
      >
        <div
          className="whitespace-pre-wrap text-[0.9rem]"
          style={{ lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: formattedText }}
        />
      </div>

      {!isBot && <Avatar initials="U" variant="user" />}
    </div>
  )
}
