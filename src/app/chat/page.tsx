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
      text: '👋 Hello! I’m TrustAI — your personal AI loan advisor.',
    },
    {
      sender: 'bot',
      text: 'Would you like to check your loan eligibility?',
      type: 'action',
    },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed) return

    setMessages((prev) => [...prev, { sender: 'user', text: trimmed }])
    setInput('')
    setThinking(true)

    // Temporary simulated response
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
    }, 1800)
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
          <button onClick={signOut} className="danger">
            Sign out
          </button>
        </div>
      </header>

      {/* Chat messages */}
      <section className="chat-box">
        {messages.map((msg, i) => (
          <div key={i} className={`bubble ${msg.sender}`}>
            {msg.text}

            {/* Special "Apply for Loan" action bubble */}
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

      {/* Input bar */}
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
