'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useSession } from '@/hooks/useSession'
import { ADMIN_EMAILS } from '@/lib/adminConfig'

interface Message {
  sender: 'user' | 'bot'
  text: string
  type?: 'text' | 'action'
}

type LoanResult = {
  prediction: string
  explanation?: Record<string, number> | { error?: string } | null
}

type ChatContext = 'loan' | 'faq' | null

export default function ChatPage() {
  const router = useRouter()
  const { email, loading } = useSession(true)

  // ✅ Clean greeting — no emojis
  const initialGreeting: Message[] = [
    { sender: 'bot', text: 'Hello! I’m TrustAI — your personal AI loan advisor.' },
    { sender: 'bot', text: 'You can check your loan eligibility or ask me financial FAQs.' },
  ]

  const [messages, setMessages] = useState<Message[]>(initialGreeting)
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [lastResult, setLastResult] = useState<LoanResult | null>(null)
  const [context, setContext] = useState<ChatContext>(null)
  const [ratingPending, setRatingPending] = useState(false)
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [feedbackPending, setFeedbackPending] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [ratingGiven, setRatingGiven] = useState<number | null>(null)

  // Mode toggle (XAI or Baseline)
  const [mode, setMode] = useState<'xai' | 'baseline'>(
    (typeof window !== 'undefined' && (localStorage.getItem('chat_mode') as 'xai' | 'baseline')) || 'xai'
  )

  const [userRole, setUserRole] = useState<'admin' | 'user'>('user')

  const toggleMode = () => {
    const newMode = mode === 'xai' ? 'baseline' : 'xai'
    setMode(newMode)
    localStorage.setItem('chat_mode', newMode)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking, ratingPending, feedbackPending])

  // 🔹 Load chat history from Supabase
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
        const pastMessages = data.map((m) => ({
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

// 🔹 Fetch user mode allocation from backend
useEffect(() => {
  const fetchUserMode = async () => {
    if (!email) return
    try {
      const res = await fetch('http://127.0.0.1:8000/user_mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (data.mode) {
        setMode(data.mode)
        localStorage.setItem('chat_mode', data.mode)
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

  // 🔹 Save message
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

  // --- FAQ Message ---
  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed) return

    setMessages((prev) => [...prev, { sender: 'user', text: trimmed }])
    saveMessage('user', trimmed)
    setInput('')
    setThinking(true)

    try {
      const res = await fetch('http://127.0.0.1:8000/faq_answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmed,
          user_email: email || 'anonymous',
        }),
      })

      const data = await res.json()
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

  // --- Rating Handler ---
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
    setMessages((prev) => [...prev, { sender: 'bot', text: botMsg1 }, { sender: 'bot', text: botMsg2 }])
    saveMessage('bot', botMsg1)
    saveMessage('bot', botMsg2)
  }

  // --- Feedback Handler ---
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2>TrustAI Chatbot</h2>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: '8px',
              background: mode === 'xai' ? '#1e8e3e' : '#888',
              fontSize: '0.8rem',
              color: 'white',
            }}
          >
            {mode === 'xai' ? 'Explainable Mode' : 'Baseline Mode'}
          </span>
        </div>
          <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Profile Icon */}
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: mode === 'xai' ? '2px solid #1e8e3e' : '2px solid transparent',
                  background: '#ccc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  color: '#333',
                }}
              >
                {email ? email.charAt(0).toUpperCase() : '?'}
              </div>

              {/* Only admins see the toggle + Admin button */}
              {userRole === 'admin' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={toggleMode} className="button small">Toggle Mode</button>
                  <button onClick={() => router.push('/admin')} className="admin-btn">Admin</button>
                </div>
              )}

            <button onClick={signOut} className="danger">Sign out</button>
      </div>
      </header>

      {/* ---------- Chat Messages with Clean Avatars ---------- */}
      <section className="chat-box">
        {messages.map((msg, i) => {
          const isBot = msg.sender === 'bot'
          const isDetailedExplanation =
            msg.text.includes('**Decision Outcome') ||
            msg.text.includes('**Main Financial Factors') ||
            msg.text.includes('**Conclusion')

          // ✅ Format message text (bold, bullet points, spacing) for human_message
          const formattedText = isDetailedExplanation
            ? msg.text
                .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // bold
                .replace(/- /g, '• ') // bullet points
                .replace(/\n/g, '<br/>') // line breaks
            : msg.text

          return (
            <div key={i} className={`chat-row ${msg.sender}`}>
              <div className={`chat-avatar ${msg.sender}`}>
                <span className="avatar-initial">{isBot ? 'AI' : 'U'}</span>
              </div>
              {/* ✅ Keep bubble colors same, only format text */}
              <div
                className={`bubble ${msg.sender}`}
                style={{
                  whiteSpace: 'pre-line',
                  lineHeight: 1.6,
                  fontSize: '0.95rem',
                  fontFamily: 'Inter, sans-serif',
                }}
                dangerouslySetInnerHTML={{ __html: formattedText }}
              />
            </div>
          )
        })}

        {/* Rating Prompt */}
        {ratingPending && (
          <div className="bubble bot">
            <b>On a scale of 1–5, how much do you trust this answer?</b>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} className="button" disabled={ratingSubmitting} onClick={() => handleRating(n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Prompt */}
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
                background: 'var(--card)',
                color: 'var(--text)',
                padding: '6px',
              }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button className="button" disabled={feedbackSubmitting} onClick={submitFeedback}>
                Submit Feedback
              </button>
              <button
                className="button secondary"
                onClick={() => {
                  setFeedbackPending(false)
                  setFeedback('')
                  const skipMsg = 'Feedback skipped.'
                  setMessages((prev) => [...prev, { sender: 'bot', text: skipMsg }])
                  saveMessage('bot', skipMsg)
                }}
              >
                Skip
              </button>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </section>

      {/* Input Bar */}
      <footer className="input-bar">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about finance..."
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage}>➤</button>
      </footer>

      {/* Floating Loan Button */}
      {email && (
        <button
          onClick={() => router.push('/loan-form')}
          className="floating-loan-btn"
        >
          Apply for a Loan
        </button>
      )}
    </main>
  )
}
