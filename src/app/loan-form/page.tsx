'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useSession } from '@/hooks/useSession'
import { apiFetch } from '@/lib/apiClient'

/* ============================================================
   PROGRESS BAR WITH LABELED STEPS
============================================================ */
const steps = ["Personal", "Loan", "Credit", "Assets", "Review"];

const ProgressBar = ({ step }: { step: number }) => (
  <div className="progress-wrapper-vertical">
    {steps.map((label, index) => {
      const stepNumber = index + 1;
      const isActive = stepNumber === step;
      const isCompleted = stepNumber < step;

      return (
        <div key={index} className="progress-block">
          {/* Label ABOVE circle */}
          <div
            className="progress-label-vertical"
            style={{
              color: isActive ? "var(--text)" : "var(--muted)",
              fontWeight: isActive ? 600 : 400
            }}
          >
            {label}
          </div>

          <div className="progress-inner">
            {/* Circle */}
            <div
              className={`progress-circle ${isActive ? "glow" : ""}`}
              style={{
                background: isCompleted || isActive ? "var(--brand)" : "#DCE0DA",
                color: isCompleted || isActive ? "#fff" : "#6E7C7A",
            }}
        >
              {stepNumber}
            </div>

            {/* Line */}
            {index < steps.length - 1 && (
              <div
                className="progress-line-vertical"
                style={{
                  background: isCompleted ? "var(--brand)" : "#DCE0DA"
                }}
              />
            )}
          </div>
        </div>
      );
    })}
  </div>
);

/* ============================================================
   TOOLTIP LABEL WITH REQUIRED ASTERISK
============================================================ */
const Label = ({
  children,
  tip,
  required
}: {
  children: React.ReactNode
  tip: string
  required?: boolean
}) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    {children}
    {required && <span className="required-star">*</span>}
    <span className="tooltip-icon">
      ⓘ
      <span className="tooltip-text">{tip}</span>
    </span>
  </label>
)

/* ============================================================
   STEP COMPONENTS
============================================================ */

function Step1({ form, handleChange, handleBlur, inlineErrors, touched }: any) {
  return (
    <>
      <p>Step 1 of 5</p>
      <h2>Personal Information</h2>

      <Label tip="Number of people depending on your income." required>
        No. of Dependents
      </Label>
      <input
        type="number"
        name="no_of_dependents"
        placeholder="e.g., 2"
        value={form.no_of_dependents}
        onChange={handleChange}
        onBlur={handleBlur}
        className={
          touched.no_of_dependents && inlineErrors.no_of_dependents
            ? 'error-input'
            : ''
        }
      />
      {touched.no_of_dependents && inlineErrors.no_of_dependents && (
        <p className="error-text">{inlineErrors.no_of_dependents}</p>
      )}

      <Label tip="Higher education improves creditworthiness." required>
        Education
      </Label>
      <select
        name="education"
        value={form.education}
        onChange={handleChange}
        onBlur={handleBlur}
        className={
          touched.education && inlineErrors.education ? 'error-input' : ''
        }
      >
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
        onBlur={handleBlur}
        className={
          touched.self_employed && inlineErrors.self_employed
            ? 'error-input'
            : ''
        }
      >
        <option value="">Select option</option>
        <option value="1">Yes</option>
        <option value="0">No</option>
      </select>
    </>
  )
}

function Step2({ form, handleChange, handleBlur, inlineErrors, touched, dti, ratioColor }: any) {
  return (
    <>
      <p>Step 2 of 5</p>
      <h2>Loan Details</h2>

      <Label tip="Your total yearly income before tax." required>
        Annual Income
      </Label>
      <input
        type="number"
        name="income_annum"
        placeholder="e.g., 1200000"
        value={form.income_annum}
        onChange={handleChange}
        onBlur={handleBlur}
        className={touched.income_annum && inlineErrors.income_annum ? 'error-input' : ''}
      />
      {touched.income_annum && inlineErrors.income_annum && (
        <p className="error-text">Annual income must be greater than 0.</p>
      )}

      <Label tip="How much money you want to borrow." required>
        Loan Amount
      </Label>
      <input
        type="number"
        name="loan_amount"
        placeholder="e.g., 500000"
        value={form.loan_amount}
        onChange={handleChange}
        onBlur={handleBlur}
        className={touched.loan_amount && inlineErrors.loan_amount ? 'error-input' : ''}
      />
      {touched.loan_amount && inlineErrors.loan_amount && (
        <p className="error-text">Loan amount must be greater than 0.</p>
      )}

      <Label tip="Shorter terms reduce lending risk." required>
        Loan Term (Months)
      </Label>
      <input
        type="number"
        name="loan_term"
        placeholder="1–12"
        value={form.loan_term}
        onChange={handleChange}
        onBlur={handleBlur}
        className={touched.loan_term && inlineErrors.loan_term ? 'error-input' : ''}
      />
      {touched.loan_term && inlineErrors.loan_term && (
        <p className="error-text">Loan term must be 1–12 months.</p>
      )}

      <div className="insights-card">
        <div className="insight">
          <div className="label">Debt-to-Income Ratio</div>
          <div className="value" style={{ color: ratioColor(dti, 40, 60) }}>
            {(dti * 100).toFixed(1)}%
          </div>
          <div className="note">Ideal: Under 40%</div>
        </div>
      </div>
    </>
  )
}

