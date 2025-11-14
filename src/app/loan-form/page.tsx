'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useSession } from '@/hooks/useSession'
import { apiFetch } from '@/lib/apiClient'

/* ============================================================
   TOOLTIP LABEL WITH REQUIRED ASTERISK
   ============================================================ */
const Label = ({ children, tip, required }) => (
  <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
    {children}
    {required && <span className="required-star">*</span>}
    <span className="tooltip-icon">ⓘ
      <span className="tooltip-text">{tip}</span>
    </span>
  </label>
);

/* ============================================================
   STEP COMPONENTS
   ============================================================ */

function Step1({ form, handleChange }) {
  return (
    <>
      <h2>Step 1 of 4 — Personal Information</h2>

      <Label tip="Number of people depending on your income." required>
        No. of Dependents
      </Label>
      <input
        type="number"
        placeholder="e.g., 2"
        name="no_of_dependents"
        value={form.no_of_dependents}
        onChange={handleChange}
      />

      <Label tip="Higher education improves creditworthiness." required>
        Education
      </Label>
      <select name="education" value={form.education} onChange={handleChange}>
        <option value="">Select education</option>
        <option value="0">Graduate</option>
        <option value="1">Not Graduate</option>
      </select>

      <Label tip="Self-employed applicants may have variable income." required>
        Self Employed
      </Label>
      <select
        name="self_employed"
        value={form.self_employed}
        onChange={handleChange}
      >
        <option value="">Select option</option>
        <option value="1">Yes</option>
        <option value="0">No</option>
      </select>
    </>
  )
}

function Step2({ form, handleChange, inlineErrors, dti, ratioColor }) {
  return (
    <>
      <h2>Step 2 of 4 — Loan Details</h2>

      <Label tip="Your total yearly income before tax." required>
        Annual Income (LKR)
      </Label>
      <input
        type="number"
        placeholder="e.g., 1200000"
        name="income_annum"
        value={form.income_annum}
        onChange={handleChange}
      />
      {inlineErrors.income_annum && <p className="error">{inlineErrors.income_annum}</p>}

      <Label tip="The amount you are requesting to borrow." required>
        Loan Amount (LKR)
      </Label>
      <input
        type="number"
        placeholder="e.g., 500000"
        name="loan_amount"
        value={form.loan_amount}
        onChange={handleChange}
      />
      {inlineErrors.loan_amount && <p className="error">{inlineErrors.loan_amount}</p>}

      <Label tip="Shorter terms reduce risk for lenders." required>
        Loan Term (Months)
      </Label>
      <input
        type="number"
        placeholder="1–12"
        name="loan_term"
        value={form.loan_term}
        onChange={handleChange}
      />
      {inlineErrors.loan_term && <p className="error">{inlineErrors.loan_term}</p>}

      <div className="insights-card">
        <div className="insight">
          <div className="label">Debt-to-Income Ratio</div>
          <div className="value" style={{ color: ratioColor(dti, 40, 60) }}>
            {(dti * 100).toFixed(1)}%
          </div>
          <div className="note">Suggested: Under 40%</div>
        </div>
      </div>
    </>
  )
}

function Step3({ form, handleChange, cibilCategory }) {
  return (
    <>
      <h2>Step 3 of 4 — Credit Score Insights</h2>

      <Label tip="A higher credit score increases approval chances.">
        Credit Score: {form.cibil_score} ({cibilCategory})
      </Label>
      <input
        type="range"
        min="300"
        max="900"
        name="cibil_score"
        value={form.cibil_score}
        onChange={handleChange}
      />

      <div className="insights-card">
        <div className="insight">
          <div className="label">Credit Category</div>
          <div className="value">{cibilCategory}</div>
          <div className="note">Based on score {form.cibil_score}.</div>
        </div>
      </div>
    </>
  )
}

