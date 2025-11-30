'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
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
import { Bar } from 'react-chartjs-2'
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

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
  const fetchData = async () => {
    if (!email || !ADMIN_EMAILS.includes(email)) return

    try {
      const response = await apiFetch(`/api/v1/survey/`, {
        method: "GET"
      })

      // Backend returns: { success: true, count: X, surveys: [...] }
      if (response?.surveys) {
        setRows(response.surveys as SurveyRow[])
      }
    } catch (err) {
      console.error("❌ Error loading survey results:", err)
    } finally {
      setLoadingData(false)
    }
  }

  fetchData()
}, [email])

  // Helpers
  const byVariant = (v: Variant) => rows.filter(r => r.variant === v)
  const mean = (list: number[]) => list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0
  const uniqUsers = new Set(rows.map(r => r.user_email)).size

  const total = rows.length
  const baselineN = byVariant('baseline').length
  const xaiN = byVariant('xai').length

  // SECTION 2: Mean Trust
  const baselineTrust = mean(byVariant('baseline').map(r => r.trust_score))
  const xaiTrust = mean(byVariant('xai').map(r => r.trust_score))

  const meanTrustData = {
    labels: ['BASELINE', 'XAI'],
    datasets: [
      {
        label: 'Avg Trust',
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
    plugins: { legend: { labels: { color: TEXT } } },
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

  // SECTION 4: Distribution
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

  // SECTION 5: Word Cloud
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
      .sort((a: [string,number], b: [string,number]) => b[1] - a[1])
      .slice(0, 40)

    const max = entries[0]?.[1] ?? 1
    return entries.map(([word, count]) => ({
      word,
      count,
      size: 12 + Math.round((count / max) * 22),
      opacity: 0.5 + (count / max) * 0.5,
    }))
  }, [rows])

  // CSV Export — fixed type
  const downloadCSV = () => {
    const header = [
      'id','created_at','user_email','variant','prediction',
      'trust_score','reasoning_confidence_score','accuracy_score',
      'understanding_score','repeat_usage_score','comfort_score','comment'
    ]

    const csv = [
      header.join(','),
      ...rows.map(r =>
        header
          .map(h => JSON.stringify((r as Record<string,string|number|null>)[h] ?? ""))
          .join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "survey_export.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  // UI Conditions
  if (loading) return <div className="page-center"><div className="card">Checking permissions…</div></div>
  if (!email || !ADMIN_EMAILS.includes(email)) return <div className="page-center"><div className="card">Access denied</div></div>
  if (loadingData) return <div className="page-center"><div className="card">Fetching analytics…</div></div>

  // ================= Render =================
  return (
    <main className="admin-container">
      <header className="chat-header" style={{ position:'sticky', top:0 }}>
        <h2>📊 Trust & XAI Evaluation Dashboard</h2>
        <div style={{ display:'flex', gap:'10px' }}>
          <button className="button secondary" onClick={() => router.push('/chat')}>Back</button>
          <button className="button" onClick={downloadCSV}>Download CSV</button>
        </div>
      </header>

      {/* SECTION 1 */}
      <section className="admin-section">
        <h3 className="admin-section-title">Section 1 — Sample Overview</h3>
        <div className="stats-grid">
          {[["Total Responses", total],["Unique Users", uniqUsers],["Baseline", baselineN],["XAI", xaiN]].map(([label,value]) => (
            <div className="stat-card" key={label}>
              <div className="stat-label">{label}</div>
              <div className="stat-value">{value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2 */}
      <section className="admin-section">
        <h3 className="admin-section-title">Section 2 — Mean Trust</h3>
        <div className="chart-card"><Bar data={meanTrustData} options={meanTrustOptions} /></div>
      </section>

      {/* SECTION 3 */}
      <section className="admin-section">
        <h3 className="admin-section-title">Section 3 — Six Trust Dimensions</h3>
        <div className="chart-card"><Bar data={dimsData} options={dimsOptions} /></div>
      </section>

      {/* SECTION 4 */}
      <section className="admin-section">
        <h3 className="admin-section-title">Section 4 — Distribution (1–5)</h3>
        <div className="chart-card"><Bar data={distData} options={distOptions} /></div>
      </section>

      {/* SECTION 5 */}
      <section className="admin-section">
        <h3 className="admin-section-title">Section 5 — Word Cloud</h3>
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
