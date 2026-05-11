import { describe, expect, test } from 'vitest'
import * as cubic2d from '../src/curve/cubic2d'
import * as linear2d from '../src/curve/linear2d'
import * as quadratic2d from '../src/curve/quadratic2d'
import * as rationalCubic2d from '../src/curve/rationalCubic2d'
import * as interval from '../src/interval'
import * as cubicPolynomial from '../src/polynomial/cubic'
import * as linearPolynomial from '../src/polynomial/linear'
import * as quadraticPolynomial from '../src/polynomial/quadratic'
import * as vector2 from '../src/vector/vector2'

describe('linear2d', () => {
  test('make', () => {
    const c0 = linearPolynomial.make(0, 1)
    const c1 = linearPolynomial.make(1, 0)

    expect(linear2d.fromPolynomials(c0, c1)).toMatchObject({
      x: c0,
      y: c1,

      [0]: c0,
      [1]: c1,
    })
  })
  test('isLinearCurve2d', () => {
    expect(
      linear2d.isLinearCurve2d(
        linear2d.fromPolynomials(linearPolynomial.make(0, 1), linearPolynomial.make(1, 0)),
      ),
    ).toBe(true)
  })
  test('fromCoefficients packs coefficient vectors into per-axis polynomials', () => {
    const c = linear2d.fromCoefficients(vector2.make(1, 2), vector2.make(3, 4))
    expect(c.x).toMatchObject({ c0: 1, c1: 3 })
    expect(c.y).toMatchObject({ c0: 2, c1: 4 })
  })
  test('fromBezierPoints reproduces the line at t=0 and t=1', () => {
    const c = linear2d.fromBezierPoints(vector2.make(2, 3), vector2.make(7, 11))
    expect(linear2d.solve(c, 0)).toBeCloseToValue(vector2.make(2, 3))
    expect(linear2d.solve(c, 1)).toBeCloseToValue(vector2.make(7, 11))
  })
  test('solve', () => {
    expect(
      linear2d.solve(
        linear2d.fromPolynomials(linearPolynomial.make(0, 1), linearPolynomial.make(1, 0)),
        0.5,
      ),
    ).toBeCloseToValue(vector2.make(0.5, 1))
  })
  test('length', () => {
    expect(
      linear2d.length(
        linear2d.fromPolynomials(linearPolynomial.make(0, 1), linearPolynomial.make(0, 1)),
        interval.make(0, 1),
      ),
    ).toBeCloseTo(Math.sqrt(2))
  })
})

describe('quadratic2d', () => {
  test('make', () => {
    const c0 = quadraticPolynomial.make(0, 0, 1)
    const c1 = quadraticPolynomial.make(0, 0, -1)

    expect(quadratic2d.fromPolynomials(c0, c1)).toMatchObject({
      x: c0,
      y: c1,
      [0]: c0,
      [1]: c1,
    })
  })
  test('isQuadraticCurve2d', () => {
    expect(
      quadratic2d.isQuadraticCurve2d(
        quadratic2d.fromPolynomials(
          quadraticPolynomial.make(0, 0, 1),
          quadraticPolynomial.make(0, 0, -1),
        ),
      ),
    ).toBe(true)
  })
  test('fromCoefficients packs coefficient vectors into per-axis polynomials', () => {
    const c = quadratic2d.fromCoefficients(
      vector2.make(1, 2),
      vector2.make(3, 4),
      vector2.make(5, 6),
    )
    expect(c.x).toMatchObject({ c0: 1, c1: 3, c2: 5 })
    expect(c.y).toMatchObject({ c0: 2, c1: 4, c2: 6 })
  })
  test('fromBezierPoints reproduces the curve at t=0, t=0.5, t=1', () => {
    const p0 = vector2.make(0, 0)
    const p1 = vector2.make(2, 4)
    const p2 = vector2.make(4, 0)
    const c = quadratic2d.fromBezierPoints(p0, p1, p2)
    expect(quadratic2d.solve(c, 0)).toBeCloseToValue(p0)
    // Bezier at t=0.5 is (p0 + 2·p1 + p2) / 4 = (2, 2)
    expect(quadratic2d.solve(c, 0.5)).toBeCloseToValue(vector2.make(2, 2))
    expect(quadratic2d.solve(c, 1)).toBeCloseToValue(p2)
  })
  test('solve', () => {
    expect(
      quadratic2d.solve(
        quadratic2d.fromPolynomials(
          quadraticPolynomial.make(0, 0, 1),
          quadraticPolynomial.make(0, 0, -1),
        ),
        0.5,
      ),
    ).toBeCloseToValue(vector2.make(0.25, -0.25))
  })
  test('length', () => {
    expect(
      quadratic2d.length(
        quadratic2d.fromPolynomials(
          quadraticPolynomial.make(0, 0, 1),
          quadraticPolynomial.make(0, 0, -1),
        ),
        interval.make(0, 1),
      ),
    ).toBeCloseTo(vector2.magnitude(vector2.make(1, 1)), 10)
    expect(
      quadratic2d.length(
        quadratic2d.fromPolynomials(
          quadraticPolynomial.make(0, 0, 1),
          quadraticPolynomial.make(0, 0, -1),
        ),
        interval.make(0, 0.5),
      ),
    ).toBeCloseTo(vector2.magnitude(vector2.make(0.25, 0.25)), 10)
  })
})

