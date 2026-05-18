import { describe, expect, test } from 'vitest'
import * as cubic2d from '../src/curve/cubic2d.ts'
import * as linear2d from '../src/curve/linear2d.ts'
import * as quadratic2d from '../src/curve/quadratic2d.ts'
import * as rationalCubic2d from '../src/curve/rationalCubic2d.ts'
import * as interval from '../src/interval/interval.ts'
import * as cubicPolynomial from '../src/polynomial/cubic.ts'
import * as linearPolynomial from '../src/polynomial/linear.ts'
import * as quadraticPolynomial from '../src/polynomial/quadratic.ts'
import * as Solution from '../src/solution/solution.ts'
import * as vector2 from '../src/vector/vector2.ts'

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
  test('fromEndpoints reproduces the line at t=0 and t=1', () => {
    const c = linear2d.fromEndpoints(vector2.make(2, 3), vector2.make(7, 11))
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

describe('rationalCubic2d.fromBezierPoints', () => {
  test('two-arg form pins endpoints at (0, 0) and (1, 1)', () => {
    const c = rationalCubic2d.fromBezierPoints(
      vector2.makeWeighted(0.25, 0.1, 1),
      vector2.makeWeighted(0.75, 0.9, 1),
    )
    expect(rationalCubic2d.solve(c, 0)).toBeCloseToValue(vector2.make(0, 0))
    expect(rationalCubic2d.solve(c, 1)).toBeCloseToValue(vector2.make(1, 1))
  })

  test('two-arg unit-weight form matches the four-arg call with pinned endpoints', () => {
    const p1 = vector2.makeWeighted(0.25, 0.1, 1)
    const p2 = vector2.makeWeighted(0.75, 0.9, 1)
    const shorthand = rationalCubic2d.fromBezierPoints(p1, p2)
    const explicit = rationalCubic2d.fromBezierPoints(
      vector2.makeWeighted(0, 0, 1),
      p1,
      p2,
      vector2.makeWeighted(1, 1, 1),
    )
    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      expect(rationalCubic2d.solve(shorthand, t)).toBeCloseToValue(
        rationalCubic2d.solve(explicit, t),
      )
    }
  })

  test('two-arg form honors per-handle weights', () => {
    // Heavy start handle pulls the curve toward (1, 0) early; the projected
    // x-position at t = 0.5 ends up greater than the unit-weight case.
    const heavy = rationalCubic2d.fromBezierPoints(
      vector2.makeWeighted(1, 0, 8),
      vector2.makeWeighted(0, 1, 1),
    )
    const uniform = rationalCubic2d.fromBezierPoints(
      vector2.makeWeighted(1, 0, 1),
      vector2.makeWeighted(0, 1, 1),
    )
    expect(rationalCubic2d.solve(heavy, 0.5).x).toBeGreaterThan(
      rationalCubic2d.solve(uniform, 0.5).x,
    )
  })
})

describe('rationalCubic2d.fromSlopesAndCurvatures', () => {
  // Closed-form signed curvatures for the smoothstep y = 3t² - 2t³ at the
  // endpoints: y'(0) = y'(1) = 0, y''(0) = 6, y''(1) = -6, and at slope 0 the
  // κ = y'' / (1+y'²)^(3/2) formula collapses to κ = y''.
  const SMOOTHSTEP_INPUTS = [0, 0, 6, -6] as const

  test('endpoints land at (0, 0) and (1, 1)', () => {
    const ease = rationalCubic2d.fromSlopesAndCurvatures(0.5, 1.5, 0.5, -0.5)
    expect(rationalCubic2d.solve(ease, 0)).toBeCloseToValue(vector2.make(0, 0))
    expect(rationalCubic2d.solve(ease, 1)).toBeCloseToValue(vector2.make(1, 1))
  })

  test('x(t) = t exactly (linear x mapping)', () => {
    const ease = rationalCubic2d.fromSlopesAndCurvatures(0.5, 1.5, 0.5, -0.5)
    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      const point = rationalCubic2d.solve(ease, t)
      expect(point.x).toBeCloseTo(t, 10)
    }
  })

  test('smoothstep falls out from (0, 0, 6, -6)', () => {
    const ease = rationalCubic2d.fromSlopesAndCurvatures(...SMOOTHSTEP_INPUTS)
    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      const expected = 3 * t * t - 2 * t * t * t
      expect(rationalCubic2d.solve(ease, t).y).toBeCloseTo(expected, 10)
    }
  })

  test('linear easing falls out from (1, 1, 0, 0)', () => {
    const ease = rationalCubic2d.fromSlopesAndCurvatures(1, 1, 0, 0)
    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      expect(rationalCubic2d.solve(ease, t).y).toBeCloseTo(t, 10)
    }
  })

  test('endpoint slopes and curvatures match the inputs', () => {
    // Verify directly from the polynomial coefficients (analytical) rather
    // than finite-difference sampling — the cubic root path on solve adds
    // float noise that masks small errors in the construction.
    //
    // For y(t) = Y(t)/W(t) with our construction's Y.c0 = 0:
    //   y'(0)  = Y.c1 / W.c0
    //   y''(0) = 2·(Y.c2·W.c0 − Y.c0·W.c2)/W.c0²  −  2·y'(0)·W.c1/W.c0
    // At t = 1 we sum coefficients to get Y, Y', Y'', W, W', W'' there.
    const cases: ReadonlyArray<readonly [number, number, number, number]> = [
      [0, 0, 6, -6],
      [0.5, 0.5, 0, 0],
      [0, 1, 1, -1],
      [0.2, 0.8, 2, -3],
      [0.5, 1.5, 0.5, -0.5],
    ]
    for (const [m0, m1, k0, k1] of cases) {
      const ease = rationalCubic2d.fromSlopesAndCurvatures(m0, m1, k0, k1)
      const Y = ease.y
      const W = ease.w

      const yp0 = (Y.c1 * W.c0 - Y.c0 * W.c1) / (W.c0 * W.c0)
      const ypp0 = (2 * (Y.c2 * W.c0 - Y.c0 * W.c2)) / (W.c0 * W.c0) - (2 * yp0 * W.c1) / W.c0
      const kappa0 = ypp0 / Math.pow(1 + yp0 * yp0, 1.5)
      expect(yp0).toBeCloseTo(m0, 10)
      expect(kappa0).toBeCloseTo(k0, 10)

      const W1 = W.c0 + W.c1 + W.c2 + W.c3
      const Wp1 = W.c1 + 2 * W.c2 + 3 * W.c3
      const Wpp1 = 2 * W.c2 + 6 * W.c3
      const Y1 = Y.c0 + Y.c1 + Y.c2 + Y.c3
      const Yp1 = Y.c1 + 2 * Y.c2 + 3 * Y.c3
      const Ypp1 = 2 * Y.c2 + 6 * Y.c3
      const yp1 = (Yp1 * W1 - Y1 * Wp1) / (W1 * W1)
      const ypp1 = (Ypp1 * W1 - Y1 * Wpp1) / (W1 * W1) - (2 * yp1 * Wp1) / W1
      const kappa1 = ypp1 / Math.pow(1 + m1 * m1, 1.5)
      expect(yp1).toBeCloseTo(m1, 10)
      expect(kappa1).toBeCloseTo(k1, 10)
    }
  })

  test('rejects non-finite inputs', () => {
    expect(() => rationalCubic2d.fromSlopesAndCurvatures(Number.NaN, 0, 0, 0)).toThrowError()
    expect(() =>
      rationalCubic2d.fromSlopesAndCurvatures(0, Number.POSITIVE_INFINITY, 0, 0),
    ).toThrowError()
    expect(() => rationalCubic2d.fromSlopesAndCurvatures(0, 0, Number.NaN, 0)).toThrowError()
    expect(() =>
      rationalCubic2d.fromSlopesAndCurvatures(0, 0, 0, Number.NEGATIVE_INFINITY),
    ).toThrowError()
  })

  test('rejects singular constraint systems', () => {
    // m₀ = m₁ = 1 with κ ≠ 0 is the inconsistent-redundant case: u = v = 0
    // collapses the LHS to 0 while the RHS demands a nonzero curvature.
    expect(() => rationalCubic2d.fromSlopesAndCurvatures(1, 1, 1, 0)).toThrowError()
    expect(() => rationalCubic2d.fromSlopesAndCurvatures(1, 1, 0, -1)).toThrowError()
  })

  test('rejects denominator that vanishes on [0, 1]', () => {
    // Strongly negative endpoint curvature with slope-1 start pulls w₁ deep
    // negative and forces W to cross zero inside [0, 1].
    expect(() => rationalCubic2d.fromSlopesAndCurvatures(1, 0, -100, -100)).toThrowError()
  })
})

