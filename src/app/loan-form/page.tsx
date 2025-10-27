'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useSession } from '@/hooks/useSession'

export default function LoanFormPage() {
  const router = useRouter()
  const { email } = useSession()  // ✅ to log user_email

  const [form, setForm] = useState({
    education: '',
    self_employed: '',
    income_annum: '',
    loan_amount: '',
    loan_term: '',
    cibil_score: ''
  })

  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
      const mode = (typeof window !== 'undefined' && (localStorage.getItem('chat_mode') as 'xai' | 'baseline')) || 'xai';

      const res = await fetch(`http://127.0.0.1:8000/predict?variant=${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          education: Number(form.education),
          self_employed: Number(form.self_employed),
          income_annum: income,
          loan_amount: loan,
          loan_term: term,
          cibil_score: score
      })
    })

      if (!res.ok) throw new Error(`Backend returned ${res.status}`)
      const data = await res.json()
      console.log('✅ Backend response:', data)

      // ✅ Format the bot response
      let explanationText = ''
      if (data.explanation && typeof data.explanation === 'object') {
        const entries = Object.entries(data.explanation)
        if (entries.length > 0) {
          explanationText = entries.map(([f, v]) => `${f}: ${Number(v).toFixed(4)}`).join('\n')
        }
      }

      const botMessage =
        `💡 Loan Decision: ${data.prediction}` +
        (explanationText ? `\n\nExplanation:\n${explanationText}` : '')

      // ✅ Save both user request & bot response in Supabase
      if (email) {
        const { error } = await supabase.from('chat_history').insert([
          {
            user_email: email,
            sender: 'user',
            message: `Loan Application Submitted:\nIncome: ${income}, Loan: ${loan}, Term: ${term}, Score: ${score}`
          },
          { user_email: email, sender: 'bot', message: botMessage }
        ])
        if (error) console.error('❌ Error saving chat to Supabase:', error)
      }

      // ✅ Redirect to chat page
      router.push('/chat')
    } catch (err) {
      console.error('❌ API Error:', err)
      alert('Error connecting to the backend API.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-center">
      <form className="loan-form" onSubmit={handleSubmit}>
        <h1>Loan Application</h1>

        <label>Education Level</label>
        <select name="education" value={form.education} onChange={handleChange} required>
          <option value="">Select...</option>
          <option value="0">Graduate</option>
          <option value="1">Not Graduate</option>
        </select>

        <label>Self Employment Status</label>
        <select name="self_employed" value={form.self_employed} onChange={handleChange} required>
          <option value="">Select...</option>
          <option value="1">Yes</option>
          <option value="0">No</option>
        </select>

        <label>Annual Income (LKR)</label>
        <input type="number" name="income_annum" value={form.income_annum} onChange={handleChange} min="0" required />

        <label>Requested Loan Amount (LKR)</label>
        <input type="number" name="loan_amount" value={form.loan_amount} onChange={handleChange} min="0" required />

        <label>Repayment Duration (Months)</label>
        <input type="number" name="loan_term" value={form.loan_term} onChange={handleChange} min="1" max="12" required />

        <label>Credit Score</label>
        <input type="number" name="cibil_score" value={form.cibil_score} onChange={handleChange} min="300" max="900" required />

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
