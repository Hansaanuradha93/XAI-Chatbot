'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useSession } from '@/hooks/useSession'
import { apiFetch } from '@/lib/apiClient'

export default function LoanFormPage() {
  const router = useRouter()
  const { email } = useSession()
  const [loading, setLoading] = useState(false)

  // ✅ Include all required fields for /loan_form_test
  const [form, setForm] = useState({
    no_of_dependents: '',
    education: '',
    self_employed: '',
    income_annum: '',
    loan_amount: '',
    loan_term: '',
    cibil_score: '',
    residential_assets_value: '',
    commercial_assets_value: '',
    luxury_assets_value: '',
    bank_asset_value: ''
  })

  // ✅ Retrieve active mode from localStorage
  const mode =
    (typeof window !== 'undefined' &&
      (localStorage.getItem('chat_mode') as 'xai' | 'baseline')) || 'xai'

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // --- Basic validation ---
    const income = Number(form.income_annum)
    const loan = Number(form.loan_amount)
    const term = Number(form.loan_term)
    const score = Number(form.cibil_score)

    if (income < 0 || loan < 0) {
      alert('Income and loan amount must be 0 or greater.')
      return
    }
    if (term < 1 || term > 12) {
      alert('Repayment duration must be between 1 and 12 months.')
      return
    }
    if (score < 300 || score > 900) {
      alert('Credit Score must be between 300 and 900.')
      return
    }

    setLoading(true)
    try {
      const data = await apiFetch(`/loan_form_test?variant=${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          no_of_dependents: Number(form.no_of_dependents),
          education: Number(form.education),
          self_employed: Number(form.self_employed),
          income_annum: income,
          loan_amount: loan,
          loan_term: term,
          cibil_score: score,
          residential_assets_value: Number(form.residential_assets_value),
          commercial_assets_value: Number(form.commercial_assets_value),
          luxury_assets_value: Number(form.luxury_assets_value),
          bank_asset_value: Number(form.bank_asset_value)
        })
      })

      // --- Format bot message ---
      let explanationText = ''
      if (data.explanation && typeof data.explanation === 'object') {
        const entries = Object.entries(data.explanation)
        if (entries.length > 0) {
          explanationText = entries
            .map(([f, v]) => `${f}: ${Number(v).toFixed(4)}`)
            .join('\n')
        }
      }

      const botMessage = data.human_message || `Loan Decision: ${data.prediction}`

      // --- Save both user + bot messages in Supabase ---
      if (email) {
        const { error } = await supabase.from('chat_history').insert([
          {
            user_email: email,
            sender: 'user',
            message: `Loan Form Submitted:\n${JSON.stringify(form, null, 2)}`,
            variant: mode
          },
          {
            user_email: email,
            sender: 'bot',
            message: botMessage,
            variant: mode
          }
        ])
        if (error) console.error('❌ Error saving chat to Supabase:', error)
      }

      router.push('/chat')
    } catch (err) {
      console.error('❌ API Error:', err)
      alert('Error connecting to backend API.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-center">
      <form className="loan-form" onSubmit={handleSubmit}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1>Loan Application</h1>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '8px',
              background: mode === 'xai' ? '#1e8e3e' : '#888',
              fontSize: '0.8rem',
              color: 'white'
            }}
          >
            {mode === 'xai' ? 'Explainable Mode' : 'Baseline Mode'}
          </span>
        </div>

        {/* --- Basic Details --- */}
        <label>No. of Dependents</label>
        <input
          type="number"
          name="no_of_dependents"
          value={form.no_of_dependents}
          onChange={handleChange}
          min="0"
          required
        />

        <label>Education Level</label>
        <select name="education" value={form.education} onChange={handleChange} required>
          <option value="">Select...</option>
          <option value="0">Graduate</option>
          <option value="1">Not Graduate</option>
        </select>

        <label>Self Employed</label>
        <select
          name="self_employed"
          value={form.self_employed}
          onChange={handleChange}
          required
        >
          <option value="">Select...</option>
          <option value="1">Yes</option>
          <option value="0">No</option>
        </select>

        <label>Annual Income (LKR)</label>
        <input
          type="number"
          name="income_annum"
          value={form.income_annum}
          onChange={handleChange}
          min="0"
          required
        />

        <label>Loan Amount (LKR)</label>
        <input
          type="number"
          name="loan_amount"
          value={form.loan_amount}
          onChange={handleChange}
          min="0"
          required
        />

        <label>Loan Term (Months)</label>
        <input
          type="number"
          name="loan_term"
          value={form.loan_term}
          onChange={handleChange}
          min="1"
          max="12"
          required
        />

        <label>Credit Score (300–900)</label>
        <input
          type="number"
          name="cibil_score"
          value={form.cibil_score}
          onChange={handleChange}
          min="300"
          max="900"
          required
        />

        {/* --- Asset Values --- */}
        <h3>Assets</h3>
        <label>Residential Assets (LKR)</label>
        <input
          type="number"
          name="residential_assets_value"
          value={form.residential_assets_value}
          onChange={handleChange}
          min="0"
          required
        />

        <label>Commercial Assets (LKR)</label>
        <input
          type="number"
          name="commercial_assets_value"
          value={form.commercial_assets_value}
          onChange={handleChange}
          min="0"
          required
        />

        <label>Luxury Assets (LKR)</label>
        <input
          type="number"
          name="luxury_assets_value"
          value={form.luxury_assets_value}
          onChange={handleChange}
          min="0"
          required
        />

        <label>Bank Assets (LKR)</label>
        <input
          type="number"
          name="bank_asset_value"
          value={form.bank_asset_value}
          onChange={handleChange}
          min="0"
          required
        />

        <div className="actions">
          <button type="button" onClick={() => router.push('/chat')} className="button secondary">
            Back
          </button>
          <button type="submit" className="button primary" disabled={loading}>
            {loading ? 'Analyzing...' : 'Submit'}
          </button>
        </div>
      </form>
    </main>
  )
}
