'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoanFormPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    education: '',
    self_employed: '',
    income_annum: '',
    loan_amount: '',
    loan_term: '',
    cibil_score: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic front-end validation
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

    console.log('✅ Form Submitted:', form)
    alert('Form submitted successfully! (Backend integration coming next)')
  }

  return (
    <main className="page-center">
      <form className="loan-form" onSubmit={handleSubmit}>
        <h1>Loan Application</h1>

        {/* Education */}
        <label>Education Level</label>
        <select
          name="education"
          value={form.education}
          onChange={handleChange}
          required
        >
          <option value="">Select...</option>
          <option value="0">Graduate</option>
          <option value="1">Not Graduate</option>
        </select>

        {/* Self Employed */}
        <label>Self Employment Status</label>
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

        {/* Annual Income */}
        <label>Annual Income (LKR)</label>
        <input
          type="number"
          name="income_annum"
          value={form.income_annum}
          onChange={handleChange}
          min="0"
          required
        />

        {/* Loan Amount */}
        <label>Requested Loan Amount (LKR)</label>
        <input
          type="number"
          name="loan_amount"
          value={form.loan_amount}
          onChange={handleChange}
          min="0"
          required
        />

        {/* Loan Term */}
        <label>Repayment Duration (Months)</label>
        <input
          type="number"
          name="loan_term"
          value={form.loan_term}
          onChange={handleChange}
          min="1"
          max="12"
          required
        />

        {/* CIBIL Score */}
        <label>Credit Score</label>
        <input
          type="number"
          name="cibil_score"
          value={form.cibil_score}
          onChange={handleChange}
          min="300"
          max="900"
          required
        />

        <div className="actions">
          <button
            type="button"
            onClick={() => router.push('/chat')}
            className="button secondary"
          >
            Back
          </button>

          <button type="submit" className="button primary">
            Submit
          </button>
        </div>
      </form>
    </main>
  )
}
