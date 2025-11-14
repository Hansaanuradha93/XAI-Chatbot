'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useSession } from '@/hooks/useSession'
import { apiFetch } from '@/lib/apiClient'

/* ---------------------------------------------------------
   STEP COMPONENTS — MUST BE OUTSIDE main component
   to prevent remounting and typing losing focus.
--------------------------------------------------------- */

export function Step1({ form, handleChange }) {
  return (
    <>
      <h2>Personal Information</h2>

      <label>No. of Dependents</label>
      <input
        type="number"
        name="no_of_dependents"
        value={form.no_of_dependents}
        onChange={handleChange}
      />

      <label>Education</label>
      <select
        name="education"
        value={form.education}
        onChange={handleChange}
      >
        <option value="">Select</option>
        <option value="0">Graduate</option>
        <option value="1">Not Graduate</option>
      </select>

      <label>Self Employed</label>
      <select
        name="self_employed"
        value={form.self_employed}
        onChange={handleChange}
      >
        <option value="">Select</option>
        <option value="1">Yes</option>
        <option value="0">No</option>
      </select>
    </>
  )
}

export function Step2({ form, handleChange, dti }) {
  return (
    <>
      <h2>Loan Details</h2>

      {/* --- Annual Income --- */}
      <label>Annual Income (LKR)</label>
      <input
        type="number"
        name="income_annum"
        value={form.income_annum}
        onChange={handleChange}
        min="0"
        required
      />

      {/* --- Loan Amount --- */}
      <label>Loan Amount (LKR)</label>
      <input
        type="number"
        name="loan_amount"
        value={form.loan_amount}
        onChange={handleChange}
        min="0"
        required
      />

      {/* --- Loan Term --- */}
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

      {/* ---- Insights Card ---- */}
      <div className="insights-card">

        {/* Debt-to-Income */}
        <div className="insight">
          <div className="label">Debt-to-Income Ratio</div>
          <div className="value">{(dti * 100).toFixed(1)}%</div>
          <div className="note">Suggested: Under 40%</div>
        </div>

      </div>
    </>
  )
}

