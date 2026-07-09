import { describe, expect, test } from 'vitest'
import * as Interval from '../src/interval/interval.ts'
import * as Monotonicity from '../src/monotonicity/monotonicity.ts'
import * as CubicPath2d from '../src/path/cubic2d.ts'
import * as cubic from '../src/polynomial/cubic.ts'
import * as quadratic from '../src/polynomial/quadratic.ts'
import * as Cardinal2d from '../src/splines/cardinal2d.ts'

const unit = Interval.make(0, 1)
const biunit = Interval.make(-1, 1)

// Pinned-endpoint Cardinal paths whose final segment has a constructed zero
// end-tangent: the chord-weighted tangent arithmetic cancels x'(1) to
// 0 ± 2 ulps, and the derivative's root lands an ulp to either side of t = 1
// depending on the inputs' last bits. Before tolerance-aware classification,
// which side it landed on decided whether `asMonotonicX` passed or threw
// (see curvy-asmonotonicx-epsilon-report.md).
const PINNED_FIXTURES: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  [
    [0, 10],
    [1, 0.02],
    [2, 0.02],
  ],
  [
    [0, 3],
    [1, 0.05],
    [2, 0.05],
  ],
  [
    [0, 6],
    [1, 1],
    [2, 1],
  ],
  [
    [0, 0],
    [1, 1],
    [10, 2],
  ],
  [
    [0, 0],
    [1, 1],
    [50, 2],
  ],
  [
    [0, 0],
    [1, 1],
    [200, 2],
  ],
  [
    [320, 14],
    [400, 15],
    [1280, 22],
  ],
]

const toPinnedPath = (points: ReadonlyArray<readonly [number, number]>) =>
  Cardinal2d.fromTuples(points).pipe(Cardinal2d.withInterpolatedEndpoints, Cardinal2d.toPath)

describe('tolerance-aware monotonicity classification', () => {
  test('pinned-endpoint cardinal paths brand as monotonic in x', () => {
    for (const points of PINNED_FIXTURES) {
      expect(() => CubicPath2d.asMonotonicX(toPinnedPath(points))).not.toThrow()
    }
  })

  test('classification is invariant under scaling and translation of the input data', () => {
    for (const points of PINNED_FIXTURES) {
      for (const k of [1e-6, 1e-3, 1e3, 1e6]) {
        const scaled = points.map(([x, y]) => [x * k, y * k] as const)
        expect(() => CubicPath2d.asMonotonicX(toPinnedPath(scaled))).not.toThrow()
      }
      const translated = points.map(([x, y]) => [x + 1000, y - 1000] as const)
      expect(() => CubicPath2d.asMonotonicX(toPinnedPath(translated))).not.toThrow()
    }
  })

  test('an interior derivative touch without a crossing is monotonic', () => {
    // t³ on [-1, 1]: the derivative 3t² has a double root at 0 — it grazes
    // zero but never goes negative, so the function is strictly increasing.
    expect(cubic.monotonicity(cubic.make(0, 0, 0, 1), biunit)).toBe(Monotonicity.Increasing)
    expect(cubic.monotonicity(cubic.make(0, 0, 0, -1), biunit)).toBe(Monotonicity.Decreasing)
  })

  test('an ulp-scale derivative excursion classifies by the dominant sign', () => {
    // decreasing throughout except a +ulp-scale touch just inside t = 1
    expect(cubic.monotonicity(cubic.make(10, -30, 30 - 1e-15, -10 + 1e-15), unit)).toBe(
      Monotonicity.Decreasing,
    )
    // quadratic analog: the derivative grazes zero an ulp before the interval
    // end, placing its root microscopically inside (0, 1)
    expect(quadratic.monotonicity(quadratic.make(1, -2, 1 + Number.EPSILON), unit)).toBe(
      Monotonicity.Decreasing,
    )
  })

  test('genuine reversals still classify as None', () => {
    // macroscopic: t³ - t turns twice on [-1, 1]
    expect(cubic.monotonicity(cubic.make(0, -1, 0, 1), biunit)).toBe(Monotonicity.None)
    // small but real: the derivative (t - 0.5)² - 0.01 dips to -4% of its
    // interval maximum — far beyond rounding noise, so it must stay a crossing
    expect(cubic.monotonicity(cubic.make(0, 0.24, -0.5, 1 / 3), unit)).toBe(Monotonicity.None)
    // path level: an actually x-reversing spline still refuses the brand
    const reversing = Cardinal2d.fromTuples([
      [0, 0],
      [2, 1],
      [1, 2],
      [3, 3],
    ]).pipe(Cardinal2d.withInterpolatedEndpoints, Cardinal2d.toPath)
    expect(() => CubicPath2d.asMonotonicX(reversing)).toThrow(/not monotonic in x/)
  })

  test('fromDerivativeRange sign coverage', () => {
    expect(Monotonicity.fromDerivativeRange(0, 0)).toBe(Monotonicity.Constant)
    expect(Monotonicity.fromDerivativeRange(1e-16, 1)).toBe(Monotonicity.Increasing)
    expect(Monotonicity.fromDerivativeRange(-1e-16, 1)).toBe(Monotonicity.Increasing)
    expect(Monotonicity.fromDerivativeRange(-1, 1e-16)).toBe(Monotonicity.Decreasing)
    expect(Monotonicity.fromDerivativeRange(-1, 1)).toBe(Monotonicity.None)
    // explicit absolute tolerance overrides the relative default
    expect(Monotonicity.fromDerivativeRange(-0.01, 1, 0.05)).toBe(Monotonicity.Increasing)
  })
})
