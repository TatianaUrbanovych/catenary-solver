import React from 'react'

export function SummarySection({ results }) {
  if (!results || results.error) return null

  return (
    <div className="summary-section">
      <h2>📋 Solution Summary</h2>
      <div className="summary-grid">
        <div className="summary-card">
          <div className="value">{results.theta_deg}°</div>
          <div className="label">Angle θ</div>
        </div>
        <div className="summary-card">
          <div className="value">{results.a?.toFixed(4)}</div>
          <div className="label">Shape Parameter a</div>
        </div>
        <div className="summary-card">
          <div className="value">{results.x0?.toFixed(4)}</div>
          <div className="label">Lowest Point x₀</div>
        </div>
        <div className="summary-card">
          <div className="value">{results.lambda?.toFixed(4)}</div>
          <div className="label">Tension λ</div>
        </div>
      </div>
    </div>
  )
}
