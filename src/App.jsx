import React, { useState } from 'react'
import { CatenarySolver } from './utils/CatenarySolver'
import { ControlPanel } from './components/ControlPanel'
import { PlotContainer } from './components/PlotContainer'
import { SummarySection } from './components/SummarySection'
import './styles/App.css'

export default function App() {
  const [theta, setTheta] = useState(-14.5)
  const [chainLength, setChainLength] = useState(1.0)
  const [radius, setRadius] = useState(0.99)
  const [results, setResults] = useState(null)
  const [plotData, setPlotData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const solver = new CatenarySolver()

  const handleSolve = () => {
    setIsLoading(true)

    setTimeout(() => {
      const theta_rad = (theta * Math.PI) / 180
      const d = radius * Math.cos(theta_rad)
      const h = radius * Math.sin(theta_rad)
      const slack = chainLength - Math.sqrt(d * d + h * h)

      // Validation
      if (chainLength <= Math.sqrt(d * d + h * h)) {
        setResults({
          error:
            'Chain length must be greater than the distance between supports!',
        })
        setPlotData(null)
        setIsLoading(false)
        return
      }

      // Solve
      const solution = solver.solve(d, h, chainLength)

      if (!solution) {
        setResults({
          error: 'Could not find a valid solution. Try adjusting parameters.',
        })
        setPlotData(null)
        setIsLoading(false)
        return
      }

      const { a, x0 } = solution
      const lambda = a * Math.cosh(x0 / a)

      const isValid = x0 >= 0 && x0 <= d
      let statusMessage

      if (x0 < 0) {
        statusMessage = 'INVALID (x₀ < 0: lowest point before support A)'
      } else if (x0 > d) {
        statusMessage = 'INVALID (x₀ > d: lowest point beyond support B)'
      } else {
        statusMessage = 'VALID (0 ≤ x₀ ≤ d)'
      }

      const newResults = {
        theta_deg: theta,
        d,
        h,
        a,
        x0,
        lambda,
        slack,
        isValid,
        statusMessage,
        ratio: x0 / d,
      }

      setResults(newResults)
      setPlotData({
        theta_deg: theta,
        d,
        h,
        a,
        x0,
        lambda,
        isValid,
        L: chainLength,
        R: radius,
      })

      setIsLoading(false)
    }, 100)
  }

  return (
    <div className="container">
      <header>
        <h1>🔗 Inextensible Catenary Solver</h1>
        <p>
          Solve and visualize catenary equations with validity checking for
          broken extremals
        </p>
      </header>

      <div className="main-content">
        <ControlPanel
          theta={theta}
          chainLength={chainLength}
          radius={radius}
          onThetaChange={setTheta}
          onChainLengthChange={setChainLength}
          onRadiusChange={setRadius}
          onSolve={handleSolve}
          results={results}
        />

        <PlotContainer data={plotData} isLoading={isLoading} />
      </div>

      <SummarySection results={results} />
    </div>
  )
}
