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

export default function ChatPage() {
  const router = useRouter()
  const { email, loading } = useSession(true)
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: '👋 Hello! I’m TrustAI — your personal AI loan advisor.'
    },
    {
      sender: 'bot',
      text: 'Would you like to check your loan eligibility?',
      type: 'action'
    }
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // --- Sign out handler ---
  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  // --- Auto-scroll when new messages appear ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  // --- Check for saved loan result from /loan-form ---
  useEffect(() => {
    setTimeout(() => {
      const saved = localStorage.getItem('loan_result')
      console.log('🔍 Checking loan_result in localStorage:', saved)

      if (saved) {
        const result = JSON.parse(saved)
        localStorage.removeItem('loan_result')

        // Format explanation text
        let explanationText = ''
        if (result.explanation && typeof result.explanation === 'object') {
          explanationText = Object.entries(result.explanation)
            .map(([feature, impact]) => `${feature}: ${impact}`)
            .join('\n')
        }

        const messageText =
          `💡 Loan Decision: ${result.prediction}\n\n` +
          (explanationText
            ? `Explanation:\n${explanationText}`
            : 'No explanation available.')

        console.log('✅ Showing result message:', messageText)

        setMessages(prev => [
          ...prev,
          { sender: 'bot', text: messageText }
        ])
      }
    }, 500)
  }, [])

  // --- Send normal chat messages (mock logic) ---
  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed) return

    setMessages(prev => [...prev, { sender: 'user', text: trimmed }])
    setInput('')
    setThinking(true)

    // Temporary AI simulation
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

  if (loading) {
    return (
      <main className="page-center">
        <div className="card">Loading…</div>
      </main>
    )
  }

  return (
    <main className="chat-container">
      {/* --- Header --- */}
      <header className="chat-header">
        <h2>TrustAI Chatbot</h2>
        <div className="user-info">
          <span>{email}</span>
          <button onClick={signOut} className="danger">
            Sign out
          </button>
        </div>
      </header>

      {/* --- Chat Messages --- */}
      <section className="chat-box">
        {messages.map((msg, i) => (
          <div key={i} className={`bubble ${msg.sender}`}>
            {msg.text}

            {/* Action bubble (loan form button) */}
            {msg.type === 'action' && (
              <div style={{ marginTop: '10px', textAlign: 'center' }}>
                <button
                  onClick={() => router.push('/loan-form')}
                  className="button"
                >
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
        <div ref={messagesEndRef} />
      </section>

      {/* --- Input Bar --- */}
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
