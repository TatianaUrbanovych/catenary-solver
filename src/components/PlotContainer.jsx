import React, { useEffect } from 'react'
import '../styles/PlotContainer.css'

export function PlotContainer({ data, isLoading }) {
  useEffect(() => {
    if (!data || isLoading) return

    const { theta_deg, d, h, a, x0, lambda, isValid, L, R } = data

    const traces = []

    // Catenary curve
    const numPoints = 400
    const xPlot = []
    const yPlot = []

    for (let i = 0; i < numPoints; i++) {
      const x = (i / (numPoints - 1)) * d
      xPlot.push(x)
      yPlot.push(a * Math.cosh((x - x0) / a) - lambda)
    }

    traces.push({
      x: xPlot,
      y: yPlot,
      mode: 'lines',
      name: `Catenary (θ = ${theta_deg}°)`,
      line: {
        color: isValid ? '#b4a0d1' : '#d4a5a5',
        width: 3,
        dash: isValid ? 'solid' : 'dash',
      },
    })

    // Circle path
    const xCircle = []
    const yCircle = []
    for (let i = 0; i <= 100; i++) {
      const angle = -Math.PI / 2 + (Math.PI * i) / 100
      xCircle.push(R * Math.cos(angle))
      yCircle.push(R * Math.sin(angle))
    }
    traces.push({
      x: xCircle,
      y: yCircle,
      mode: 'lines',
      name: 'Path of B (radius R)',
      line: { color: '#c8b8d4', width: 1, dash: 'dash' },
    })

    // Chain length line
    const xLine = []
    const yLine = []
    for (let i = 0; i <= 100; i++) {
      xLine.push((L * i) / 100)
      yLine.push(0)
    }
    traces.push({
      x: xLine,
      y: yLine,
      mode: 'lines',
      name: `Chain length L = ${L}`,
      line: { color: '#a8d4e8', width: 2, dash: 'dash' },
    })

    // Supports
    traces.push({
      x: [0, d],
      y: [0, h],
      mode: 'markers',
      name: 'Supports A & B',
      marker: { color: '#e8d4a8', size: 14, symbol: 'circle' },
    })

    // Lowest point
    const yLowest = a - lambda
    if (isValid) {
      traces.push({
        x: [x0],
        y: [yLowest],
        mode: 'markers',
        name: `Lowest point (x₀ = ${x0.toFixed(3)})`,
        marker: { color: '#73877B', size: 12, symbol: 'triangle-down' },
      })
    } else {
      const xExtended = []
      const yExtended = []
      const start = x0 < 0 ? x0 - 0.1 : 0
      const end = x0 > d ? x0 + 0.1 : d

      for (let i = 0; i < 200; i++) {
        const x = start + ((end - start) * i) / 199
        xExtended.push(x)
        yExtended.push(a * Math.cosh((x - x0) / a) - lambda)
      }

      traces.push({
        x: xExtended,
        y: yExtended,
        mode: 'lines',
        name: 'Extended curve (theoretical)',
        line: { color: '#d4a5a5', width: 2, dash: 'dot' },
        opacity: 0.6,
      })

      traces.push({
        x: [x0],
        y: [yLowest],
        mode: 'markers',
        name: `Theoretical lowest (x₀ = ${x0.toFixed(3)}) - INVALID`,
        marker: { color: '#bb8588', size: 12, symbol: 'triangle-down' },
      })
    }

    const layout = {
      title: {
        text: `Inextensible Catenary: L = ${L}, R = ${R}, θ = ${theta_deg}°`,
        font: { color: '#7a6e8a', size: 16 },
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(248, 246, 252, 0.8)',
      xaxis: {
        title: 'x',
        color: '#a89bb8',
        gridcolor: 'rgba(212, 197, 232, 0.3)',
        zerolinecolor: '#a89bb8',
      },
      yaxis: {
        title: 'y',
        color: '#a89bb8',
        gridcolor: 'rgba(212, 197, 232, 0.3)',
        zerolinecolor: '#a89bb8',
        scaleanchor: 'x',
        scaleratio: 1,
      },
      legend: {
        font: { color: '#7a6e8a' },
        bgcolor: 'rgba(240, 235, 248, 0.9)',
      },
      margin: { t: 60, b: 50, l: 60, r: 30 },
      annotations: [
        {
          x: -0.05,
          y: 0.05,
          text: 'A',
          showarrow: false,
          font: { color: '#8b7fa6', size: 14 },
        },
        {
          x: d + 0.05,
          y: h + 0.05,
          text: 'B',
          showarrow: false,
          font: { color: '#8b7fa6', size: 14 },
        },
      ],
    }

    const config = {
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    }

    window.Plotly.newPlot('catenary-plot', traces, layout, config)
  }, [data, isLoading])

  return (
    <div className="plot-container">
      <h2>📈 Visualization</h2>
      {isLoading && (
        <div className="loading active">
          <div className="spinner"></div>
          <p>Computing solution...</p>
        </div>
      )}
      <div id="catenary-plot"></div>
    </div>
  )
}
