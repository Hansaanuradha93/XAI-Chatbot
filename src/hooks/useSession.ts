'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export function useSession(redirectIfMissing = false) {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      const userEmail = data.session?.user?.email ?? null
      setEmail(userEmail)
      setLoading(false)

      if (redirectIfMissing && !userEmail) {
        router.replace('/')
      }
    }
    init()

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const userEmail = session?.user?.email ?? null
      setEmail(userEmail)
      if (redirectIfMissing && !userEmail) router.replace('/')
    })

    return () => { sub.subscription.unsubscribe() }
  }, [redirectIfMissing, router])

  return { email, loading }
}
