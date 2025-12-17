'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/hooks/useSession'
import { ADMIN_EMAILS } from '@/lib/adminConfig'
import { apiFetch } from '@/lib/apiClient'

// ===== Read CSS variables =====
function cssVar(name: string) {
  if (typeof window === "undefined") return ""
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
const BRAND = cssVar("--brand")
const BRAND_HOVER = cssVar("--brand-hover")
const MUTED = cssVar("--muted")
const TEXT = cssVar("--text")
const BORDER = cssVar("--border")

// ===== Chart.js =====
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
)

// ===== Types =====
type Variant = 'baseline' | 'xai'

type SurveyRow = {
  id: number
  created_at: string
  user_email: string
  variant: Variant
  prediction: string
  trust_score: number
  reasoning_confidence_score: number
  accuracy_score: number
  understanding_score: number
  repeat_usage_score: number
  comfort_score: number
  comment: string | null
}

export default function AdminPage() {
  const router = useRouter()
  const { email, loading } = useSession(true)

  const [rows, setRows] = useState<SurveyRow[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Gate: only Admins
  useEffect(() => {
    if (!loading && (!email || !ADMIN_EMAILS.includes(email))) {
      router.replace('/chat')
    }
  }, [email, loading, router])

  // Fetch survey results
  useEffect(() => {
    const fetchSurveyData = async () => {
      if (!email || !ADMIN_EMAILS.includes(email)) return

      try {
        const response = await apiFetch(`/api/v1/survey/`, {
          method: "GET"
        })

        if (response?.surveys) {
          setRows(response.surveys as SurveyRow[])
        }
      } catch (err) {
        console.error("❌ Error loading survey results:", err)
      } finally {
        setLoadingData(false)
      }
    }

    fetchSurveyData()
  }, [email])

  // ===== Helpers =====
  const byVariant = (v: Variant) => rows.filter(r => r.variant === v)
  const mean = (list: number[]) =>
    list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0

  const uniqUsers = new Set(rows.map(r => r.user_email)).size
  const total = rows.length
  const baselineN = byVariant('baseline').length
  const xaiN = byVariant('xai').length

  // ===== SECTION 2: Mean Trust Index =====
  const trustIndex = (r: SurveyRow) =>
    mean([
      r.trust_score,
      r.reasoning_confidence_score,
      r.accuracy_score,
      r.understanding_score,
      r.repeat_usage_score,
      r.comfort_score,
    ])

  const baselineTrust = mean(
    byVariant('baseline').map(r => trustIndex(r))
  )

  const xaiTrust = mean(
    byVariant('xai').map(r => trustIndex(r))
  )

  const meanTrustData = {
    labels: ['BASELINE', 'XAI'],
    datasets: [
      {
        label: 'Avg Trust Index',
        data: [baselineTrust, xaiTrust],
        backgroundColor: [MUTED, BRAND],
        borderColor: BORDER,
        borderWidth: 1.5,
      },
    ],
  }

  const meanTrustOptions = {
    scales: {
      x: { ticks: { color: TEXT }, grid: { color: BORDER } },
      y: { min: 0, max: 5, ticks: { color: TEXT, stepSize: 1 }, grid: { color: BORDER } },
    },
    plugins: {
      legend: { labels: { color: TEXT } },
      datalabels: {
        color: TEXT,
        anchor: 'end',
        align: 'top',
        font: { weight: 'regular', size: 12 },
        formatter: (value: number) => value.toFixed(2),
      },
    },
  }
  // SECTION 3: Dimensions
  const dims = [
    { key: 'trust_score', label: 'Trust' },
    { key: 'reasoning_confidence_score', label: 'Reasoning Confidence' },
    { key: 'accuracy_score', label: 'Accuracy' },
    { key: 'understanding_score', label: 'Understanding' },
    { key: 'repeat_usage_score', label: 'Repeat Usage' },
    { key: 'comfort_score', label: 'Comfort' },
  ] as const

  const baselineDimMeans = dims.map(d => mean(byVariant('baseline').map(r => r[d.key])))
  const xaiDimMeans = dims.map(d => mean(byVariant('xai').map(r => r[d.key])))

  const dimsData = {
    labels: dims.map(d => d.label),
    datasets: [
      {
        label: "Baseline",
        data: baselineDimMeans,
        backgroundColor: MUTED,
        borderColor: BORDER,
        borderWidth: 1.5,
      },
      {
        label: "XAI",
        data: xaiDimMeans,
        backgroundColor: BRAND,
        borderColor: BORDER,
        borderWidth: 1.5,
      }
    ],
  }

  const dimsOptions = meanTrustOptions

  // ===== SECTION 4: Distribution (UNCHANGED) =====
  const buckets = [1,2,3,4,5]
  const baselineDist = buckets.map(b => byVariant('baseline').filter(r => r.trust_score === b).length)
  const xaiDist = buckets.map(b => byVariant('xai').filter(r => r.trust_score === b).length)

  const distData = {
    labels: buckets.map(String),
    datasets: [
      { label: "Baseline", data: baselineDist, backgroundColor: MUTED, borderColor: BORDER, borderWidth: 1.5 },
      { label: "XAI", data: xaiDist, backgroundColor: BRAND, borderColor: BORDER, borderWidth: 1.5 },
    ]
  }

  const distOptions = {
    scales: {
      x: { ticks: { color: TEXT }, grid: { color: BORDER }},
      y: { beginAtZero: true, ticks: { stepSize: 1, color: TEXT }, grid: { color: BORDER }},
    },
    plugins: { legend: { labels: { color: TEXT } } },
  }

  // ===== SECTION 5: Word Cloud (UNCHANGED) =====
  const topWords = useMemo(() => {
    const freq: Record<string, number> = {}
    const stop = new Set(['the','and','for','with','from','that','this','your','have','was',
      'were','about','into','very','more','less','then','also','just','they','are'])

    rows.forEach(r => {
      if (!r.comment) return
      r.comment.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stop.has(w))
        .forEach(w => freq[w] = (freq[w] || 0) + 1)
    })

    const entries = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40)

    const max = entries[0]?.[1] ?? 1
    return entries.map(([word, count]) => ({
      word,
      count,
      size: 12 + Math.round((count / max) * 22),
      opacity: 0.5 + (count / max) * 0.5,
    }))
  }, [rows])

  // ===== UI Conditions =====
  if (loading) return <div className="page-center"><div className="card">Checking permissions…</div></div>
  if (!email || !ADMIN_EMAILS.includes(email)) return <div className="page-center"><div className="card">Access denied</div></div>
  if (loadingData) return <div className="page-center"><div className="card">Fetching analytics…</div></div>

  // ================= Render =================
  return (
    <main className="admin-container">
      <header className="chat-header" style={{ position:'sticky', top:0 }}>
        <h2>Dashboard</h2>
        <div style={{ display:'flex', gap:'10px' }}>
          <button className="button secondary" onClick={() => router.push('/chat')}>Back</button>
        </div>
      </header>

      <section className="admin-section">
        <h3 className="admin-section-title">Section 1 - Sample Overview</h3>
        <div className="stats-grid">
          {[["Total Responses", total],["Unique Users", uniqUsers],["Baseline", baselineN],["XAI", xaiN]].map(([label,value]) => (
            <div className="stat-card" key={label}>
              <div className="stat-label">{label}</div>
              <div className="stat-value">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <h3 className="admin-section-title">Section 2 - Average Trust Index</h3>
        <div className="chart-card">
          <Bar data={meanTrustData} options={meanTrustOptions} />
        </div>
      </section>

      <section className="admin-section">
        <h3 className="admin-section-title">Section 3 - Six Trust Dimensions</h3>
        <div className="chart-card"><Bar data={dimsData} options={dimsOptions} /></div>
      </section>

      <section className="admin-section">
        <h3 className="admin-section-title">Section 4 - Distribution (1–5)</h3>
        <div className="chart-card"><Bar data={distData} options={distOptions} /></div>
      </section>

      <section className="admin-section">
        <h3 className="admin-section-title">Section 5 - Word Cloud</h3>
        {topWords.length ? (
          <div className="word-cloud">
            {topWords.map((w,i) => (
              <span key={i} style={{ fontSize:w.size, opacity:w.opacity }} className="word-token">
                {w.word}
              </span>
            ))}
          </div>
        ) : (
          <div>No feedback yet.</div>
        )}
      </section>
    </main>
  )
}