describe('cubic2d', () => {
  test('make', () => {
    const c0 = cubicPolynomial.make(0, 0, 0, 1)
    const c1 = cubicPolynomial.make(0, 0, 0, -1)

    expect(cubic2d.fromPolynomials(c0, c1)).toMatchObject({
      x: c0,
      y: c1,
      [0]: c0,
      [1]: c1,
    })
  })
  test('isCubicCurve2d', () => {
    expect(
      cubic2d.isCubicCurve2d(
        cubic2d.fromPolynomials(
          cubicPolynomial.make(0, 0, 0, 1),
          cubicPolynomial.make(0, 0, 0, -1),
        ),
      ),
    ).toBe(true)
  })
  test('fromCoefficients packs coefficient vectors into per-axis polynomials', () => {
    const c = cubic2d.fromCoefficients(
      vector2.make(1, 2),
      vector2.make(3, 4),
      vector2.make(5, 6),
      vector2.make(7, 8),
    )
    expect(c.x).toMatchObject({ c0: 1, c1: 3, c2: 5, c3: 7 })
    expect(c.y).toMatchObject({ c0: 2, c1: 4, c2: 6, c3: 8 })
  })
  test('fromBezierPoints reproduces endpoints exactly and midpoint geometrically', () => {
    const p0 = vector2.make(0, 0)
    const p1 = vector2.make(0, 1)
    const p2 = vector2.make(1, 1)
    const p3 = vector2.make(1, 0)
    const c = cubic2d.fromBezierPoints(p0, p1, p2, p3)
    expect(cubic2d.solve(c, 0)).toBeCloseToValue(p0)
    expect(cubic2d.solve(c, 1)).toBeCloseToValue(p3)
    // Bezier at t=0.5 is (p0 + 3·p1 + 3·p2 + p3) / 8 = (0.5, 0.75)
    expect(cubic2d.solve(c, 0.5)).toBeCloseToValue(vector2.make(0.5, 0.75))
  })
  test('solve', () => {
    expect(
      cubic2d.solve(
        cubic2d.fromPolynomials(
          cubicPolynomial.make(0, 0, 0, 1),
          cubicPolynomial.make(0, 0, 0, -1),
        ),
        0.5,
      ),
    ).toBeCloseToValue(vector2.make(0.125, -0.125))
  })
  test('length', () => {
    expect(
      cubic2d.length(
        cubic2d.fromPolynomials(
          cubicPolynomial.make(0, 0, 0, 1),
          cubicPolynomial.make(0, 0, 0, -1),
        ),
        interval.make(0, 1),
      ),
    ).toBeCloseTo(vector2.magnitude(vector2.make(1, 1)), 10)
    expect(
      cubic2d.length(
        cubic2d.fromPolynomials(
          cubicPolynomial.make(0, 0, 0, 1),
          cubicPolynomial.make(0, 0, 0, -1),
        ),
        interval.make(0, 0.5),
      ),
    ).toBeCloseTo(vector2.magnitude(vector2.make(0.125, 0.125)), 10)
  })
})