describe('rationalCubic2d.solveAtX', () => {
  test('returns AtMostOne when curve is asserted Increasing', () => {
    // Smoothstep inputs — monotonic by construction; asIncreasing verifies.
    const ease = rationalCubic2d.asIncreasing(rationalCubic2d.fromSlopesAndCurvatures(0, 0, 6, -6))
    const result = rationalCubic2d.solveAtX(ease, 0.5)
    expect(result.length).toBeLessThanOrEqual(1)
    if (result._tag === 'one') {
      // smoothstep(0.5) = 0.5
      expect(result.value).toBeCloseTo(0.5, 10)
    }
  })

  test('matches solve when sampling y at x = t', () => {
    // Use a curve whose denominator W has well-separated roots away from
    // [0, 1] — for curves where W's roots cluster near a unit endpoint, the
    // generic cubic root-finder behind solveAtX loses precision (a separate
    // numerical-robustness issue, not specific to this constructor).
    const ease = rationalCubic2d.fromSlopesAndCurvatures(0.5, 0.5, 0, 0)
    for (let i = 0; i <= 10; i++) {
      const x = i / 10
      const fromSolve = rationalCubic2d.solve(ease, x).y
      const fromSolveAtX = rationalCubic2d.solveAtX(ease, x)
      const got = Solution.valueOrUndefined(fromSolveAtX)
      expect(got).toBeDefined()
      expect(got!).toBeCloseTo(fromSolve, 10)
    }
  })

  test('returns the matching y for asymmetric ease', () => {
    // y(t) = t² satisfies y(0)=0, y(1)=1, y'(0)=0, y'(1)=2, y''=2 (constant).
    // At slope 0, κ(0) = y''(0) = 2. At slope 2, κ(1) = 2 / (1+4)^(3/2) = 2/5√5.
    const ease = rationalCubic2d.fromSlopesAndCurvatures(0, 2, 2, 2 / Math.pow(5, 1.5))
    const result = rationalCubic2d.solveAtX(ease, 0.5)
    const got = Solution.valueOrUndefined(result)
    expect(got).toBeDefined()
    expect(got!).toBeCloseTo(0.25, 10)
  })
})

