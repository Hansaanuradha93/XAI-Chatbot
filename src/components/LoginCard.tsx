'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { apiFetch } from '@/lib/apiClient'   // ✅ make sure this exists

export default function LoginCard() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [registered, setRegistered] = useState(false) // ✅ prevent double calls

  // -----------------------------
  // 1️⃣ After login, register user
  // -----------------------------
  const registerUser = async (userEmail: string) => {
    try {
      const response = await apiFetch("/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail })
      })

      console.log("✅ User registered/loaded:", response)
    } catch (err) {
      console.error("❌ Failed to register user:", err)
    }
  }

  // -----------------------------
  // 2️⃣ Initialize session listener
  // -----------------------------
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      const userEmail = data.session?.user?.email ?? null

      if (userEmail) setEmail(userEmail)
      setLoading(false)
    }

    init()

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const userEmail = session?.user?.email ?? null
      if (!userEmail) return

      setEmail(userEmail)

      // 🔥 Register user ONLY once
      if (!registered) {
        setRegistered(true)
        await registerUser(userEmail)
      }

      router.replace('/chat')
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [router, registered])

  // -----------------------------
  // 3️⃣ Google Login / Logout
  // -----------------------------
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

  // -----------------------------
  // 4️⃣ UI States
  // -----------------------------
  if (loading) {
    return <div className="card"><div>Loading…</div></div>
  }

  if (email) {
    return (
      <div className="card">
        <h2 className="brand" style={{ marginBottom: '0.8rem' }}>TrustAI Portal</h2>
        <p style={{ color: '#555', margin: 0 }}>Signed in as <strong>{email}</strong></p>
        <button
          onClick={logout}
          style={{
            marginTop: 18,
            backgroundColor: '#e53935',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 16px',
            cursor: 'pointer'
          }}
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="brand">TrustAI Portal</div>
      <button className="googleBtn" onClick={login}>
        <Image
          className="googleLogo"
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          width={20}
          height={20}
        />
        Continue with Google
      </button>
      <div className="footer">© 2025 MSc Research — Improving Trust in AI Chatbots</div>
    </div>
  )
}
