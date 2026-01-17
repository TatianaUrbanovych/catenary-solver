export class CatenarySolver {
  constructor() {
    this.tolerance = 1e-8
    this.maxIterations = 200
  }

  getGuesses(currentGuess, d, slack) {
    const guesses = [
      currentGuess,
      [0.1, d / 2],
      [0.2, d / 2],
      [0.5, d / 2],
      [1.0, d / 2],
      [2.0, d / 2],
      [5.0, d / 2],
      [10.0, d / 2],
      [d / 3, d / 2],
      [0.05, d * 0.3],
      [0.05, d * 0.7],
      [0.01, d / 2],
      [0.5, d * 0.25],
      [0.5, d * 0.75],
      [1.0, d * 0.3],
      [1.0, d * 0.7],
      [0.1, 0.1],
      [0.2, 0.2],
      [0.3, d / 3],
      [d / 2, d / 2],
    ]

    if (slack > 0.001) {
      guesses.push([1.0 / slack, d / 2])
      guesses.push([0.5 / slack, d / 2])
      guesses.push([0.1 / slack, d / 2])
      guesses.push([2.0 / slack, d / 2])
      guesses.push([1.0 / slack, d * 0.3])
      guesses.push([1.0 / slack, d * 0.7])
    }

    if (slack > 0 && slack < 0.1) {
      // Small slack - chain is nearly taut, need larger 'a' values
      guesses.push([5.0, d / 2])
      guesses.push([10.0, d / 2])
      guesses.push([20.0, d / 2])
      guesses.push([50.0, d / 2])
    }

    return guesses
  }

  equations(a, x0, d, h, L) {
    if (a <= 1e-12) {
      return [1e10, 1e10]
    }

    try {
      const arg1 = (d - x0) / a
      const arg2 = x0 / a

      // Prevent overflow for large arguments
      if (Math.abs(arg1) > 700 || Math.abs(arg2) > 700) {
        return [1e10, 1e10]
      }

      const eq1 = a * (Math.cosh(arg1) - Math.cosh(arg2)) - h
      const eq2 = a * (Math.sinh(arg1) + Math.sinh(arg2)) - L

      if (!isFinite(eq1) || !isFinite(eq2)) {
        return [1e10, 1e10]
      }

      return [eq1, eq2]
    } catch (e) {
      return [1e10, 1e10]
    }
  }

  jacobian(a, x0, d, h, L) {
    if (a <= 1e-12) {
      return [
        [1, 0],
        [0, 1],
      ]
    }

    try {
      const arg1 = (d - x0) / a
      const arg2 = x0 / a

      if (Math.abs(arg1) > 700 || Math.abs(arg2) > 700) {
        return [
          [1, 0],
          [0, 1],
        ]
      }

      const cosh1 = Math.cosh(arg1)
      const cosh2 = Math.cosh(arg2)
      const sinh1 = Math.sinh(arg1)
      const sinh2 = Math.sinh(arg2)

      // ∂eq1/∂a = cosh(arg1) - cosh(arg2) + a * sinh(arg1) * (-(d-x0)/a²) - a * sinh(arg2) * (-x0/a²)
      //         = cosh(arg1) - cosh(arg2) - (d-x0)/a * sinh(arg1) + x0/a * sinh(arg2)
      //         = cosh(arg1) - cosh(arg2) - arg1 * sinh(arg1) + arg2 * sinh(arg2)
      const df1_da = cosh1 - cosh2 - arg1 * sinh1 + arg2 * sinh2

      // ∂eq1/∂x0 = a * sinh(arg1) * (-1/a) - a * sinh(arg2) * (1/a)
      //          = -sinh(arg1) - sinh(arg2)
      const df1_dx0 = -sinh1 - sinh2

      // ∂eq2/∂a = sinh(arg1) + sinh(arg2) + a * cosh(arg1) * (-(d-x0)/a²) + a * cosh(arg2) * (-x0/a²)
      //         = sinh(arg1) + sinh(arg2) - (d-x0)/a * cosh(arg1) - x0/a * cosh(arg2)
      //         = sinh(arg1) + sinh(arg2) - arg1 * cosh(arg1) - arg2 * cosh(arg2)
      const df2_da = sinh1 + sinh2 - arg1 * cosh1 - arg2 * cosh2

      // ∂eq2/∂x0 = a * cosh(arg1) * (-1/a) + a * cosh(arg2) * (1/a)
      //          = -cosh(arg1) + cosh(arg2)
      const df2_dx0 = -cosh1 + cosh2

      if (
        !isFinite(df1_da) ||
        !isFinite(df1_dx0) ||
        !isFinite(df2_da) ||
        !isFinite(df2_dx0)
      ) {
        return [
          [1, 0],
          [0, 1],
        ]
      }

      return [
        [df1_da, df1_dx0],
        [df2_da, df2_dx0],
      ]
    } catch (e) {
      return [
        [1, 0],
        [0, 1],
      ]
    }
  }

  newtonSolve(d, h, L, initialGuess) {
    let a = initialGuess[0]
    let x0 = initialGuess[1]

    // Validate initial guess
    if (a <= 0 || !isFinite(a) || !isFinite(x0)) {
      return { a: 0, x0: 0, residual: Infinity, converged: false }
    }

    for (let i = 0; i < this.maxIterations; i++) {
      const f = this.equations(a, x0, d, h, L)
      const residual = Math.sqrt(f[0] * f[0] + f[1] * f[1])

      if (!isFinite(residual)) {
        return { a, x0, residual: Infinity, converged: false }
      }

      if (residual < this.tolerance) {
        return { a, x0, residual, converged: true }
      }

      const J = this.jacobian(a, x0, d, h, L)
      const det = J[0][0] * J[1][1] - J[0][1] * J[1][0]

      if (Math.abs(det) < 1e-14) {
        // Try a small perturbation
        a *= 1.01
        x0 *= 1.01
        continue
      }

      // Solve J * [da, dx0]^T = -f using Cramer's rule
      const da = (-f[0] * J[1][1] + f[1] * J[0][1]) / det
      const dx0 = (f[0] * J[1][0] - f[1] * J[0][0]) / det

      if (!isFinite(da) || !isFinite(dx0)) {
        return { a, x0, residual, converged: false }
      }

      // Line search with backtracking
      let alpha = 1.0
      let newA, newX0, newResidual

      for (let j = 0; j < 20; j++) {
        newA = a + alpha * da
        newX0 = x0 + alpha * dx0

        if (newA > 1e-12) {
          const newF = this.equations(newA, newX0, d, h, L)
          newResidual = Math.sqrt(newF[0] * newF[0] + newF[1] * newF[1])

          if (isFinite(newResidual) && newResidual < residual) {
            break
          }
        }

        alpha *= 0.5

        if (alpha < 1e-10) {
          // Step too small, accept current best
          return { a, x0, residual, converged: residual < 1e-6 }
        }
      }

      if (newA <= 1e-12) {
        return { a, x0, residual, converged: residual < 1e-6 }
      }

      a = newA
      x0 = newX0
    }

    const f = this.equations(a, x0, d, h, L)
    const residual = Math.sqrt(f[0] * f[0] + f[1] * f[1])
    return { a, x0, residual, converged: residual < 1e-6 }
  }

  // Alternative solver using simple gradient descent as fallback
  gradientDescentSolve(d, h, L, initialGuess) {
    let a = initialGuess[0]
    let x0 = initialGuess[1]

    const learningRate = 0.01
    const maxIter = 5000

    for (let i = 0; i < maxIter; i++) {
      const f = this.equations(a, x0, d, h, L)
      const residual = Math.sqrt(f[0] * f[0] + f[1] * f[1])

      if (residual < this.tolerance) {
        return { a, x0, residual, converged: true }
      }

      const J = this.jacobian(a, x0, d, h, L)

      // Gradient of ||f||^2 = 2 * J^T * f
      const gradA = 2 * (J[0][0] * f[0] + J[1][0] * f[1])
      const gradX0 = 2 * (J[0][1] * f[0] + J[1][1] * f[1])

      const gradNorm = Math.sqrt(gradA * gradA + gradX0 * gradX0)
      if (gradNorm < 1e-12) break

      // Adaptive learning rate
      const lr = Math.min(learningRate, 0.1 / gradNorm)

      const newA = a - lr * gradA
      const newX0 = x0 - lr * gradX0

      if (newA > 1e-10) {
        a = newA
        x0 = newX0
      } else {
        break
      }
    }

    const f = this.equations(a, x0, d, h, L)
    const residual = Math.sqrt(f[0] * f[0] + f[1] * f[1])
    return { a, x0, residual, converged: residual < 1e-6 }
  }

  // Levenberg-Marquardt style solver for better robustness
  levenbergMarquardtSolve(d, h, L, initialGuess) {
    let a = initialGuess[0]
    let x0 = initialGuess[1]
    let lambda = 0.001 // Damping parameter

    for (let i = 0; i < this.maxIterations; i++) {
      const f = this.equations(a, x0, d, h, L)
      const residual = Math.sqrt(f[0] * f[0] + f[1] * f[1])

      if (!isFinite(residual)) {
        return { a, x0, residual: Infinity, converged: false }
      }

      if (residual < this.tolerance) {
        return { a, x0, residual, converged: true }
      }

      const J = this.jacobian(a, x0, d, h, L)

      // (J^T * J + lambda * I) * delta = -J^T * f
      const JtJ00 = J[0][0] * J[0][0] + J[1][0] * J[1][0] + lambda
      const JtJ01 = J[0][0] * J[0][1] + J[1][0] * J[1][1]
      const JtJ10 = J[0][1] * J[0][0] + J[1][1] * J[1][0]
      const JtJ11 = J[0][1] * J[0][1] + J[1][1] * J[1][1] + lambda

      const Jtf0 = J[0][0] * f[0] + J[1][0] * f[1]
      const Jtf1 = J[0][1] * f[0] + J[1][1] * f[1]

      const det = JtJ00 * JtJ11 - JtJ01 * JtJ10

      if (Math.abs(det) < 1e-14) {
        lambda *= 10
        continue
      }

      const da = (-Jtf0 * JtJ11 + Jtf1 * JtJ01) / det
      const dx0 = (-Jtf1 * JtJ00 + Jtf0 * JtJ10) / det

      const newA = a + da
      const newX0 = x0 + dx0

      if (newA > 1e-10) {
        const newF = this.equations(newA, newX0, d, h, L)
        const newResidual = Math.sqrt(newF[0] * newF[0] + newF[1] * newF[1])

        if (isFinite(newResidual) && newResidual < residual) {
          a = newA
          x0 = newX0
          lambda = Math.max(lambda / 2, 1e-10)
        } else {
          lambda *= 2
          if (lambda > 1e10) break
        }
      } else {
        lambda *= 2
        if (lambda > 1e10) break
      }
    }

    const f = this.equations(a, x0, d, h, L)
    const residual = Math.sqrt(f[0] * f[0] + f[1] * f[1])
    return { a, x0, residual, converged: residual < 1e-6 }
  }

  solve(d, h, L) {
    // Validate inputs
    if (d <= 0 || L <= 0) {
      return null
    }

    const distance = Math.sqrt(d * d + h * h)
    if (L <= distance) {
      return null
    }

    const slack = L - distance
    const guesses = this.getGuesses([0.1, 0.1], d, slack)

    let bestSolution = null
    let bestResidual = Infinity

    // Try Newton's method with all guesses
    for (const guess of guesses) {
      try {
        const result = this.newtonSolve(d, h, L, guess)

        if (
          result.converged &&
          result.a > 0 &&
          result.residual < bestResidual
        ) {
          // Verify the solution
          const verify = this.equations(result.a, result.x0, d, h, L)
          const verifyResidual = Math.sqrt(
            verify[0] * verify[0] + verify[1] * verify[1],
          )

          if (verifyResidual < 1e-5) {
            bestResidual = verifyResidual
            bestSolution = result
          }
        }
      } catch (e) {
        continue
      }
    }

    // If Newton failed, try Levenberg-Marquardt
    if (!bestSolution) {
      for (const guess of guesses) {
        try {
          const result = this.levenbergMarquardtSolve(d, h, L, guess)

          if (
            result.converged &&
            result.a > 0 &&
            result.residual < bestResidual
          ) {
            const verify = this.equations(result.a, result.x0, d, h, L)
            const verifyResidual = Math.sqrt(
              verify[0] * verify[0] + verify[1] * verify[1],
            )

            if (verifyResidual < 1e-5) {
              bestResidual = verifyResidual
              bestSolution = result
            }
          }
        } catch (e) {
          continue
        }
      }
    }

    // Last resort: gradient descent
    if (!bestSolution) {
      for (const guess of guesses.slice(0, 5)) {
        try {
          const result = this.gradientDescentSolve(d, h, L, guess)

          if (
            result.converged &&
            result.a > 0 &&
            result.residual < bestResidual
          ) {
            const verify = this.equations(result.a, result.x0, d, h, L)
            const verifyResidual = Math.sqrt(
              verify[0] * verify[0] + verify[1] * verify[1],
            )

            if (verifyResidual < 1e-4) {
              bestResidual = verifyResidual
              bestSolution = result
            }
          }
        } catch (e) {
          continue
        }
      }
    }

    return bestSolution
  }
}
