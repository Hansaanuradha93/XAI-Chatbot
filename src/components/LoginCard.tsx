'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function LoginCard() {
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check session on mount
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      setEmail(data.session?.user?.email ?? null)
      setLoading(false)
    }
    init()

    // Listen for auth state changes (e.g., after redirect)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null)
    })
    return () => { sub.subscription.unsubscribe() }
  }, [])

  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: process.env.NEXT_PUBLIC_SITE_URL }
    })
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setEmail(null)
  }

  if (loading) {
    return <div className="card"><div>Loading…</div></div>
  }

  // If logged in, show simple “signed in” state (we’ll add /chat later)
  if (email) {
    return (
      <div className="card">
        <h2 className="brand" style={{ marginBottom: '0.8rem' }}>TrustAI Portal</h2>
        <p style={{ color: '#555', margin: 0 }}>Signed in as <strong>{email}</strong></p>
        <button onClick={logout}
          style={{ marginTop: 18, backgroundColor: '#e53935', color: '#fff', border: 'none',
                   borderRadius: 8, padding: '10px 16px', cursor: 'pointer' }}>
          Sign out
        </button>
      </div>
    )
  }

  // Logged-out view
  return (
    <div className="card">
      <div className="brand">TrustAI Portal</div>
      <button className="googleBtn" onClick={login}>
        <Image className="googleLogo"
               src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
               alt="Google" width={20} height={20} />
        Continue with Google
      </button>
      <div className="footer">© 2025 MSc Research — Improving Trust in AI Chatbots</div>
    </div>
  )
}
