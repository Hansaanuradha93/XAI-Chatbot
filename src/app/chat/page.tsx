'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useSession } from '@/hooks/useSession'
import { apiFetch } from '@/lib/apiClient'
import { Card, CardContent } from '@/components/ui/card'
import { ChatHeader } from '@/components/chat/ChatHeader'
import { ChatMessages } from '@/components/chat/ChatMessages'
import { ChatInput } from '@/components/chat/ChatInput'
import { FloatingCTA } from '@/components/chat/FloatingCTA'
import type { Message, LoanResult, ChatContext } from '@/components/chat/types'

export default function ChatPage() {
  const router = useRouter()
  const { email, loading } = useSession(true)

  const initialGreeting: Message[] = [
    {
      sender: 'bot',
      text: 'Hello! I’m TrustAI — your personal AI loan advisor.',
    },
    {
      sender: 'bot',
      text: 'You can check your loan eligibility or ask me financial FAQs.',
    },
  ]

  const [messages, setMessages] = useState<Message[]>(initialGreeting)
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [lastResult, setLastResult] = useState<LoanResult | null>(null)
  const [context, setContext] = useState<ChatContext>(null)

  const [ratingPending, setRatingPending] = useState(false)
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [feedbackPending, setFeedbackPending] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [ratingGiven, setRatingGiven] = useState<number | null>(null)

  const [mode, setMode] = useState<'xai' | 'baseline'>(
    (typeof window !== 'undefined' &&
      (localStorage.getItem('chat_mode') as 'xai' | 'baseline')) || 'xai'
  )

  const [userRole, setUserRole] = useState<'admin' | 'user'>('user')

  const toggleMode = () => {
    const newMode = mode === 'xai' ? 'baseline' : 'xai'
    setMode(newMode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('chat_mode', newMode)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  // Load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!email) return
      const { data, error } = await supabase
        .from('chat_history')
        .select('sender, message')
        .eq('user_email', email)
        .order('timestamp', { ascending: true })

      if (error) {
        console.error('Error loading chat history:', error)
        return
      }

      if (data && data.length > 0) {
        const pastMessages: Message[] = data.map((m) => ({
          sender: m.sender as 'user' | 'bot',
          text: m.message,
        }))
        setMessages([...initialGreeting, ...pastMessages])

        const last = pastMessages[pastMessages.length - 1]
        if (last && last.text.startsWith('Loan Decision')) {
          setContext('loan')
          setRatingPending(true)
        }
      } else {
        setMessages(initialGreeting)
      }
    }
    loadChatHistory()
  }, [email])

  // Fetch user mode & role
  useEffect(() => {
    const fetchUserMode = async () => {
      if (!email) return
      try {
        const data = await apiFetch(`/api/v1/users/mode`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })

        if (data.mode) {
          setMode(data.mode)
          if (typeof window !== 'undefined') {
            localStorage.setItem('chat_mode', data.mode)
          }
        }
        if (data.role) {
          setUserRole(data.role)
        }
      } catch (err) {
        console.error('⚠️ Failed to fetch user mode:', err)
      }
    }
    fetchUserMode()
  }, [email])

  const saveMessage = async (sender: 'user' | 'bot', text: string) => {
    if (!email) return
    const { error } = await supabase.from('chat_history').insert({
      user_email: email,
      sender,
      message: text,
      variant: mode,
    })
    if (error) console.error('Error saving message:', error)
  }

  // FAQ message send
  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed) return

    setMessages((prev) => [...prev, { sender: 'user', text: trimmed }])
    saveMessage('user', trimmed)
    setInput('')
    setThinking(true)

    try {
      const data = await apiFetch(`/api/v1/faq/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmed,
          user_email: email || 'anonymous',
        }),
      })

      setThinking(false)

      if (data.answer) {
        const botMsg = data.answer
        setMessages((prev) => [...prev, { sender: 'bot', text: botMsg }])
        saveMessage('bot', botMsg)
        setContext('faq')
        setRatingPending(true)
      } else {
        const msg = 'Sorry, I couldn’t find an answer for that question.'
        setMessages((prev) => [...prev, { sender: 'bot', text: msg }])
        saveMessage('bot', msg)
      }
    } catch (error) {
      console.error('Error:', error)
      setThinking(false)
      const errMsg = 'Error contacting the backend service.'
      setMessages((prev) => [...prev, { sender: 'bot', text: errMsg }])
      saveMessage('bot', errMsg)
    }
  }

  // Rating handler
  const handleRating = async (score: number) => {
    if (!email) return
    if (ratingSubmitting) return

    setRatingSubmitting(true)
    const variant = context === 'loan' ? mode : 'faq'

    const { data, error } = await supabase
      .from('trust_ratings')
      .insert({
        user_email: email,
        variant,
        prediction: lastResult?.prediction ?? null,
        explanation_json: lastResult?.explanation ?? null,
        trust_score: score,
        comment: null,
      })
      .select('id')
      .single()

    setRatingSubmitting(false)

    if (error || !data) {
      console.error('❌ Supabase insert failed:', { error, data })
      alert('Failed to save rating.')
      return
    }

    setRatingGiven(score)
    setRatingPending(false)
    setFeedbackPending(true)

    const botMsg1 = `Thanks! Your trust rating (${score}/5) was recorded.`
    const botMsg2 = 'Would you like to share why you rated it this way?'
    setMessages((prev) => [
      ...prev,
      { sender: 'bot', text: botMsg1 },
      { sender: 'bot', text: botMsg2 },
    ])
    saveMessage('bot', botMsg1)
    saveMessage('bot', botMsg2)
  }

  const submitFeedback = async () => {
    if (!feedback.trim()) return
    setFeedbackSubmitting(true)

    const { data: latestRating } = await supabase
      .from('trust_ratings')
      .select('id')
      .eq('user_email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!latestRating) {
      alert('No rating found.')
      setFeedbackSubmitting(false)
      return
    }

    const { error } = await supabase
      .from('trust_ratings')
      .update({ comment: feedback })
      .eq('id', latestRating.id)

    setFeedbackSubmitting(false)
    setFeedbackPending(false)

    if (error) {
      console.error('Feedback update error:', error)
      alert('Could not save feedback.')
      return
    }

    const thankMsg = 'Thank you for sharing your feedback.'
    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: feedback },
      { sender: 'bot', text: thankMsg },
    ])
    saveMessage('user', feedback)
    saveMessage('bot', thankMsg)
    setFeedback('')
  }

  const skipFeedback = () => {
    setFeedbackPending(false)
    setFeedback('')
    const skipMsg = 'Feedback skipped.'
    setMessages((prev) => [...prev, { sender: 'bot', text: skipMsg }])
    saveMessage('bot', skipMsg)
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-6 py-4 text-sm">
          Loading…
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-slate-50 px-4 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <Card className="flex h-[80vh] flex-col overflow-hidden">
          <ChatHeader
            email={email}
            mode={mode}
            userRole={userRole}
            onToggleMode={toggleMode}
            onSignOut={signOut}
            onGoAdmin={() => router.push('/admin')}
          />

          <CardContent className="flex flex-1 flex-col p-0">
            <ChatMessages
              messages={messages}
              ratingPending={ratingPending}
              ratingSubmitting={ratingSubmitting}
              feedbackPending={feedbackPending}
              feedback={feedback}
              feedbackSubmitting={feedbackSubmitting}
              onRate={handleRating}
              onFeedbackChange={setFeedback}
              onFeedbackSubmit={submitFeedback}
              onFeedbackSkip={skipFeedback}
            />
          </CardContent>

          <ChatInput
            value={input}
            onChange={setInput}
            onSend={sendMessage}
            thinking={thinking}
          />
        </Card>
      </div>

      <FloatingCTA
        visible={!!email}
        onClick={() => router.push('/loan-form')}
      />
    </main>
  )
}
