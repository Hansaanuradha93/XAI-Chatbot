'use client'
import { useState } from 'react'

type Scores = {
  trust_score: number | null
  accuracy_score: number | null
  clarity_score: number | null
  confidence_score: number | null
  repeat_usage_score: number | null
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
    accuracy_score: null,
    clarity_score: null,
    confidence_score: null,
    repeat_usage_score: null,
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
          Help us evaluate the {defaultVariant.toUpperCase()} experience. (Prediction: <b>{defaultPrediction}</b>)
        </p>

        <div className="survey-group">
          <SurveyRow label="I trust the answer provided by the AI."
            value={scores.trust_score} onChange={(v) => setVal('trust_score', v)} />
          <SurveyRow label="The explanation/prediction felt accurate."
            value={scores.accuracy_score} onChange={(v) => setVal('accuracy_score', v)} />
          <SurveyRow label="The answer was clear and easy to understand."
            value={scores.clarity_score} onChange={(v) => setVal('clarity_score', v)} />
          <SurveyRow label="I feel confident about the recommendation."
            value={scores.confidence_score} onChange={(v) => setVal('confidence_score', v)} />
          <SurveyRow label="I would rely on this AI for similar decisions again."
            value={scores.repeat_usage_score} onChange={(v) => setVal('repeat_usage_score', v)} />
        </div>

        <div className="survey-textarea">
          <label htmlFor="survey-comment">Any comments? (optional)</label>
          <textarea
            id="survey-comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share anything specific that helped or hindered your trust…"
          />
        </div>

        <div className="survey-actions">
          <button className="button secondary" onClick={onClose} disabled={loading}>Later</button>
          <button
            className="button"
            onClick={() => onSubmit({ trust: scores, feedback: comment.trim() || undefined })}
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
            <input type="radio" name={label} value={n} checked={value === n} onChange={() => onChange(n)} />
            {n}
          </label>
        ))}
      </div>
    </div>
  )
}
