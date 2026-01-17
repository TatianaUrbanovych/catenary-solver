import React from 'react'
import '../styles/ControlPanel.css'

export function ControlPanel({
  theta,
  chainLength,
  radius,
  onThetaChange,
  onChainLengthChange,
  onRadiusChange,
  onSolve,
  results,
}) {
  const handlePreset = (presetTheta) => {
    onThetaChange(presetTheta)
  }

  return (
    <div className="control-panel">
      <h2>⚙️ Parameters</h2>

      <div className="input-group">
        <label>
          Angle θ (degrees)
          <span
            className="info-icon"
            title="Angle from horizontal. 0° = horizontal right, positive = upward, negative = downward"
          >
            ?
          </span>
        </label>
        <div className="slider-container">
          <input
            type="range"
            min="-89"
            max="89"
            step="0.5"
            value={theta}
            onChange={(e) => onThetaChange(parseFloat(e.target.value))}
          />
          <input
            type="number"
            className="slider-value"
            value={theta}
            onChange={(e) => {
              let val = parseFloat(e.target.value)
              val = Math.max(-89, Math.min(89, val))
              onThetaChange(val)
            }}
            step="0.5"
          />
        </div>
        <p className="hint">Range: -89° to 89°</p>
        <div className="presets">
          <button className="preset-btn" onClick={() => handlePreset(0)}>
            0°
          </button>
          <button className="preset-btn" onClick={() => handlePreset(-14.5)}>
            -14.5°
          </button>
          <button className="preset-btn" onClick={() => handlePreset(-30)}>
            -30°
          </button>
          <button className="preset-btn" onClick={() => handlePreset(-45)}>
            -45°
          </button>
          <button className="preset-btn" onClick={() => handlePreset(30)}>
            30°
          </button>
          <button className="preset-btn" onClick={() => handlePreset(45)}>
            45°
          </button>
        </div>
      </div>

      <div className="input-group">
        <label>Chain Length (L)</label>
        <input
          type="number"
          value={chainLength}
          onChange={(e) => onChainLengthChange(parseFloat(e.target.value))}
          step="0.1"
          min="0.1"
        />
        <p className="hint">Total length of the inextensible chain</p>
      </div>

      <div className="input-group">
        <label>Radius (R)</label>
        <input
          type="number"
          value={radius}
          onChange={(e) => onRadiusChange(parseFloat(e.target.value))}
          step="0.01"
          min="0.1"
        />
        <p className="hint">Distance from support A to support B</p>
      </div>

      <button className="solve-btn" onClick={onSolve}>
        🔍 Solve Catenary
      </button>

      {results && (
        <div className="results-panel">
          <h3>📊 Solution Results</h3>
          {results.statusMessage && (
            <div
              className={`status-badge ${
                results.isValid ? 'status-valid' : 'status-invalid'
              }`}
            >
              {results.isValid ? '✓' : '✗'} {results.statusMessage}
            </div>
          )}
          {results.error && (
            <div className="status-badge status-error">⚠️ {results.error}</div>
          )}

          {!results.error && (
            <>
              <div className="result-item">
                <span className="result-label">Horizontal span (d)</span>
                <span className="result-value">{results.d?.toFixed(5)}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Vertical displacement (h)</span>
                <span className="result-value">{results.h?.toFixed(5)}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Shape parameter (a)</span>
                <span className="result-value">{results.a?.toFixed(5)}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Lowest point (x₀)</span>
                <span className="result-value">{results.x0?.toFixed(5)}</span>
              </div>
              <div className="result-item">
                <span className="result-label">x₀/d ratio</span>
                <span className="result-value">
                  {results.ratio?.toFixed(5)}
                </span>
              </div>
              <div className="result-item">
                <span className="result-label">Tension parameter (λ)</span>
                <span className="result-value">
                  {results.lambda?.toFixed(5)}
                </span>
              </div>
              <div className="result-item">
                <span className="result-label">Slack</span>
                <span className="result-value">
                  {results.slack?.toFixed(5)}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      <div className="equation-display">
        <strong>Catenary Equation:</strong>
        <br />
        <br />
        <code>y(x) = a·cosh((x - x₀)/a) - λ</code>
        <br />
        <br />
        <strong>Transcendental equations:</strong>
        <br />
        <br />
        <code> a·(cosh((d-x₀)/a) - cosh(x₀/a)) = h</code>
        <br />
        <br />
        <code> a·(sinh((d-x₀)/a) + sinh(x₀/a)) = L</code>
      </div>
    </div>
  )
}
