'use client'
import { useState } from 'react'

type Scores = {
  trust_score: number | null
  reasoning_confidence_score: number | null
  accuracy_score: number | null
  understanding_score: number | null
  repeat_usage_score: number | null
  comfort_score: number | null
}

export function SurveyModal({
  open,
  onClose,
  onSubmit,
  loading,
  defaultVariant,
  defaultPrediction,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (payload: { trust: Scores; feedback?: string }) => void
  loading?: boolean
  defaultVariant: 'baseline' | 'xai'
  defaultPrediction: string
}) {
  const [scores, setScores] = useState<Scores>({
    trust_score: null,
    reasoning_confidence_score: null,
    accuracy_score: null,
    understanding_score: null,
    repeat_usage_score: null,
    comfort_score: null,
  })
  const [comment, setComment] = useState('')

  const setVal = (k: keyof Scores, v: number) =>
    setScores((s) => ({ ...s, [k]: v }))

  const allAnswered = Object.values(scores).every((v) => typeof v === 'number')
  if (!open) return null

  return (
    <div className="survey-overlay" aria-modal aria-hidden={!open} role="dialog">
      <div className="survey-modal">
        <div className="survey-header">
          <h3 style={{ margin: 0 }}>Quick Survey</h3>
          <button className="survey-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <p className="survey-sub">
          Help us evaluate the experience.
          (Prediction: <b>{defaultPrediction}</b>)
        </p>

        <div className="survey-group">

          {/* --- Updated 6 research-backed questions --- */}

          <SurveyRow
            label="I trust the loan decision provided by the AI."
            value={scores.trust_score}
            onChange={(v) => setVal('trust_score', v)}
          />

          <SurveyRow
            label="The AI’s reasoning or explanation increased my confidence in the decision."
            value={scores.reasoning_confidence_score}
            onChange={(v) => setVal('reasoning_confidence_score', v)}
          />

          <SurveyRow
            label="The AI’s answer felt accurate and reliable."
            value={scores.accuracy_score}
            onChange={(v) => setVal('accuracy_score', v)}
          />

          <SurveyRow
            label="I understood how the system arrived at the decision."
            value={scores.understanding_score}
            onChange={(v) => setVal('understanding_score', v)}
          />

          <SurveyRow
            label="I would rely on this AI for similar financial decisions in the future."
            value={scores.repeat_usage_score}
            onChange={(v) => setVal('repeat_usage_score', v)}
          />

          <SurveyRow
            label="I felt comfortable receiving a financial decision from an AI system."
            value={scores.comfort_score}
            onChange={(v) => setVal('comfort_score', v)}
          />

        </div>

        <div className="survey-textarea">
          <label htmlFor="survey-comment">Any comments? (optional)</label>
          <textarea
            id="survey-comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What increased or reduced your trust in this decision?"
          />
        </div>

        <div className="survey-actions">
          <button className="button secondary" onClick={onClose} disabled={loading}>
            Later
          </button>

          <button
            className="button"
            onClick={() =>
              onSubmit({
                trust: scores,
                feedback: comment.trim() || undefined,
              })
            }
            disabled={!allAnswered || !!loading}
          >
            {loading ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SurveyRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | null
  onChange: (v: number) => void
}) {
  return (
    <div className="survey-row">
      <div className="survey-label">{label}</div>
      <div className="survey-scale">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={`pill ${value === n ? 'active' : ''}`}>
            <input
              type="radio"
              name={label}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
            />
            {n}
          </label>
        ))}
      </div>
    </div>
  )
}
