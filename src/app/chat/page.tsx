'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useSession } from '@/hooks/useSession'
import { apiFetch } from '@/lib/apiClient'
import { SurveyModal } from '@/components/survey/SurveyModal'

interface Message {
  sender: 'user' | 'bot'
  text: string
  context?: string | null
  prediction?: string | null
}

type ChatContext = 'loan' | 'faq' | null

export default function ChatPage() {
  const router = useRouter()
  const { email, loading } = useSession(true)

  // Initial greeting
  const initialGreeting: Message[] = [
    { sender: 'bot', text: 'Hello! I’m TrustAI — your personal AI loan advisor.' },
    { sender: 'bot', text: 'You can check your loan eligibility or ask me financial FAQs.' },
  ]

  // State
  const [messages, setMessages] = useState<Message[]>(initialGreeting)
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [context, setContext] = useState<ChatContext>(null)

  // Dropdown menu
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    const close = () => setMenuOpen(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [])

  // A/B testing state
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

  // Scroll to bottom on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  // Load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!email) return

      const { data, error } = await supabase
        .from('chat_history')
        .select('sender, message, context, prediction')
        .eq('user_email', email)
        .order('timestamp', { ascending: true })

      if (error) {
        console.error('Error loading chat history:', error)
        return
      }

      if (data && data.length > 0) {
        const mapped = data.map((m) => ({
          sender: m.sender as 'user' | 'bot',
          text: m.message,
          context: m.context,
          prediction: m.prediction,
        }))
        setMessages([...initialGreeting, ...mapped])
      } else {
        setMessages(initialGreeting)
      }
    }

    loadChatHistory()
  }, [email])

  // Fetch user A/B mode + role
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

  // Save message helper
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

  // ============================================================
  //                 SURVEY INTEGRATION (FINAL)
  // ============================================================

  const [surveyOpen, setSurveyOpen] = useState(false)
  const [surveySubmitting, setSurveySubmitting] = useState(false)
  const [pendingSurveyPrediction, setPendingSurveyPrediction] = useState<string | null>(null)
  const [hasTriggered, setHasTriggered] = useState(false)
  const surveyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Watch for new loan decisions using structured metadata
  useEffect(() => {
    if (!messages.length) return

    const last = messages[messages.length - 1]

    const isLoanDecision =
      last.sender === 'bot' &&
      last.context === 'loan' &&
      typeof last.prediction === 'string'

    if (!isLoanDecision) return

    // If we've already shown survey for this decision: skip
    if (hasTriggered && pendingSurveyPrediction === last.prediction) return

    // Set it
    setPendingSurveyPrediction(last.prediction!)
    setContext('loan')

    // Delay survey so user reads the decision
    if (surveyTimerRef.current) clearTimeout(surveyTimerRef.current)

    surveyTimerRef.current = setTimeout(() => {
      setSurveyOpen(true)
      setHasTriggered(true)
    }, 8000) // 8 seconds

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  useEffect(() => {
    return () => {
      if (surveyTimerRef.current) clearTimeout(surveyTimerRef.current)
    }
  }, [])

const submitSurvey = async (payload: {
  trust: {
    trust_score: number | null
    reasoning_confidence_score: number | null
    accuracy_score: number | null
    understanding_score: number | null
    repeat_usage_score: number | null
    comfort_score: number | null
  }
  feedback?: string
}) => {
    if (!email || !pendingSurveyPrediction) {
      setSurveyOpen(false)
      return
    }

    setSurveySubmitting(true)

    try {
      await apiFetch(`/api/v1/survey/loan-trust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: email,
          variant: mode,
          prediction: pendingSurveyPrediction,
          trust: payload.trust,
          feedback: payload.feedback,
        }),
      })

      const thanks = 'Thanks for completing the trust survey!'
      setMessages((prev) => [...prev, { sender: 'bot', text: thanks }])
      saveMessage('bot', thanks)
    } catch (err) {
      console.error('❌ Survey submit failed:', err)
      const failMsg = '⚠️ Could not submit the survey. Please try again later.'
      setMessages((prev) => [...prev, { sender: 'bot', text: failMsg }])
      saveMessage('bot', failMsg)
    } finally {
      setSurveySubmitting(false)
      setSurveyOpen(false)
    }
  }

  // ============================================================
  //                      SEND FAQ MESSAGE
  // ============================================================

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
      } else {
        const msg = 'Sorry, I couldn’t find an answer for that question.'
        setMessages((prev) => [...prev, { sender: 'bot', text: msg }])
        saveMessage('bot', msg)
      }
    } catch (error) {
      console.error('Error:', error)
      const errMsg = 'Error contacting the backend service.'
      setMessages((prev) => [...prev, { sender: 'bot', text: errMsg }])
      saveMessage('bot', errMsg)
      setThinking(false)
    }
  }

  // ============================================================
  //                       RENDER PAGE
  // ============================================================

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
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2>Financial Chatbot</h2>
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

        {/* Avatar + Dropdown */}
        <div
          className="dropdown"
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen((o) => !o)
          }}
        >
          <div
            className="chat-avatar dropdown-toggle"
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
              cursor: 'pointer',
            }}
          >
            {email ? email.charAt(0).toUpperCase() : '?'}
          </div>

          <div className={`dropdown-menu ${menuOpen ? 'open' : ''}`}>
            <button onClick={toggleMode}>Toggle Mode</button>
            {userRole === 'admin' && <button onClick={() => router.push('/admin')}>Admin Panel</button>}
            <button onClick={signOut}>Sign Out</button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <section className="chat-box">
        {messages.map((msg, i) => {
          const isBot = msg.sender === 'bot'
          const isDetailed =
            msg.text.includes('**Decision Outcome') ||
            msg.text.includes('**Main Financial Factors') ||
            msg.text.includes('**Conclusion')

          const formatted = isDetailed
            ? msg.text
                .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                .replace(/- /g, '• ')
                .replace(/\n/g, '<br/>')
            : msg.text

          return (
            <div key={i} className={`chat-row ${msg.sender}`}>
              <div className={`chat-avatar ${msg.sender}`}>
                <span className="avatar-initial">{isBot ? 'AI' : 'U'}</span>
              </div>

              <div
                className={`bubble ${msg.sender}`}
                style={{
                  whiteSpace: 'pre-line',
                  lineHeight: 1.6,
                  fontSize: '0.95rem',
                }}
                dangerouslySetInnerHTML={{ __html: formatted }}
              />
            </div>
          )
        })}

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

      {/* Loan Form Button */}
      {email && (
        <button onClick={() => router.push('/loan-form')} className="floating-loan-btn">
          Apply for a Loan
        </button>
      )}

      {/* Survey Modal */}
      <SurveyModal
        open={surveyOpen}
        onClose={() => setSurveyOpen(false)}
        onSubmit={submitSurvey}
        loading={surveySubmitting}
        defaultVariant={mode}
        defaultPrediction={pendingSurveyPrediction || 'Unknown'}
      />
    </main>
  )
}
