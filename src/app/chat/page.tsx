'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useSession } from '@/hooks/useSession'
import { apiFetch } from '@/lib/apiClient'
import { SurveyModal } from '@/components/survey/SurveyModal'

interface Message {
  id: string
  sender: 'user' | 'bot'
  text: string
  context?: string | null
  prediction?: string | null
  survey_completed?: boolean
}

export default function ChatPage() {
  const router = useRouter()
  const { email, loading } = useSession(true)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [menuOpen, setMenuOpen] = useState(false)
  const [mode, setMode] = useState<'xai' | 'baseline'>(
    (typeof window !== 'undefined' &&
      (localStorage.getItem('chat_mode') as 'xai' | 'baseline')) || 'xai'
  )
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user')

  // SURVEY STATE
  const [surveyOpen, setSurveyOpen] = useState(false)
  const [surveySubmitting, setSurveySubmitting] = useState(false)
  const [pendingPrediction, setPendingPrediction] = useState<string | null>(null)
  const [pendingHistoryId, setPendingHistoryId] = useState<string | null>(null)

  // LOCAL visibility store by message ID
  const [surveyCompletedMap, setSurveyCompletedMap] = useState<Record<string, boolean>>({})

  /* --------------------- Dropdown closing --------------------- */
  useEffect(() => {
    const close = () => setMenuOpen(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [])

  /* --------------------- Toggle A/B Test Mode ------------------ */
  const toggleMode = async () => {
    const newMode = mode === 'xai' ? 'baseline' : 'xai'
    try {
      await apiFetch(`/api/v1/users/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mode: newMode })
      })
      setMode(newMode)
      localStorage.setItem('chat_mode', newMode)
    } catch {}
  }

  /* ----------------------- Sign out ---------------------- */

  const signOut = async () => {
  await supabase.auth.signOut()
  router.replace('/')
}

  /* ----------------------- Scroll bottom ---------------------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  /* --------------------- Load Chat History --------------------- */
  useEffect(() => {
    if (!email) return

    const load = async () => {
      const { data, error } = await supabase
        .from('chat_history')
        .select('id, sender, message, context, prediction, survey_completed')
        .eq('user_email', email)
        .order('timestamp', { ascending: true })

      if (error) return console.error(error)

      const mapped = data.map((m) => ({
        id: m.id,
        sender: m.sender,
        text: m.message,
        context: m.context,
        prediction: m.prediction,
        survey_completed: m.survey_completed
      }))

      // build local survey state
      const map: Record<string, boolean> = {}
      mapped.forEach((m) => {
        if (m.survey_completed) map[m.id] = true
      })

      setSurveyCompletedMap(map)
      setMessages(mapped)
    }

    load()
  }, [email])

  /* --------------------- Fetch User Mode/Role ------------------ */
  useEffect(() => {
    if (!email) return

    const load = async () => {
      try {
        const data = await apiFetch(`/api/v1/users/mode?email=${email}`, { method: 'GET' })
        if (data.mode) {
          setMode(data.mode)
          localStorage.setItem('chat_mode', data.mode)
        }
        if (data.role) setUserRole(data.role)
      } catch {}
    }

    load()
  }, [email])

  /* ---------------- Save Message to Supabase ------------------ */
  const saveMessage = async (sender: 'user' | 'bot', text: string) => {
    if (!email) return
    await supabase.from('chat_history').insert({
      user_email: email,
      sender,
      message: text,
      variant: mode
    })
  }

  /* ------------------------ SURVEY FLOW ------------------------ */
  const openSurveyFor = (prediction: string, historyId: string) => {
    setPendingPrediction(prediction)
    setPendingHistoryId(historyId)
    setSurveyOpen(true)
  }

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
    if (!email || !pendingPrediction || !pendingHistoryId) return

    setSurveySubmitting(true)

    try {
      // Save survey
      await apiFetch(`/api/v1/survey/loan-trust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: email,
          variant: mode,
          prediction: pendingPrediction,
          trust: payload.trust,
          feedback: payload.feedback
        })
      })

      // Update Supabase row
      await supabase
        .from('chat_history')
        .update({ survey_completed: true })
        .eq('id', pendingHistoryId)

      // Update local state
      setSurveyCompletedMap((prev) => ({
        ...prev,
        [pendingHistoryId]: true
      }))

      const thanks = 'Thanks for completing the trust survey!'
      setMessages((prev) => [...prev, { id: 'temp-' + Date.now(), sender: 'bot', text: thanks }])
      saveMessage('bot', thanks)
    } catch (e) {
      console.error(e)
    }

    setSurveySubmitting(false)
    setSurveyOpen(false)
  }

  /* --------------------- SEND FAQ MESSAGE --------------------- */
  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed) return

    setMessages((prev) => [...prev, { id: 'temp-' + Date.now(), sender: 'user', text: trimmed }])
    saveMessage('user', trimmed)
    setInput('')
    setThinking(true)

    try {
      const data = await apiFetch(`/api/v1/faq/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, user_email: email })
      })

      setThinking(false)

      const botMsg = data.answer || 'Sorry, I couldn’t find an answer.'
      setMessages((prev) => [...prev, { id: 'temp-' + Date.now(), sender: 'bot', text: botMsg }])
      saveMessage('bot', botMsg)
    } catch {
      const err = 'Error contacting backend.'
      setMessages((prev) => [...prev, { id: 'temp-' + Date.now(), sender: 'bot', text: err }])
      saveMessage('bot', err)
      setThinking(false)
    }
  }

  /* ------------------------ RENDER ------------------------ */
  if (loading) {
    return (
      <main className="page-center">
        <div className="card">Loading…</div>
      </main>
    )
  }

  return (
    <main className="chat-container">
      {/* HEADER */}
      <header className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2>Financial Chatbot</h2>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: '8px',
              background: mode === 'xai' ? '#1e8e3e' : '#888',
              fontSize: '0.8rem',
              color: 'white'
            }}
          >
            {mode === 'xai' ? 'Explainable Mode' : 'Baseline Mode'}
          </span>
        </div>

        <div
          className="dropdown"
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen((o) => !o)
          }}
        >
          <div className="chat-avatar dropdown-toggle">
            {email?.charAt(0).toUpperCase()}
          </div>

          <div className={`dropdown-menu ${menuOpen ? 'open' : ''}`}>
            <button onClick={toggleMode}>Toggle Mode</button>
            {userRole === 'admin' && <button onClick={() => router.push('/admin')}>Admin Panel</button>}
            <button onClick={signOut}>Sign Out</button>
          </div>
        </div>
      </header>

      {/* GREETING */}
      <section className="chat-box">
        <div className="chat-row bot">
          <div className="chat-avatar bot"><span className="avatar-initial">AI</span></div>
          <div className="bubble bot">Hello! I’m TrustAI — your personal AI loan advisor.</div>
        </div>

        <div className="chat-row bot">
          <div className="chat-avatar bot"><span className="avatar-initial">AI</span></div>
          <div className="bubble bot">You can check your loan eligibility or ask me financial FAQs.</div>
        </div>

        {/* REAL MESSAGES */}
        {messages.map((msg, i) => {
  const isBot = msg.sender === 'bot'

  // 🔥 ADD THIS HERE — EXACT POSITION 🔥
  const isDetailed =
    msg.text.includes('**Decision Outcome') ||
    msg.text.includes('**Main Financial Factors') ||
    msg.text.includes('**Polite Closing Remark') ||
    msg.text.includes('**Confidence Level') ||
    msg.text.match(/^\d+\./m) // numbered sections like 1. 2. 3.

  const formatted = isDetailed
    ? msg.text
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/- /g, '• ')
        .replace(/\n/g, '<br/>')
    : msg.text
  // 🔥 STOP PASTING HERE 🔥

  const showSurveyButton =
    isBot &&
    msg.context === 'loan' &&
    msg.prediction &&
    !surveyCompletedMap[msg.id] &&
    msg.id

  return (
    <div key={i}>
      <div className={`chat-row ${msg.sender}`}>
        <div className={`chat-avatar ${msg.sender}`}>
          <span className="avatar-initial">{isBot ? 'AI' : 'U'}</span>
        </div>

        <div
          className={`bubble ${msg.sender}`}
          style={{ whiteSpace: 'pre-line', lineHeight: 1.6, fontSize: '0.95rem' }}
          dangerouslySetInnerHTML={{ __html: formatted }}   // ⬅️ Now works again
        />
      </div>

      {showSurveyButton && (
        <div className="bubble-actions bot">
          <button
            className="survey-btn"
            onClick={() => openSurveyFor(msg.prediction!, msg.id!)}
          >
            Take quick trust survey
          </button>
        </div>
      )}
    </div>
  )
})}

        <div ref={messagesEndRef} />
      </section>

      {/* INPUT */}
      <footer className="input-bar">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage}>➤</button>
      </footer>

      {/* LOAN FORM FLOATING BUTTON */}
      {email && (
        <button onClick={() => router.push('/loan-form')} className="floating-loan-btn">
          Apply for a Loan
        </button>
      )}

      <SurveyModal
        open={surveyOpen}
        onClose={() => setSurveyOpen(false)}
        onSubmit={submitSurvey}
        loading={surveySubmitting}
        defaultVariant={mode}
        defaultPrediction={pendingPrediction || 'Unknown'}
      />
    </main>
  )
}
