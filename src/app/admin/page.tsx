'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useSession } from '@/hooks/useSession'
import { ADMIN_EMAILS } from '@/lib/adminConfig'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface TrustRecord {
  variant: string
  trust_score: number
  comment: string | null
  created_at?: string
}

export default function AdminPage() {
  const router = useRouter()
  const { email, loading } = useSession(true)
  const [records, setRecords] = useState<TrustRecord[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // --- Redirect if not admin ---
  useEffect(() => {
    if (!loading && (!email || !ADMIN_EMAILS.includes(email))) {
      router.replace('/chat')
    }
  }, [email, loading, router])

  // --- Fetch ratings once ---
  useEffect(() => {
    if (!email || !ADMIN_EMAILS.includes(email)) return
    fetchRatings()
  }, [email])

  const fetchRatings = async () => {
    const { data, error } = await supabase
      .from('trust_ratings')
      .select('variant, trust_score, comment, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching ratings:', error)
      setLoadingData(false)
      return
    }

    setRecords(data || [])
    setLoadingData(false)
  }

  if (loading) {
    return (
      <main className="page-center">
        <div className="card">Checking permissions...</div>
      </main>
    )
  }

  if (!email || !ADMIN_EMAILS.includes(email)) {
    return (
      <main className="page-center">
        <div className="card">Access denied. Admins only.</div>
      </main>
    )
  }

  if (loadingData) {
    return (
      <main className="page-center">
        <div className="card">Fetching analytics...</div>
      </main>
    )
  }

  if (!records.length) {
    return (
      <main className="page-center">
        <div className="card">No trust ratings recorded yet.</div>
      </main>
    )
  }

  // --- Aggregations ---
  const variants = ['baseline', 'xai']
  const avgScores = variants.map((v) => {
    const vals = records.filter((r) => r.variant === v).map((r) => r.trust_score)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  })

  const counts = [1, 2, 3, 4, 5].map((score) => {
    return records.filter((r) => r.trust_score === score).length
  })

  // --- Text frequency ---
  const allWords = records
    .flatMap((r) => (r.comment ? r.comment.toLowerCase().split(/\s+/) : []))
    .filter((w) => w.length > 3)
  const wordFreq: Record<string, number> = {}
  allWords.forEach((w) => (wordFreq[w] = (wordFreq[w] || 0) + 1))
  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  // --- Chart 1: Avg Trust by Variant ---
  const variantData = {
    labels: variants.map((v) => v.toUpperCase()),
    datasets: [
      {
        label: 'Average Trust Score',
        data: avgScores,
        backgroundColor: ['#0072ff', '#4caf50'],
      },
    ],
  }

  // --- Chart 2: Trust Rating Distribution ---
  const distData = {
    labels: ['1', '2', '3', '4', '5'],
    datasets: [
      {
        label: 'Number of Ratings',
        data: counts,
        backgroundColor: '#ff9800',
      },
    ],
  }

  // --- Chart 3: Word Frequency (Feedback) ---
  const wordData = {
    labels: topWords.map((w) => w[0]),
    datasets: [
      {
        label: 'Word Frequency in Feedback',
        data: topWords.map((w) => w[1]),
        backgroundColor: '#9c27b0',
      },
    ],
  }

  // --- Layout ---
  return (
    <main className="chat-container" style={{ padding: '2rem', overflowY: 'auto' }}>
      <header className="chat-header" style={{ justifyContent: 'space-between' }}>
        <h2>📊 Trust Analysis Dashboard</h2>
        <div>
          <button onClick={() => router.push('/chat')} className="button">
            Back to Chat
          </button>
        </div>
      </header>

      <section style={{ display: 'grid', gap: '2rem', marginTop: '2rem' }}>
        {/* Chart 1: Average Trust by Variant */}
        <div className="card" style={{ background: '#1b1e24', padding: '1.5rem' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>Average Trust by Variant</h3>
          <Bar data={variantData} />
        </div>

        {/* Chart 2: Distribution */}
        <div className="card" style={{ background: '#1b1e24', padding: '1.5rem' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>Trust Rating Distribution</h3>
          <Bar data={distData} />
        </div>

        {/* Chart 3: Feedback Frequency */}
        <div className="card" style={{ background: '#1b1e24', padding: '1.5rem' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>Most Common Feedback Words</h3>
          {topWords.length > 0 ? <Bar data={wordData} /> : <p>No feedback comments yet.</p>}
        </div>
      </section>
    </main>
  )
}