describe('rationalCubic2d.makeMonotonicEasing', () => {
  test('endpoints land at (0, 0) and (1, 1)', () => {
    const ease = rationalCubic2d.makeMonotonicEasing(0.5, 1.5)
    expect(rationalCubic2d.solve(ease, 0)).toBeCloseToValue(vector2.make(0, 0))
    expect(rationalCubic2d.solve(ease, 1)).toBeCloseToValue(vector2.make(1, 1))
  })

  test('x(t) = t exactly (linear x mapping)', () => {
    const ease = rationalCubic2d.makeMonotonicEasing(0.5, 1.5)
    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      const point = rationalCubic2d.solve(ease, t)
      expect(point.x).toBeCloseTo(t, 10)
    }
  })

  test('smoothstep falls out from slopes (0, 0)', () => {
    // smoothstep(x) = 3x² - 2x³ — the classic ease-in-out shape
    const ease = rationalCubic2d.makeMonotonicEasing(0, 0)
    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      const expected = 3 * t * t - 2 * t * t * t
      expect(rationalCubic2d.solve(ease, t).y).toBeCloseTo(expected, 10)
    }
  })

  test('linear easing falls out from slopes (1, 1)', () => {
    const ease = rationalCubic2d.makeMonotonicEasing(1, 1)
    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      expect(rationalCubic2d.solve(ease, t).y).toBeCloseTo(t, 10)
    }
  })

  test('endpoint slopes match dy/dx at boundaries', () => {
    const m0 = 0.5
    const m1 = 1.5
    const ease = rationalCubic2d.makeMonotonicEasing(m0, m1)
    // Numerical derivative: y(t)/t for small t at start.
    const eps = 1e-6
    const dyStart = rationalCubic2d.solve(ease, eps).y / eps
    expect(dyStart).toBeCloseTo(m0, 4)
    // (y(1) - y(1-eps)) / eps for end.
    const yEnd = rationalCubic2d.solve(ease, 1).y
    const yPre = rationalCubic2d.solve(ease, 1 - eps).y
    const dyEnd = (yEnd - yPre) / eps
    expect(dyEnd).toBeCloseTo(m1, 4)
  })

  test('y is monotonically increasing across the curve', () => {
    const cases: ReadonlyArray<readonly [number, number]> = [
      [0, 0],
      [0, 1],
      [1, 0],
      [0.5, 1.5],
      [2, 0],
      [0, 2],
      [1.5, 1.5],
    ]
    for (const [m0, m1] of cases) {
      const ease = rationalCubic2d.makeMonotonicEasing(m0, m1)
      let prev = -Infinity
      for (let i = 0; i <= 50; i++) {
        const t = i / 50
        const y = rationalCubic2d.solve(ease, t).y
        expect(y).toBeGreaterThanOrEqual(prev - 1e-10)
        prev = y
      }
    }
  })

  test('rejects negative slopes', () => {
    expect(() => rationalCubic2d.makeMonotonicEasing(-0.1, 1)).toThrowError()
    expect(() => rationalCubic2d.makeMonotonicEasing(1, -0.1)).toThrowError()
  })

  test('rejects non-finite slopes', () => {
    expect(() => rationalCubic2d.makeMonotonicEasing(Number.NaN, 1)).toThrowError()
    expect(() => rationalCubic2d.makeMonotonicEasing(1, Number.POSITIVE_INFINITY)).toThrowError()
  })

  test('rejects slope pairs the default construction cannot make monotonic', () => {
    // Known failure case: extreme asymmetry beyond what α = m₀+1, β = m₁+1 handles.
    expect(() => rationalCubic2d.makeMonotonicEasing(0, 3)).toThrowError()
  })
})

describe('rationalCubic2d.solveAtX', () => {
  test('returns AtMostOne for monotonic easing curves', () => {
    const ease = rationalCubic2d.makeMonotonicEasing(0, 0)
    const result = rationalCubic2d.solveAtX(ease, 0.5)
    // Branded Increasing → AtMostOne at the type level; at runtime length ≤ 1.
    expect(result.length).toBeLessThanOrEqual(1)
    if (result._tag === 'one') {
      // For smoothstep: y(0.5) = 0.5.
      expect(result.value).toBeCloseTo(0.5, 10)
    }
  })

  test('matches solve when sampling y at x = t', () => {
    const ease = rationalCubic2d.makeMonotonicEasing(0.5, 1.5)
    for (let i = 0; i <= 10; i++) {
      const x = i / 10
      const fromSolve = rationalCubic2d.solve(ease, x).y // x(t) = t for this construction
      const fromSolveAtX = rationalCubic2d.solveAtX(ease, x)
      if (fromSolveAtX._tag === 'one') {
        expect(fromSolveAtX.value).toBeCloseTo(fromSolve, 10)
      } else {
        throw new Error('expected single solution for monotonic easing curve')
      }
    }
  })

  test('returns the matching y for asymmetric ease', () => {
    // For (m0, m1) = (0, 2), the closed-form y(t) = t² (rational simplifies).
    const ease = rationalCubic2d.makeMonotonicEasing(0, 2)
    const result = rationalCubic2d.solveAtX(ease, 0.5)
    if (result._tag === 'one') {
      expect(result.value).toBeCloseTo(0.25, 10) // 0.5² = 0.25
    } else {
      throw new Error('expected single solution')
    }
  })
})

describe('rationalCubic2d.solveAtY', () => {
  test('inverts solveAtX for monotonic easing', () => {
    const ease = rationalCubic2d.makeMonotonicEasing(0, 2)
    // y(0.5) = 0.25; solving for y = 0.25 should give x = 0.5.
    const result = rationalCubic2d.solveAtY(ease, 0.25)
    if (result._tag === 'one') {
      expect(result.value).toBeCloseTo(0.5, 10)
    } else {
      throw new Error('expected single solution')
    }
  })
})
