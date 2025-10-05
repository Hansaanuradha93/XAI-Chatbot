'use client'

import { useRouter } from 'next/navigation'
import { useSession } from '@/hooks/useSession'
import { supabase } from '@/lib/supabaseClient'
import { useState } from 'react'

export default function ChatPage() {
  const router = useRouter()
  const { email, loading } = useSession(true)   // true → redirect if missing
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)

  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  const sendQuestion = async () => {
    if (!question.trim()) return
    // placeholder — later call FastAPI here
    setAnswer('Your loan was denied due to your credit score and debt-to-income ratio.')
  }

  if (loading) {
    return (
      <main className="page-center">
        <div className="card">Loading…</div>
      </main>
    )
  }

  return (
    <main className="page-center">
      <div className="card" style={{ width: 600 }}>
        <h2 style={{ color: 'var(--brand)', marginTop: 0 }}>Welcome, {email}</h2>
        <p style={{ color: '#555' }}>You are now logged in to the TrustAI Research Portal.</p>

        <div style={{ marginTop: 24, textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Ask a financial question
          </label>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., Why was my loan denied?"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              outline: 'none'
            }}
          />
          <button
            onClick={sendQuestion}
            style={{
              marginTop: 12,
              backgroundColor: 'var(--brand)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              cursor: 'pointer'
            }}
          >
            Send
          </button>
        </div>

        {answer && (
          <div style={{ marginTop: 18, padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e5e7eb' }}>
            <strong>Answer</strong>
            <div style={{ marginTop: 6 }}>{answer}</div>
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={signOut}
            style={{
              backgroundColor: '#e53935',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              cursor: 'pointer'
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </main>
  )
}