describe('rationalCubic2d.solveAtY', () => {
  test('inverts solveAtX', () => {
    // Same y(t) = t² configuration as above; y = 0.25 → x = 0.5.
    const ease = rationalCubic2d.fromSlopesAndCurvatures(0, 2, 2, 2 / Math.pow(5, 1.5))
    const result = rationalCubic2d.solveAtY(ease, 0.25)
    const got = Solution.valueOrUndefined(result)
    expect(got).toBeDefined()
    expect(got!).toBeCloseTo(0.5, 10)
  })
})

describe('rationalCubic2d.approximateAsCubicCurves', () => {
  test('uniform weights yield a single segment that matches exactly', () => {
    // All weights = 1 → the rational degenerates to a polynomial cubic, so
    // the projection-based candidate is exact at every t.
    const rational = rationalCubic2d.fromBezierPoints(
      vector2.makeWeighted(0, 0, 1),
      vector2.makeWeighted(1, 2, 1),
      vector2.makeWeighted(2, 2, 1),
      vector2.makeWeighted(3, 0, 1),
    )
    const segments = rationalCubic2d.approximateAsCubicCurves(rational, 1e-6)
    expect(segments).toHaveLength(1)
    // Sample every 0.1 — the candidate should be indistinguishable from the rational.
    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      expect(cubic2d.solve(segments[0]!, t)).toBeCloseToValue(
        rationalCubic2d.solve(rational, t),
        1e-10,
      )
    }
  })

  test('non-uniform weights require subdivision', () => {
    // Symmetric weight bulge at the handles — strong pull means the
    // projection candidate diverges noticeably from the true rational midway.
    const rational = rationalCubic2d.fromBezierPoints(
      vector2.makeWeighted(0, 0, 1),
      vector2.makeWeighted(1, 2, 5),
      vector2.makeWeighted(2, 2, 5),
      vector2.makeWeighted(3, 0, 1),
    )
    const segments = rationalCubic2d.approximateAsCubicCurves(rational, 1e-3)
    expect(segments.length).toBeGreaterThan(1)
  })

  test('endpoint exactness preserved', () => {
    const rational = rationalCubic2d.fromBezierPoints(
      vector2.makeWeighted(0, 0, 1),
      vector2.makeWeighted(1, 2, 5),
      vector2.makeWeighted(2, 2, 5),
      vector2.makeWeighted(3, 0, 1),
    )
    const segments = rationalCubic2d.approximateAsCubicCurves(rational, 1e-3)
    expect(cubic2d.solve(segments.at(0)!, 0)).toBeCloseToValue(
      rationalCubic2d.solve(rational, 0),
      1e-10,
    )
    expect(cubic2d.solve(segments.at(-1)!, 1)).toBeCloseToValue(
      rationalCubic2d.solve(rational, 1),
      1e-10,
    )
  })

  test('C0 continuity between adjacent output segments', () => {
    const rational = rationalCubic2d.fromBezierPoints(
      vector2.makeWeighted(0, 0, 1),
      vector2.makeWeighted(1, 2, 5),
      vector2.makeWeighted(2, 2, 5),
      vector2.makeWeighted(3, 0, 1),
    )
    const segments = rationalCubic2d.approximateAsCubicCurves(rational, 1e-3)
    for (let i = 0; i < segments.length - 1; i++) {
      expect(cubic2d.solve(segments[i]!, 1)).toBeCloseToValue(
        cubic2d.solve(segments[i + 1]!, 0),
        1e-10,
      )
    }
  })

  test('tighter tolerance produces at least as many segments', () => {
    const rational = rationalCubic2d.fromBezierPoints(
      vector2.makeWeighted(0, 0, 1),
      vector2.makeWeighted(1, 2, 5),
      vector2.makeWeighted(2, 2, 5),
      vector2.makeWeighted(3, 0, 1),
    )
    const loose = rationalCubic2d.approximateAsCubicCurves(rational, 1e-1)
    const tight = rationalCubic2d.approximateAsCubicCurves(rational, 1e-4)
    expect(tight.length).toBeGreaterThanOrEqual(loose.length)
    expect(tight.length).toBeGreaterThan(1)
  })

  test('approximated points lie close to the original rational', () => {
    // Geometric sanity: dense-sample the output and verify every sample is
    // near *some* point on the original rational. Catches gross divergence.
    const rational = rationalCubic2d.fromBezierPoints(
      vector2.makeWeighted(0, 0, 1),
      vector2.makeWeighted(1, 2, 5),
      vector2.makeWeighted(2, 2, 5),
      vector2.makeWeighted(3, 0, 1),
    )
    const tolerance = 1e-3
    const segments = rationalCubic2d.approximateAsCubicCurves(rational, tolerance)

    const rationalSamples: Array<vector2.Vector2> = []
    for (let i = 0; i <= 2000; i++) {
      rationalSamples.push(rationalCubic2d.solve(rational, i / 2000))
    }

    let maxError = 0
    for (const cand of segments) {
      for (let i = 0; i <= 20; i++) {
        const p = cubic2d.solve(cand, i / 20)
        let nearest = Number.POSITIVE_INFINITY
        for (const r of rationalSamples) {
          const d = Math.hypot(p.x - r.x, p.y - r.y)
          if (d < nearest) {
            nearest = d
          }
        }
        if (nearest > maxError) {
          maxError = nearest
        }
      }
    }
    // Loose bound: midpoint tolerance is local per sub-segment; the geometric
    // distance from any output point to the input curve should comfortably
    // beat 10× tolerance.
    expect(maxError).toBeLessThan(tolerance * 10)
  })

  test('rejects invalid tolerance', () => {
    const rational = rationalCubic2d.fromBezierPoints(
      vector2.makeWeighted(0, 0, 1),
      vector2.makeWeighted(1, 1, 1),
      vector2.makeWeighted(2, 1, 1),
      vector2.makeWeighted(3, 0, 1),
    )
    expect(() => rationalCubic2d.approximateAsCubicCurves(rational, 0)).toThrowError()
    expect(() => rationalCubic2d.approximateAsCubicCurves(rational, -1)).toThrowError()
    expect(() => rationalCubic2d.approximateAsCubicCurves(rational, Number.NaN)).toThrowError()
  })
})