function Step4({
  form,
  handleChange,
  inlineErrors,
  income,
  loan,
  totalAssets,
  dti,
  lta,
  cibilCategory,
  ratioColor
}) {
  return (
    <>
      <h2>Step 4 of 4 — Asset Information</h2>

      <Label tip="Value of houses or apartments." required>
        Residential Assets
      </Label>
      <input
        placeholder="e.g., 3000000"
        name="residential_assets_value"
        value={form.residential_assets_value}
        onChange={handleChange}
      />

      <Label tip="Offices, shops, or commercial buildings." required>
        Commercial Assets
      </Label>
      <input
        placeholder="e.g., 0"
        name="commercial_assets_value"
        value={form.commercial_assets_value}
        onChange={handleChange}
      />

      <Label tip="Cars, jewelry, or other luxury items." required>
        Luxury Assets
      </Label>
      <input
        placeholder="e.g., 0"
        name="luxury_assets_value"
        value={form.luxury_assets_value}
        onChange={handleChange}
      />

      <Label tip="Bank savings, deposits, balances." required>
        Bank Assets
      </Label>
      <input
        placeholder="e.g., 200000"
        name="bank_asset_value"
        value={form.bank_asset_value}
        onChange={handleChange}
      />

      <h3 style={{ marginTop: '1.2rem' }}>Review Your Application</h3>
      <div className="summary-card">
        <p><b>Annual Income:</b> Rs. {income.toLocaleString()}</p>
        <p><b>Loan Amount:</b> Rs. {loan.toLocaleString()}</p>
        <p><b>Total Assets:</b> Rs. {totalAssets.toLocaleString()}</p>

        <p><b>DTI Ratio:</b> {(dti * 100).toFixed(1)}%</p>

        <p>
          <b>LTA Ratio:</b>{' '}
          <span style={{ color: ratioColor(lta, 80, 120) }}>
            {(lta * 100).toFixed(1)}%
          </span>
        </p>

        <p><b>Credit Score:</b> {form.cibil_score} ({cibilCategory})</p>
      </div>
    </>
  )
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

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

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  /* Calculations */
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

  /* Inline errors */
  const inlineErrors = {}
  if (step === 2) {
    if (income <= 0) inlineErrors.income_annum = 'Annual income must be greater than 0.'
    if (loan <= 0) inlineErrors.loan_amount = 'Loan amount must be greater than 0.'
    if (form.loan_term < 1 || form.loan_term > 12)
      inlineErrors.loan_term = 'Loan term must be 1–12 months.'
  }

  if (step === 4) {
    if (!form.residential_assets_value) inlineErrors.res = 'Required'
    if (!form.commercial_assets_value) inlineErrors.com = 'Required'
    if (!form.luxury_assets_value) inlineErrors.lux = 'Required'
    if (!form.bank_asset_value) inlineErrors.bank = 'Required'
  }

  /* Next validation */
  const canNext = () => {
    if (step === 1)
      return (
        form.no_of_dependents !== '' &&
        form.education !== '' &&
        form.self_employed !== ''
      )

    if (step === 2)
      return (
        income > 0 &&
        loan > 0 &&
        form.loan_term >= 1 &&
        Object.keys(inlineErrors).length === 0
      )

    if (step === 4)
      return (
        form.residential_assets_value !== '' &&
        form.commercial_assets_value !== '' &&
        form.luxury_assets_value !== '' &&
        form.bank_asset_value !== ''
      )

    return true
  }

  /* Color helper */
  const ratioColor = (ratio, good, warn) => {
    if (ratio * 100 < good) return '#1e8e3e'
    if (ratio * 100 < warn) return '#f0ad4e'
    return '#d9534f'
  }

  /* Submit */
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
            message: JSON.stringify(form),
            variant: mode
          },
          {
            user_email: email,
            sender: 'bot',
            message: data.human_message || data.prediction,
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

  return (
    <main className="page-center">
      <form className="loan-form" onSubmit={handleSubmit}>

        {/* Step Indicators */}
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '8px' }}>
          {[1, 2, 3, 4].map(n => (
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
        {step === 2 && (
          <Step2
            form={form}
            handleChange={handleChange}
            inlineErrors={inlineErrors}
            dti={dti}
            ratioColor={ratioColor}
          />
        )}
        {step === 3 && (
          <Step3
            form={form}
            handleChange={handleChange}
            cibilCategory={cibilCategory}
          />
        )}
        {step === 4 && (
          <Step4
            form={form}
            handleChange={handleChange}
            inlineErrors={inlineErrors}
            income={income}
            loan={loan}
            totalAssets={totalAssets}
            dti={dti}
            lta={lta}
            cibilCategory={cibilCategory}
            ratioColor={ratioColor}
          />
        )}

        {/* Buttons */}
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