function Step3({ form, handleChange, handleBlur, cibilCategory }: any) {
  return (
    <>
      <p>Step 3 of 5</p>
      <h2>Credit Score Insights</h2>

      <Label tip="Higher score increases approval chances.">
        Credit Score: {form.cibil_score} ({cibilCategory})
      </Label>
      <input
        type="range"
        min="300"
        max="900"
        name="cibil_score"
        value={form.cibil_score}
        onChange={handleChange}
        onBlur={handleBlur}
      />

      <div className="insights-card">
        <div className="insight">
          <div className="label">Credit Category</div>
          <div className="value">{cibilCategory}</div>
          <div className="note">Based on score {form.cibil_score}</div>
        </div>
      </div>
    </>
  )
}

function Step4({
  form,
  handleChange,
  handleBlur,
  inlineErrors,
  touched,
  lta,
  ratioColor
}: any) {
  return (
    <>
      <p>Step 4 of 5</p>
      <h2>Asset Information</h2>

      <Label tip="Value of your house or apartment." required>
        Residential Assets
      </Label>
      <input
        name="residential_assets_value"
        placeholder="e.g., 3000000"
        value={form.residential_assets_value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={
          touched.residential_assets_value &&
          inlineErrors.residential_assets_value
            ? 'error-input'
            : ''
        }
      />
      {touched.residential_assets_value &&
        inlineErrors.residential_assets_value && (
          <p className="error-text">{inlineErrors.residential_assets_value}</p>
        )}

      <Label tip="Value of shops, offices, commercial property." required>
        Commercial Assets
      </Label>
      <input
        name="commercial_assets_value"
        placeholder="e.g., 0"
        value={form.commercial_assets_value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={
          touched.commercial_assets_value &&
          inlineErrors.commercial_assets_value
            ? 'error-input'
            : ''
        }
      />
      {touched.commercial_assets_value &&
        inlineErrors.commercial_assets_value && (
          <p className="error-text">{inlineErrors.commercial_assets_value}</p>
        )}

      <Label tip="Cars, jewelry, gold, valuables." required>
        Luxury Assets
      </Label>
      <input
        name="luxury_assets_value"
        placeholder="e.g., 0"
        value={form.luxury_assets_value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={
          touched.luxury_assets_value && inlineErrors.luxury_assets_value
            ? 'error-input'
            : ''
        }
      />
      {touched.luxury_assets_value && inlineErrors.luxury_assets_value && (
        <p className="error-text">{inlineErrors.luxury_assets_value}</p>
      )}

      <Label tip="Bank savings, deposits, balances." required>
        Bank Assets
      </Label>
      <input
        name="bank_asset_value"
        placeholder="e.g., 200000"
        value={form.bank_asset_value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={
          touched.bank_asset_value && inlineErrors.bank_asset_value
            ? 'error-input'
            : ''
        }
      />
      {touched.bank_asset_value && inlineErrors.bank_asset_value && (
        <p className="error-text">{inlineErrors.bank_asset_value}</p>
      )}

      <h3 style={{ marginTop: '1.5rem' }}>Asset Strength</h3>

      <div className="insights-card">
        <div className="insight">
          <div className="label">Loan-to-Asset Ratio</div>
          <div className="value" style={{ color: ratioColor(lta, 40, 80) }}>
            {(lta * 100).toFixed(1)}%
          </div>
          <div className="note">Ideal: Under 80%</div>
        </div>
      </div>
    </>
  )
}

function Step5({ income, loan, totalAssets, dti, lta, form, cibilCategory, ratioColor }: any) {
  return (
    <>
      <p>Final Step</p>
      <h2>Review Your Application</h2>

      <div className="summary-card">
        <p><b>Annual Income:</b> Rs. {income.toLocaleString()}</p>
        <p><b>Loan Amount:</b> Rs. {loan.toLocaleString()}</p>
        <p><b>Total Assets:</b> Rs. {totalAssets.toLocaleString()}</p>

        <p><b>DTI Ratio:</b> {(dti * 100).toFixed(1)}%</p>

        <p>
          <b>LTA Ratio:</b>{' '}
          <span style={{ color: ratioColor(lta, 40, 80) }}>
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

export default function LoanFormPage() {
  const router = useRouter()
  const { email } = useSession()

  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

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

  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const totalSteps = 5
  const mode =
    (typeof window !== 'undefined' &&
      (localStorage.getItem('chat_mode') as 'baseline' | 'xai')) || 'xai'

  const handleBlur = (e: any) => {
    const { name } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
  }

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (value !== '') {
      setTouched(prev => ({ ...prev, [name]: true }))
    }
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

  const ratioColor = (ratio: number, good: number, warn: number) => {
    if (ratio * 100 < good) return '#1e8e3e'
    if (ratio * 100 < warn) return '#f0ad4e'
    return '#d9534f'
  }

  /* Inline validation */
  const inlineErrors: Record<string, string> = {}

  if (step === 1) {
    const deps = Number(form.no_of_dependents)
    if (form.no_of_dependents !== '' && (deps < 0 || deps > 30))
      inlineErrors.no_of_dependents = 'Dependents must be between 0 and 30.'

    if (form.education === '') inlineErrors.education = 'Required'
    if (form.self_employed === '') inlineErrors.self_employed = 'Required'
  }

  if (step === 2) {
    if (income <= 0) inlineErrors.income_annum = 'Annual income must be greater than 0.'
    if (loan <= 0) inlineErrors.loan_amount = 'Loan amount must be greater than 0.'
    const lt = Number(form.loan_term)
    if (lt < 1 || lt > 12) inlineErrors.loan_term = 'Loan term must be 1–12 months.'
  }

  if (step === 4) {
    if (form.residential_assets_value !== '' && res < 0)
      inlineErrors.residential_assets_value = 'Value cannot be negative.'

    if (form.commercial_assets_value !== '' && com < 0)
      inlineErrors.commercial_assets_value = 'Value cannot be negative.'

    if (form.luxury_assets_value !== '' && lux < 0)
      inlineErrors.luxury_assets_value = 'Value cannot be negative.'

    if (form.bank_asset_value !== '' && bank < 0)
      inlineErrors.bank_asset_value = 'Value cannot be negative.'
  }

  /* Next Button Logic */
  const canNext = () => {
    if (step === 1) {
      return (
        form.no_of_dependents !== '' &&
        !inlineErrors.no_of_dependents &&
        form.education !== '' &&
        form.self_employed !== ''
      )
    }

    if (step === 2) {
      return (
        income > 0 &&
        loan > 0 &&
        form.loan_term !== '' &&
        Object.keys(inlineErrors).length === 0
      )
    }

    if (step === 4) {
      return (
        form.residential_assets_value !== '' &&
        form.commercial_assets_value !== '' &&
        form.luxury_assets_value !== '' &&
        form.bank_asset_value !== '' &&
        Object.keys(inlineErrors).length === 0
      )
    }

    return true
  }

  /* Submit */
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

  /* RENDER */
  return (
    <main className="page-center">
      <a href="/chat" className="back-to-chat-btn">← Back to Chat</a>
      <form className="loan-form" onSubmit={handleSubmit}>
        <ProgressBar step={step} />

        {step === 1 && (
          <div className="step-animation">
          <Step1
            form={form}
            handleChange={handleChange}
            handleBlur={handleBlur}
            inlineErrors={inlineErrors}
            touched={touched}
          />
          </div>
        )}

        {step === 2 && (
          <div className="step-animation">
          <Step2
            form={form}
            handleChange={handleChange}
            handleBlur={handleBlur}
            inlineErrors={inlineErrors}
            touched={touched}
            dti={dti}
            ratioColor={ratioColor}
          />
          </div>
        )}

        {step === 3 && (
          <div className="step-animation">
          <Step3
            form={form}
            handleChange={handleChange}
            handleBlur={handleBlur}
            cibilCategory={cibilCategory}
          />
          </div>
        )}

        {step === 4 && (
          <div className="step-animation">
          <Step4
            form={form}
            handleChange={handleChange}
            handleBlur={handleBlur}
            inlineErrors={inlineErrors}
            touched={touched}
            lta={lta}
            ratioColor={ratioColor}
          />
          </div>
        )}

        {step === 5 && (
          <div className="step-animation">
          <Step5
            income={income}
            loan={loan}
            totalAssets={totalAssets}
            dti={dti}
            lta={lta}
            form={form}
            cibilCategory={cibilCategory}
            ratioColor={ratioColor}
          />
          </div>
        )}

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
            <button
              type="submit"
              className="button primary"
              disabled={loading}
            >
              {loading ? 'Analyzing…' : 'Submit'}
            </button>
          )}
        </div>
      </form>
    </main>
  )
}