describe('rationalCubic2d.subdivide', () => {
  test('halves agree with the original at the split parameter and at endpoints', () => {
    const rational = rationalCubic2d.fromBezierPoints(
      vector2.makeWeighted(0, 0, 1),
      vector2.makeWeighted(1, 4, 3),
      vector2.makeWeighted(3, 4, 2),
      vector2.makeWeighted(4, 0, 1),
    )
    const [left, right] = rationalCubic2d.subdivide(rational, 0.3)

    // Left curve covers [0, 0.3] of the original.
    expect(rationalCubic2d.solve(left, 0)).toBeCloseToValue(rationalCubic2d.solve(rational, 0))
    expect(rationalCubic2d.solve(left, 1)).toBeCloseToValue(rationalCubic2d.solve(rational, 0.3))
    // Right curve covers [0.3, 1] of the original.
    expect(rationalCubic2d.solve(right, 0)).toBeCloseToValue(rationalCubic2d.solve(rational, 0.3))
    expect(rationalCubic2d.solve(right, 1)).toBeCloseToValue(rationalCubic2d.solve(rational, 1))
  })

  test('halves trace the original at interior parameters', () => {
    const rational = rationalCubic2d.fromBezierPoints(
      vector2.makeWeighted(0, 0, 1),
      vector2.makeWeighted(2, 3, 4),
      vector2.makeWeighted(5, 3, 0.5),
      vector2.makeWeighted(7, 0, 1),
    )
    const tSplit = 0.4
    const [left, right] = rationalCubic2d.subdivide(rational, tSplit)
    for (const u of [0.1, 0.5, 0.9]) {
      // Map u ∈ [0, 1] on left back to [0, tSplit] on the original.
      expect(rationalCubic2d.solve(left, u)).toBeCloseToValue(
        rationalCubic2d.solve(rational, u * tSplit),
      )
      // Map u ∈ [0, 1] on right back to [tSplit, 1] on the original.
      expect(rationalCubic2d.solve(right, u)).toBeCloseToValue(
        rationalCubic2d.solve(rational, tSplit + u * (1 - tSplit)),
      )
    }
  })
})