export function Step3({ form, handleChange, cibilCategory }) {
  return (
    <>
      <h2>Credit Score Insights</h2>

      {/* --- Credit Score Slider --- */}
      <label>Credit Score: {form.cibil_score}</label>
      <input
        type="range"
        min="300"
        max="900"
        step="1"
        name="cibil_score"
        value={form.cibil_score}
        onChange={handleChange}
      />

      {/* --- Insight Card --- */}
      <div className="insights-card">

        {/* Credit Tier */}
        <div className="insight">
          <div className="label">Credit Category</div>
          <div className="value">{cibilCategory}</div>
          <div className="note">
            Based on your credit score of {form.cibil_score}.
          </div>
        </div>

        {/* Risk Meter */}
        <div className="insight">
          <div className="label">Approval Likelihood</div>
          <div
            className="risk-bar"
            style={{
              width: '100%',
              height: '10px',
              background: '#eee',
              borderRadius: '8px',
              overflow: 'hidden',
              marginTop: '6px'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${((form.cibil_score - 300) / 600) * 100}%`,
                background:
                  form.cibil_score < 600
                    ? '#d9534f'
                    : form.cibil_score < 750
                    ? '#f0ad4e'
                    : '#5cb85c',
                transition: 'width 0.3s'
              }}
            />
          </div>

          <div className="note" style={{ marginTop: '6px' }}>
            Higher credit scores improve your loan approval probability.
          </div>
        </div>
      </div>
    </>
  )
}

export function Step4({ form, handleChange, lta }) {
  return (
    <>
      <h2>Asset Information</h2>

      <label>Residential Assets</label>
      <input
        name="residential_assets_value"
        value={form.residential_assets_value}
        onChange={handleChange}
      />

      <label>Commercial Assets</label>
      <input
        name="commercial_assets_value"
        value={form.commercial_assets_value}
        onChange={handleChange}
      />

      <label>Luxury Assets</label>
      <input
        name="luxury_assets_value"
        value={form.luxury_assets_value}
        onChange={handleChange}
      />

      <label>Bank Assets</label>
      <input
        name="bank_asset_value"
        value={form.bank_asset_value}
        onChange={handleChange}
      />

      {/* Loan-to-Asset Ratio now belongs here */}
      <div className="insights-card">
        <div className="insight">
          <div className="label">Loan-to-Asset Ratio</div>
          <div className="value">{(lta * 100).toFixed(1)}%</div>
          <div className="note">Suggested: Under 80%</div>
        </div>
      </div>
    </>
  )
}

export default function LoanFormPage() {
  const router = useRouter()
  const { email } = useSession()
  const [loading, setLoading] = useState(false)

  const [step, setStep] = useState(1)
  const totalSteps = 4

  const [form, setForm] = useState({
    no_of_dependents: '',
    education: '',
    self_employed: '',
    income_annum: '',
    loan_amount: '',
    loan_term: 6,
    cibil_score: 600,
    residential_assets_value: '',
    commercial_assets_value: '',
    luxury_assets_value: '',
    bank_asset_value: ''
  })

  const mode =
    (typeof window !== 'undefined' &&
      (localStorage.getItem('chat_mode') as 'xai' | 'baseline')) || 'xai'

  /* -----------------------
     FIXED handleChange
     (allows free typing)
  ------------------------- */
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  /* -----------------------
     Auto Calculations
  ------------------------- */
  const income = Number(form.income_annum) || 0
  const loan = Number(form.loan_amount) || 0

  const res = Number(form.residential_assets_value) || 0
  const com = Number(form.commercial_assets_value) || 0
  const lux = Number(form.luxury_assets_value) || 0
  const bank = Number(form.bank_asset_value) || 0

  const totalAssets = res + com + lux + bank
  const dti = income ? loan / income : 0
  const lta = totalAssets ? loan / totalAssets : 0

  const cibilCategory = useMemo(() => {
    if (form.cibil_score < 600) return 'Poor'
    if (form.cibil_score < 750) return 'Fair'
    return 'Excellent'
  }, [form.cibil_score])

  /* -----------------------
     Step Validation
  ------------------------- */
  const canNext = () => {
    if (step === 1)
      return form.no_of_dependents !== '' &&
             form.education !== '' &&
             form.self_employed !== ''

    if (step === 2)
      return income > 0 &&
             loan > 0 &&
             Number(form.loan_term) >= 1

    if (step === 4)
      return form.residential_assets_value !== '' &&
             form.commercial_assets_value !== '' &&
             form.luxury_assets_value !== '' &&
             form.bank_asset_value !== ''

    return true
  }

  /* -----------------------
     Submit Handler
  ------------------------- */
  const handleSubmit = async (e) => {
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
      alert('Error contacting backend.')
    } finally {
      setLoading(false)
    }
  }

  /* -----------------------
     RENDER
  ------------------------- */
  return (
    <main className="page-center">
      <form className="loan-form" onSubmit={handleSubmit}>

        {/* Step Indicator */}
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '8px' }}>
          {[1,2,3,4].map(n => (
            <div
              key={n}
              style={{
                flex: 1,
                height: '6px',
                borderRadius: '4px',
                background: n <= step ? 'var(--brand)' : '#DCE0DA'
              }}
            />
          ))}
        </div>

        {/* Steps */}
        {step === 1 && <Step1 form={form} handleChange={handleChange} />}
        {step === 2 && <Step2 form={form} handleChange={handleChange} dti={dti} />}
        {step === 3 && <Step3 form={form} handleChange={handleChange} cibilCategory={cibilCategory} />}
        {step === 4 && <Step4 form={form} handleChange={handleChange} lta={lta} />}

        {/* Actions */}
        <div className="actions">

          {step > 1 && (
            <button
              type="button"
              className="button secondary"
              onClick={() => setStep(step - 1)}
            >
              Back
            </button>
          )}

          {step < totalSteps && (
            <button
              type="button"
              className="button primary"
              disabled={!canNext()}
              onClick={() => setStep(step + 1)}
            >
              Next
            </button>
          )}

          {step === totalSteps && (
            <button type="submit" className="button primary" disabled={loading}>
              {loading ? 'Analyzing…' : 'Submit'}
            </button>
          )}

        </div>
      </form>
    </main>
  )
}
