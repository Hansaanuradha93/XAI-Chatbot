'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useSession } from '@/hooks/useSession'

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
    { sender: 'bot', text: 'Would you like to check your loan eligibility?', type: 'action' }
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Rating state
  const [lastResult, setLastResult] = useState<LoanResult | null>(null)
  const [ratingPending, setRatingPending] = useState(false)
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [ratingGiven, setRatingGiven] = useState<number | null>(null)

  // --- Sign out handler ---
  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  // --- Auto-scroll when new messages appear ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking, ratingPending])

  // --- On enter to /chat, check if a loan_result exists (from /loan-form) ---
  useEffect(() => {
    setTimeout(() => {
      const saved = localStorage.getItem('loan_result')
      if (saved) {
        const result: LoanResult = JSON.parse(saved)
        localStorage.removeItem('loan_result')

        // Format explanation
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

        setMessages(prev => [...prev, { sender: 'bot', text: messageText }])
        setLastResult(result)
        setRatingPending(true) // now show rating UI
      }
    }, 400)
  }, [])

  // --- Normal chat send (still mocked) ---
  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed) return

    setMessages(prev => [...prev, { sender: 'user', text: trimmed }])
    setInput('')
    setThinking(true)

    setTimeout(() => {
      setThinking(false)
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text:
            'Your loan was denied due to your credit score and debt-to-income ratio.\n\n' +
            'Credit Score: 620 (Threshold: 700)\nDTI: 45% (Max: 35%)'
        }
      ])
    }, 1500)
  }

  // --- Handle rating click ---
  const handleRating = async (score: number) => {
    if (!email) {
      alert('Not logged in. Please sign in again.')
      return
    }
    if (!lastResult) {
      alert('No decision to rate.')
      return
    }
    if (ratingSubmitting) return

    setRatingSubmitting(true)

    // Variant: you’re currently showing explanations → 'xai'
    // For your baseline run (no explanation), set variant to 'baseline'
    const variant = 'xai'

    const { error } = await supabase.from('trust_ratings').insert({
      user_email: email,
      variant,
      prediction: lastResult.prediction,
      explanation_json: lastResult.explanation ?? null,
      trust_score: score
    })

    setRatingSubmitting(false)

    if (error) {
      console.error('Supabase insert error:', error)
      alert('Failed to save rating. Check console and RLS policies.')
      return
    }

    setRatingGiven(score)
    setRatingPending(false)

    // Append confirmation message to chat
    setMessages(prev => [
      ...prev,
      { sender: 'bot', text: `✅ Thanks! Your trust rating (${score}/5) was recorded.` }
    ])
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
      {/* Header */}
      <header className="chat-header">
        <h2>TrustAI Chatbot</h2>
        <div className="user-info">
          <span>{email}</span>
          <button onClick={signOut} className="danger">Sign out</button>
        </div>
      </header>

      {/* Chat messages */}
      <section className="chat-box">
        {messages.map((msg, i) => (
          <div key={i} className={`bubble ${msg.sender}`}>
            {msg.text}

            {/* Action bubble to go to loan form */}
            {msg.type === 'action' && (
              <div style={{ marginTop: '10px', textAlign: 'center' }}>
                <button onClick={() => router.push('/loan-form')} className="button">
                  Apply for a Loan
                </button>
              </div>
            )}
          </div>
        ))}

        {thinking && (
          <div className="bubble bot thinking">
            Thinking<span className="dots">...</span>
          </div>
        )}

        {/* Trust rating UI (shows only once after a decision) */}
        {ratingPending && lastResult && (
          <div className="bubble bot" style={{ border: '1px solid var(--border)' }}>
            <div style={{ marginBottom: '8px', fontWeight: 600 }}>
              On a scale of 1–5, how much do you trust this decision?
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  className="button"
                  disabled={ratingSubmitting}
                  onClick={() => handleRating(n)}
                  style={{
                    minWidth: 44,
                    padding: '8px 12px',
                    opacity: ratingSubmitting ? 0.7 : 1
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
              We store your rating with the decision and explanation to analyze trust.
            </div>
          </div>
        )}

        {ratingGiven && (
          <div className="bubble bot">
            Noted. You rated this decision <b>{ratingGiven}/5</b>.
          </div>
        )}

        <div ref={messagesEndRef} />
      </section>

      {/* Input bar */}
      <footer className="input-bar">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a question about your loan, credit, or finances..."
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </footer>
    </main>
  )
}