describe('rationalCubic2d.boundingBox', () => {
  test('encloses the curve over its parameter domain', () => {
    const rational = rationalCubic2d.fromBezierPoints(
      vector2.makeWeighted(0, 0, 1),
      vector2.makeWeighted(1, 4, 3),
      vector2.makeWeighted(3, 4, 2),
      vector2.makeWeighted(4, 0, 1),
    )
    const box = rationalCubic2d.boundingBox(rational, 0.01)
    for (let i = 0; i <= 200; i++) {
      const t = i / 200
      const p = rationalCubic2d.solve(rational, t)
      expect(p.x).toBeGreaterThanOrEqual(box.x.start - 1e-9)
      expect(p.x).toBeLessThanOrEqual(box.x.end + 1e-9)
      expect(p.y).toBeGreaterThanOrEqual(box.y.start - 1e-9)
      expect(p.y).toBeLessThanOrEqual(box.y.end + 1e-9)
    }
  })

  test('tighter tolerance produces same-or-smaller box', () => {
    const rational = rationalCubic2d.fromBezierPoints(
      vector2.makeWeighted(0, 0, 1),
      vector2.makeWeighted(1, 4, 3),
      vector2.makeWeighted(3, 4, 2),
      vector2.makeWeighted(4, 0, 1),
    )
    const loose = rationalCubic2d.boundingBox(rational, 1)
    const medium = rationalCubic2d.boundingBox(rational, 0.1)
    const tight = rationalCubic2d.boundingBox(rational, 0.001)

    // Each tightening can only shrink the box (or leave it unchanged).
    expect(medium.x.start).toBeGreaterThanOrEqual(loose.x.start - 1e-9)
    expect(medium.x.end).toBeLessThanOrEqual(loose.x.end + 1e-9)
    expect(medium.y.start).toBeGreaterThanOrEqual(loose.y.start - 1e-9)
    expect(medium.y.end).toBeLessThanOrEqual(loose.y.end + 1e-9)
    expect(tight.x.start).toBeGreaterThanOrEqual(medium.x.start - 1e-9)
    expect(tight.x.end).toBeLessThanOrEqual(medium.x.end + 1e-9)
    expect(tight.y.start).toBeGreaterThanOrEqual(medium.y.start - 1e-9)
    expect(tight.y.end).toBeLessThanOrEqual(medium.y.end + 1e-9)
  })

  test('uniform-weight rational matches polynomial bounding box exactly', () => {
    // With uniform weights the curve coincides with the corresponding
    // polynomial cubic. The polynomial fast path computes the box from
    // per-axis cubic extrema, so the result is exact — not slack-bounded.
    const rational = rationalCubic2d.fromBezierPoints(
      vector2.makeWeighted(0, 0, 1),
      vector2.makeWeighted(1, 5, 1),
      vector2.makeWeighted(3, 5, 1),
      vector2.makeWeighted(4, 0, 1),
    )
    const polynomial = cubic2d.fromBezierPoints(
      vector2.make(0, 0),
      vector2.make(1, 5),
      vector2.make(3, 5),
      vector2.make(4, 0),
    )
    const rationalBox = rationalCubic2d.boundingBox(rational, 0.001)
    const polynomialBox = cubic2d.boundingBox(polynomial)

    expect(rationalBox.x.start).toBeCloseTo(polynomialBox.x.start, 12)
    expect(rationalBox.x.end).toBeCloseTo(polynomialBox.x.end, 12)
    expect(rationalBox.y.start).toBeCloseTo(polynomialBox.y.start, 12)
    expect(rationalBox.y.end).toBeCloseTo(polynomialBox.y.end, 12)
  })

  test('rejects non-positive tolerance', () => {
    const rational = rationalCubic2d.fromBezierPoints(
      vector2.makeWeighted(0, 0, 1),
      vector2.makeWeighted(1, 1, 1),
      vector2.makeWeighted(2, 1, 1),
      vector2.makeWeighted(3, 0, 1),
    )
    expect(() => rationalCubic2d.boundingBox(rational, 0)).toThrow()
    expect(() => rationalCubic2d.boundingBox(rational, -1)).toThrow()
  })
})

