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

  // --------------------------
  // FORM STATE
  // --------------------------
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
    bank_asset_value: '',
  })

  // --------------------------
  // INLINE ERRORS
  // --------------------------
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateField = (name: string, value: string) => {
    let message = ''

    switch (name) {
      case 'income_annum':
        if (Number(value) < 0) message = 'Income must be 0 or greater.'
        break

      case 'loan_amount':
        if (Number(value) < 0) message = 'Loan amount must be 0 or greater.'
        break

      case 'loan_term':
        if (Number(value) < 1 || Number(value) > 12)
          message = 'Loan term must be between 1 and 12 months.'
        break

      case 'cibil_score':
        if (Number(value) < 300 || Number(value) > 900)
          message = 'Credit score must be between 300 and 900.'
        break

      case 'no_of_dependents':
      case 'residential_assets_value':
      case 'commercial_assets_value':
      case 'luxury_assets_value':
      case 'bank_asset_value':
        if (Number(value) < 0) message = 'Value cannot be negative.'
        break
    }

    setErrors(prev => ({ ...prev, [name]: message }))
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target

    setForm(prev => ({ ...prev, [name]: value }))
    validateField(name, value)
  }

  // MODE
  const mode =
    (typeof window !== 'undefined' &&
      (localStorage.getItem('chat_mode') as 'xai' | 'baseline')) || 'xai'

  // --------------------------
  // CAN SUBMIT?
  // --------------------------
  const hasErrors = Object.values(errors).some(msg => msg.length > 0)
  const missingRequired = Object.values(form).some(v => v === '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (hasErrors || missingRequired) {
      alert('Please fix the errors before submitting.')
      return
    }

    setLoading(true)

    try {
      const payload = {
        no_of_dependents: Number(form.no_of_dependents),
        education: Number(form.education),
        self_employed: Number(form.self_employed),
        income_annum: Number(form.income_annum),
        loan_amount: Number(form.loan_amount),
        loan_term: Number(form.loan_term),
        cibil_score: Number(form.cibil_score),
        residential_assets_value: Number(form.residential_assets_value),
        commercial_assets_value: Number(form.commercial_assets_value),
        luxury_assets_value: Number(form.luxury_assets_value),
        bank_asset_value: Number(form.bank_asset_value),
      }

      const data = await apiFetch(`/api/v1/loan/approval?variant=${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      // Save chat
      if (email) {
        await supabase.from('chat_history').insert([
          {
            user_email: email,
            sender: 'user',
            message: `Loan Form Submitted:\n${JSON.stringify(form, null, 2)}`,
            variant: mode,
          },
          {
            user_email: email,
            sender: 'bot',
            message: data.human_message || `Loan Decision: ${data.prediction}`,
            variant: mode,
          },
        ])
      }

      router.push('/chat')
    } catch (err) {
      console.error(err)
      alert('Error connecting to backend API.')
    } finally {
      setLoading(false)
    }
  }

  // --------------------------
  // COMPONENT UI
  // --------------------------
  const renderField = (
    label: string,
    name: string,
    type: 'number' | 'text' = 'number',
    props: any = {}
  ) => (
    <div className="field-group">
      <label>{label}</label>
      <input
        type={type}
        name={name}
        value={(form as any)[name]}
        onChange={handleChange}
        className={errors[name] ? 'error-input' : ''}
        {...props}
      />
      {errors[name] && <p className="error-text">{errors[name]}</p>}
    </div>
  )

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
              color: 'white',
            }}
          >
            {mode === 'xai' ? 'Explainable Mode' : 'Baseline Mode'}
          </span>
        </div>

        <h2>A. Personal Information</h2>
        {renderField('No. of Dependents', 'no_of_dependents')}
        <label>Education Level</label>
        <select
          name="education"
          value={form.education}
          onChange={handleChange}
          className={errors.education ? 'error-input' : ''}
        >
          <option value="">Select...</option>
          <option value="0">Graduate</option>
          <option value="1">Not Graduate</option>
        </select>

        <label>Self Employed</label>
        <select
          name="self_employed"
          value={form.self_employed}
          onChange={handleChange}
        >
          <option value="">Select...</option>
          <option value="1">Yes</option>
          <option value="0">No</option>
        </select>

        <h2>B. Loan Details</h2>
        {renderField('Annual Income (LKR)', 'income_annum')}
        {renderField('Loan Amount (LKR)', 'loan_amount')}
        {renderField('Loan Term (Months)', 'loan_term')}

        <h2>C. Credit Information</h2>
        {renderField('Credit Score (300–900)', 'cibil_score')}

        <h2>D. Assets</h2>
        {renderField('Residential Assets (LKR)', 'residential_assets_value')}
        {renderField('Commercial Assets (LKR)', 'commercial_assets_value')}
        {renderField('Luxury Assets (LKR)', 'luxury_assets_value')}
        {renderField('Bank Assets (LKR)', 'bank_asset_value')}

        <div className="actions">
          <button type="button" onClick={() => router.push('/chat')} className="button secondary">
            Back
          </button>

          <button
            type="submit"
            className="button primary"
            disabled={loading || hasErrors || missingRequired}
          >
            {loading ? 'Analyzing…' : 'Submit'}
          </button>
        </div>
      </form>
    </main>
  )
}
