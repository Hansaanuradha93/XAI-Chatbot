'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useSession } from '@/hooks/useSession'
import { ADMIN_EMAILS } from '@/lib/adminConfig' // 👈 import admin emails

interface Message {
  sender: 'user' | 'bot'
  text: string
  type?: 'text' | 'action'
}

type LoanResult = {
  prediction: string
  explanation?: Record<string, number> | { error?: string }
}

export default function ChatPage() {
  const router = useRouter()
  const { email, loading } = useSession(true)

  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: '👋 Hello! I’m TrustAI — your personal AI loan advisor.' },
    { sender: 'bot', text: 'Would you like to check your loan eligibility?', type: 'action' },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [lastResult, setLastResult] = useState<LoanResult | null>(null)
  const [ratingPending, setRatingPending] = useState(false)
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [ratingGiven, setRatingGiven] = useState<number | null>(null)
  const [feedbackPending, setFeedbackPending] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)

  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking, ratingPending, feedbackPending])

  // Load loan result if available
  useEffect(() => {
    const saved = localStorage.getItem('loan_result')
    if (saved) {
      const result: LoanResult = JSON.parse(saved)
      localStorage.removeItem('loan_result')

      let explanationText = ''
      if (result.explanation && typeof result.explanation === 'object') {
        const entries = Object.entries(result.explanation)
        if (entries.length > 0) {
          explanationText = entries.map(([f, v]) => `${f}: ${v}`).join('\n')
        }
      }

      const messageText =
        `💡 Loan Decision: ${result.prediction}\n\n` +
        (explanationText ? `Explanation:\n${explanationText}` : 'No explanation available.')

      setMessages((prev) => [...prev, { sender: 'bot', text: messageText }])
      setLastResult(result)
      setRatingPending(true)
    }
  }, [])

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed) return

    setMessages((prev) => [...prev, { sender: 'user', text: trimmed }])
    setInput('')
    setThinking(true)

    setTimeout(() => {
      setThinking(false)
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text:
            'Your loan was denied due to your credit score and debt-to-income ratio.\n\n' +
            'Credit Score: 620 (Threshold: 700)\nDTI: 45% (Max: 35%)',
        },
      ])
    }, 1500)
  }

  const handleRating = async (score: number) => {
    if (!email || !lastResult) return
    if (ratingSubmitting) return

    setRatingSubmitting(true)
    const variant = 'xai'

    const { data, error } = await supabase
      .from('trust_ratings')
      .insert({
        user_email: email,
        variant,
        prediction: lastResult.prediction,
        explanation_json: lastResult.explanation ?? null,
        trust_score: score,
      })
      .select('id')
      .single()

    setRatingSubmitting(false)

    if (error || !data) {
      console.error('Insert error:', error)
      alert('Failed to save rating.')
      return
    }

    setRatingGiven(score)
    setRatingPending(false)
    setFeedbackPending(true)
    localStorage.setItem('rating_id', data.id)

    setMessages((prev) => [
      ...prev,
      { sender: 'bot', text: `✅ Thanks! Your trust rating (${score}/5) was recorded.` },
      { sender: 'bot', text: 'Would you like to share why you rated it this way?' },
    ])
  }

  const submitFeedback = async () => {
    if (!feedback.trim()) return
    setFeedbackSubmitting(true)

    const ratingId = localStorage.getItem('rating_id')
    if (!ratingId) return

    const { error } = await supabase.from('trust_ratings').update({ comment: feedback }).eq('id', ratingId)

    setFeedbackSubmitting(false)
    setFeedbackPending(false)
    localStorage.removeItem('rating_id')

    if (error) {
      console.error('Feedback update error:', error)
      alert('Could not save feedback.')
      return
    }

    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: feedback },
      { sender: 'bot', text: '🙏 Thank you for sharing your feedback!' },
    ])
    setFeedback('')
  }

  if (loading) {
    return (
      <main className="page-center">
        <div className="card">Loading…</div>
      </main>
    )
  }

  return (
    <main className="chat-container">
      <header className="chat-header">
        <h2>TrustAI Chatbot</h2>
        <div className="user-info">
          <span>{email}</span>

          {/* ✅ Only show for admin users */}
          {ADMIN_EMAILS.includes(email || '') && (
            <button onClick={() => router.push('/admin')} className="admin-btn">
              Admin
            </button>
          )}

          <button onClick={signOut} className="danger">
            Sign out
          </button>
        </div>
      </header>

      <section className="chat-box">
        {messages.map((msg, i) => (
          <div key={i} className={`bubble ${msg.sender}`}>
            {msg.text}
            {msg.type === 'action' && (
              <div style={{ marginTop: '10px', textAlign: 'center' }}>
                <button onClick={() => router.push('/loan-form')} className="button">
                  Apply for a Loan
                </button>
              </div>
            )}
          </div>
        ))}

        {ratingPending && (
          <div className="bubble bot">
            <b>On a scale of 1–5, how much do you trust this decision?</b>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} className="button" disabled={ratingSubmitting} onClick={() => handleRating(n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {feedbackPending && (
          <div className="bubble bot">
            <b>Optional Feedback</b>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your thoughts..."
              rows={3}
              style={{
                width: '100%',
                marginTop: '8px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: '#0f1115',
                color: 'var(--text)',
                padding: '6px',
              }}
            />
            <button className="button" style={{ marginTop: '6px' }} disabled={feedbackSubmitting} onClick={submitFeedback}>
              Submit Feedback
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </section>

      <footer className="input-bar">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your loan, credit, or finances..."
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </footer>
    </main>
  )
}