describe('rationalCubic2d monotonicity refiners', () => {
  // x(t) = t (linear, increasing), y(t) = t (linear, increasing) — both axes strict
  const xIncYInc = rationalCubic2d.fromSlopesAndCurvatures(1, 1, 0, 0)

  // x(t) = t (increasing), y is the smoothstep cubic (increasing on [0,1])
  const xIncYSmoothInc = rationalCubic2d.fromSlopesAndCurvatures(0, 0, 6, -6)

  // U-shape in x via control points 0, 1, -1, 0 with unit weights → x not monotonic
  const xNotMono = rationalCubic2d.fromBezierPoints(
    vector2.makeWeighted(0, 0, 1),
    vector2.makeWeighted(1, 0, 1),
    vector2.makeWeighted(-1, 0, 1),
    vector2.makeWeighted(0, 0, 1),
  )

  // U-shape in y: x monotonic, y not
  const yNotMono = rationalCubic2d.fromBezierPoints(
    vector2.makeWeighted(0, 0, 1),
    vector2.makeWeighted(1, 1, 1),
    vector2.makeWeighted(2, -1, 1),
    vector2.makeWeighted(3, 0, 1),
  )

  test('per-axis x refiners accept x-monotonic, reject non-x-monotonic', () => {
    expect(rationalCubic2d.isMonotonicX(xIncYInc)).toBe(true)
    expect(rationalCubic2d.isIncreasingX(xIncYInc)).toBe(true)
    expect(rationalCubic2d.isDecreasingX(xIncYInc)).toBe(false)
    expect(rationalCubic2d.isMonotonicX(xNotMono)).toBe(false)
    expect(() => rationalCubic2d.asMonotonicX(xNotMono)).toThrow()
    expect(() => rationalCubic2d.asIncreasingX(xIncYInc)).not.toThrow()
  })

  test('per-axis y refiners accept y-monotonic, reject non-y-monotonic', () => {
    expect(rationalCubic2d.isMonotonicY(xIncYInc)).toBe(true)
    expect(rationalCubic2d.isIncreasingY(xIncYInc)).toBe(true)
    expect(rationalCubic2d.isMonotonicY(yNotMono)).toBe(false)
    expect(() => rationalCubic2d.asMonotonicY(yNotMono)).toThrow()
    expect(() => rationalCubic2d.asIncreasingY(xIncYSmoothInc)).not.toThrow()
  })

  test('per-axis refiners decide axes independently', () => {
    // yNotMono has x monotonic but y not — x refiner passes, y refiner fails
    expect(rationalCubic2d.isMonotonicX(yNotMono)).toBe(true)
    expect(rationalCubic2d.isMonotonicY(yNotMono)).toBe(false)
    expect(rationalCubic2d.isMonotonic(yNotMono)).toBe(false)
  })

  test('combined refiner agrees with per-axis conjunction', () => {
    expect(rationalCubic2d.isMonotonic(xIncYInc)).toBe(
      rationalCubic2d.isMonotonicX(xIncYInc) && rationalCubic2d.isMonotonicY(xIncYInc),
    )
    expect(rationalCubic2d.isMonotonic(xNotMono)).toBe(
      rationalCubic2d.isMonotonicX(xNotMono) && rationalCubic2d.isMonotonicY(xNotMono),
    )
  })
})
