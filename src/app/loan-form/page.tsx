'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useSession } from '@/hooks/useSession'
import { apiFetch } from '@/lib/apiClient'

export default function LoanFormPage() {
  const router = useRouter()
  const { email } = useSession()
  const [loading, setLoading] = useState(false)

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

  const mode =
    (typeof window !== 'undefined' &&
      (localStorage.getItem('chat_mode') as 'xai' | 'baseline')) || 'xai'

  // ----------------------------
  // 📌 CALCULATED VALUES (auto)
  // ----------------------------
  const income = Number(form.income_annum) || 0
  const loan = Number(form.loan_amount) || 0
  const res = Number(form.residential_assets_value) || 0
  const com = Number(form.commercial_assets_value) || 0
  const lux = Number(form.luxury_assets_value) || 0
  const bank = Number(form.bank_asset_value) || 0

  const totalAssets = res + com + lux + bank
  const dtiRatio = income > 0 ? loan / income : 0
  const loanToAsset = totalAssets > 0 ? loan / totalAssets : 0

  const cibilCategory = useMemo(() => {
    const score = Number(form.cibil_score)
    if (!score) return 'Unknown'
    if (score < 600) return 'Poor'
    if (score < 750) return 'Fair'
    return 'Excellent'
  }, [form.cibil_score])

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = await apiFetch(`/api/v1/loan/approval?variant=${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          no_of_dependents: Number(form.no_of_dependents),
          education: Number(form.education),
          self_employed: Number(form.self_employed),
          income_annum: income,
          loan_amount: loan,
          loan_term: Number(form.loan_term),
          cibil_score: Number(form.cibil_score),
          residential_assets_value: res,
          commercial_assets_value: com,
          luxury_assets_value: lux,
          bank_asset_value: bank
        })
      })

      if (email) {
        await supabase.from('chat_history').insert([
          {
            user_email: email,
            sender: 'user',
            message: `Loan Form Submitted:\n${JSON.stringify(form, null, 2)}`,
            variant: mode
          },
          {
            user_email: email,
            sender: 'bot',
            message: data.human_message || `Loan Decision: ${data.prediction}`,
            variant: mode
          }
        ])
      }

      router.push('/chat')
    } catch (err) {
      console.error(err)
      alert('Error contacting backend')
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

        <h2>A. Personal Information</h2>
        <label>No. of Dependents</label>
        <input name="no_of_dependents" value={form.no_of_dependents} onChange={handleChange} />

        <h2>B. Loan Details</h2>

        <label>Annual Income (LKR)</label>
        <input name="income_annum" value={form.income_annum} onChange={handleChange} />

        <label>Loan Amount (LKR)</label>
        <input name="loan_amount" value={form.loan_amount} onChange={handleChange} />

        {/* 📌 DTI WIDGET */}
        <div className="info-box">
          <b>Debt-to-Income Ratio:</b> {isFinite(dtiRatio) ? (dtiRatio * 100).toFixed(1) + '%' : '0%'}
          <br />
          {dtiRatio > 0.4 && <span style={{ color: 'red' }}>High Risk</span>}
          {dtiRatio <= 0.4 && <span style={{ color: 'green' }}>Healthy</span>}
        </div>

        <label>Loan Term (Months)</label>
        <input name="loan_term" value={form.loan_term} onChange={handleChange} />

        <h2>C. Credit Score</h2>
        <label>Credit Score (300–900)</label>
        <input name="cibil_score" value={form.cibil_score} onChange={handleChange} />

        {/* 📌 CIBIL CATEGORY */}
        <div className="info-box">
          <b>Score Category:</b> {cibilCategory}
        </div>

        <h2>D. Assets</h2>

        <label>Residential Assets</label>
        <input name="residential_assets_value" value={form.residential_assets_value} onChange={handleChange} />

        <label>Commercial Assets</label>
        <input name="commercial_assets_value" value={form.commercial_assets_value} onChange={handleChange} />

        <label>Luxury Assets</label>
        <input name="luxury_assets_value" value={form.luxury_assets_value} onChange={handleChange} />

        <label>Bank Assets</label>
        <input name="bank_asset_value" value={form.bank_asset_value} onChange={handleChange} />

        {/* 📌 TOTAL ASSETS */}
        <div className="info-box">
          <b>Total Asset Value:</b> Rs. {totalAssets.toLocaleString()}
        </div>

        {/* 📌 Loan-to-Asset Ratio */}
        {totalAssets > 0 && (
          <div className="info-box">
            <b>Loan-to-Asset Ratio:</b> {loanToAsset.toFixed(2)}
            <br />
            {loanToAsset < 0.25 ? (
              <span style={{ color: 'green' }}>Low Risk</span>
            ) : (
              <span style={{ color: 'red' }}>High Risk</span>
            )}
          </div>
        )}

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
