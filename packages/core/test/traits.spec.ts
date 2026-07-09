import { describe, expect, expectTypeOf, test } from 'vitest'
import * as cubicCurve2d from '../src/curve/cubic2d.ts'
import * as linearCurve2d from '../src/curve/linear2d.ts'
import * as quadraticCurve2d from '../src/curve/quadratic2d.ts'
import * as interval from '../src/interval/interval.ts'
import * as matrix3x3 from '../src/matrix/matrix3x3.ts'
import * as matrix4x4 from '../src/matrix/matrix4x4.ts'
import type { Invertible } from '../src/matrix/traits.ts'
import * as cubicPath2d from '../src/path/cubic2d.ts'
import * as cardinal2d from '../src/splines/cardinal2d.ts'
import * as linearPath2d from '../src/path/linear2d.ts'
import * as quadraticPath2d from '../src/path/quadratic2d.ts'
import * as cubic from '../src/polynomial/cubic.ts'
import * as linear from '../src/polynomial/linear.ts'
import * as quadratic from '../src/polynomial/quadratic.ts'
import type { Decreasing, Increasing, Monotonic } from '../src/polynomial/traits.ts'
import * as Bezier2d from '../src/splines/bezier2d.ts'
import * as Solution from '../src/solution/solution.ts'
import * as Affine2d from '../src/transform/affine2d.ts'
import * as vector2 from '../src/vector/vector2.ts'

describe('LinearPolynomial traits', () => {
  test('isMonotonic narrows non-zero-slope linear to Monotonic', () => {
    const p = linear.make(3, 5)
    expect(linear.isMonotonic(p)).toBe(true)
    if (linear.isMonotonic(p)) {
      expectTypeOf(p).toEqualTypeOf<linear.LinearPolynomial<unknown & Monotonic>>()
    }
  })
  test('isMonotonic returns false for constant linear', () => {
    expect(linear.isMonotonic(linear.make(3, 0))).toBe(false)
  })
  test('isIncreasing / isDecreasing distinguish slope direction', () => {
    expect(linear.isIncreasing(linear.make(0, 1))).toBe(true)
    expect(linear.isDecreasing(linear.make(0, 1))).toBe(false)
    expect(linear.isIncreasing(linear.make(0, -1))).toBe(false)
    expect(linear.isDecreasing(linear.make(0, -1))).toBe(true)
  })
  test('asMonotonic returns the polynomial when monotonic', () => {
    const p = linear.make(0, 1)
    expect(linear.asMonotonic(p)).toBe(p)
  })
  test('asMonotonic throws on a constant linear polynomial', () => {
    expect(() => linear.asMonotonic(linear.make(5, 0))).toThrow(/not monotonic/)
  })
  test('solveInverse on Monotonic linear returns Solution.One, not AtMostOne', () => {
    const p = linear.asMonotonic(linear.make(0, 2))
    const result = linear.solveInverse(p, 4)
    expectTypeOf(result).toEqualTypeOf<Solution.One<number>>()
    expect(result.value).toBe(2)
  })
  test('solveInverse on plain linear returns Solution.AtMostOne', () => {
    const p = linear.make(0, 2)
    const result = linear.solveInverse(p, 4)
    expectTypeOf(result).toEqualTypeOf<Solution.AtMostOne<number>>()
    expect([...result]).toEqual([2])
  })
})

describe('QuadraticPolynomial traits', () => {
  test('isMonotonic over an interval that excludes the extremum returns true', () => {
    // y = x², extremum at x = 0; on [0.5, 1] the polynomial is monotonic
    const p = quadratic.make(0, 0, 1)
    expect(quadratic.isMonotonic(p, interval.make(0.5, 1))).toBe(true)
  })
  test('isMonotonic over an interval containing the extremum returns false', () => {
    const p = quadratic.make(0, 0, 1)
    expect(quadratic.isMonotonic(p, interval.make(-1, 1))).toBe(false)
  })
  test('isMonotonic without an interval returns false for true quadratics', () => {
    expect(quadratic.isMonotonic(quadratic.make(0, 0, 1))).toBe(false)
  })
  test('asMonotonic narrows the type, solveInverse tightens to ZeroToOne', () => {
    const p = quadratic.asMonotonic(quadratic.make(0, 0, 1), interval.make(0.5, 1))
    const result = quadratic.solveInverse(p, 0.49)
    expectTypeOf(result).toEqualTypeOf<Solution.AtMostOne<number>>()
  })
  test('plain quadratic solveInverse keeps the ZeroToTwo return', () => {
    const p = quadratic.make(0, 0, 1)
    const result = quadratic.solveInverse(p, 4)
    expectTypeOf(result).toEqualTypeOf<Solution.AtMostTwo<number>>()
  })
  test('monotonicity over a zero-width interval throws', () => {
    expect(() => quadratic.monotonicity(quadratic.make(0, 0, 1), interval.make(0.5))).toThrow(
      /zero-width/,
    )
  })
})

describe('CubicPolynomial traits', () => {
  test('isMonotonic over a no-extrema interval returns true', () => {
    // y = x³ + x is monotonic everywhere (derivative 3x² + 1 > 0)
    const p = cubic.make(0, 1, 0, 1)
    expect(cubic.isMonotonic(p, interval.make(-10, 10))).toBe(true)
  })
  test('isMonotonic over an interval containing an extremum returns false', () => {
    // y = x³ - 3x has extrema at x = ±1
    const p = cubic.make(0, -3, 0, 1)
    expect(cubic.isMonotonic(p, interval.make(-2, 2))).toBe(false)
  })
  test('asMonotonic + solveInverse tightens to ZeroToOne', () => {
    const p = cubic.asMonotonic(cubic.make(0, 1, 0, 1), interval.make(-10, 10))
    const result = cubic.solveInverse(p, 5)
    expectTypeOf(result).toEqualTypeOf<Solution.AtMostOne<number>>()
  })
  test('plain cubic solveInverse keeps the ZeroToThree return', () => {
    const result = cubic.solveInverse(cubic.make(0, -3, 0, 1), 0)
    expectTypeOf(result).toEqualTypeOf<Solution.AtMostThree<number>>()
  })
  test('monotonicity over a zero-width interval throws', () => {
    expect(() => cubic.monotonicity(cubic.make(0, 1, 0, 1), interval.make(0.5))).toThrow(
      /zero-width/,
    )
  })
})

describe('LinearCurve2d traits', () => {
  test('combined isMonotonic requires both axes', () => {
    const c = linearCurve2d.fromEndpoints(vector2.make(0, 0), vector2.make(2, 3))
    expect(linearCurve2d.isMonotonic(c)).toBe(true)
    if (linearCurve2d.isMonotonic(c)) {
      expectTypeOf(c).toEqualTypeOf<
        linearCurve2d.LinearCurve2d<unknown & Monotonic, unknown & Monotonic>
      >()
    }
  })
  test('isMonotonic returns false when one axis is constant', () => {
    // y axis constant — curve is monotonic in x but not in y
    const c = linearCurve2d.fromEndpoints(vector2.make(0, 5), vector2.make(2, 5))
    expect(linearCurve2d.isMonotonic(c)).toBe(false)
  })
  test('combined isIncreasing narrows both axes', () => {
    const c = linearCurve2d.fromEndpoints(vector2.make(0, 0), vector2.make(2, 3))
    expect(linearCurve2d.isIncreasing(c)).toBe(true)
    if (linearCurve2d.isIncreasing(c)) {
      expectTypeOf(c).toEqualTypeOf<
        linearCurve2d.LinearCurve2d<unknown & Increasing, unknown & Increasing>
      >()
    }
  })
  test('asMonotonic throws when one axis is constant', () => {
    const c = linearCurve2d.fromEndpoints(vector2.make(0, 5), vector2.make(2, 5))
    expect(() => linearCurve2d.asMonotonic(c)).toThrow(/not monotonic in both axes/)
  })
  test('per-axis check is via the polynomial directly', () => {
    // documents the recommended path for one-axis checks
    const c = linearCurve2d.fromEndpoints(vector2.make(0, 5), vector2.make(2, 5))
    expect(linear.isMonotonic(c.x)).toBe(true)
    expect(linear.isMonotonic(c.y)).toBe(false)
  })
})

describe('QuadraticCurve2d traits', () => {
  test('combined isMonotonic on a both-monotonic curve', () => {
    // bezier control points (0,0), (1,2), (2,3): both x and y monotonic on [0, 1]
    const c = quadraticCurve2d.fromBezierPoints(
      vector2.make(0, 0),
      vector2.make(1, 2),
      vector2.make(2, 3),
    )
    expect(quadraticCurve2d.isMonotonic(c)).toBe(true)
  })
  test('combined isMonotonic returns false when y has an extremum in [0, 1]', () => {
    // y goes up then down (peak at t = 0.5)
    const c = quadraticCurve2d.fromBezierPoints(
      vector2.make(0, 0),
      vector2.make(1, 1),
      vector2.make(2, 0),
    )
    expect(quadraticCurve2d.isMonotonic(c)).toBe(false)
  })
})

describe('CubicCurve2d traits', () => {
  test('isMonotonic on a Bézier with monotonic axes is true', () => {
    // bezier from (0,0) to (3,3) with control points along the diagonal — monotonic in both
    const c = cubicCurve2d.fromBezierPoints(
      vector2.make(0, 0),
      vector2.make(1, 1),
      vector2.make(2, 2),
      vector2.make(3, 3),
    )
    expect(cubicCurve2d.isMonotonic(c)).toBe(true)
  })
  test('isMonotonic on a Bézier with a y-axis extremum is false', () => {
    // bezier with y going up then back down: not monotonic in y
    const c = cubicCurve2d.fromBezierPoints(
      vector2.make(0, 0),
      vector2.make(1, 1),
      vector2.make(2, 1),
      vector2.make(3, 0),
    )
    expect(cubicCurve2d.isMonotonic(c)).toBe(false)
    // per-axis checks via the polynomial
    expect(cubic.isMonotonic(c.x, interval.unit)).toBe(true)
    expect(cubic.isMonotonic(c.y, interval.unit)).toBe(false)
  })
})

describe('Path Continuous trait', () => {
  test('Bezier2d.toPath produces a continuous cubic path', () => {
    const p = Bezier2d.make(
      vector2.make(0, 0),
      vector2.make(0, 1),
      vector2.make(1, 1),
      vector2.make(1, 0),
    ).pipe(
      Bezier2d.append(vector2.make(1, -1), vector2.make(2, -1), vector2.make(2, 0)),
      Bezier2d.toPath,
    )
    expect(cubicPath2d.isContinuous(p)).toBe(true)
  })
  test('a path assembled from disjoint curves is not continuous', () => {
    const c0 = cubicCurve2d.fromBezierPoints(
      vector2.make(0, 0),
      vector2.make(1, 0),
      vector2.make(1, 1),
      vector2.make(0, 1),
    )
    const c1 = cubicCurve2d.fromBezierPoints(
      vector2.make(10, 10),
      vector2.make(11, 10),
      vector2.make(11, 11),
      vector2.make(10, 11),
    )
    const p = cubicPath2d.make(c0, c1)
    expect(cubicPath2d.isContinuous(p)).toBe(false)
    expect(() => cubicPath2d.asContinuous(p)).toThrow(/not continuous/)
  })
  test('continuity tolerates knot drift proportional to coordinate magnitude', () => {
    // Non-dyadic coordinates offset to 1e9: segment endpoint sums round at
    // ulp(1e9) ≈ 2.4e-7, so adjacent knots can drift far beyond the absolute
    // coincidence floor while remaining pure storage noise at this scale.
    const k = 1e9
    const drifted = cardinal2d
      .fromTuples([
        [k + 0.1, k + 0.3],
        [k + 1.1, k + 2.3],
        [k + 2.7, k + 1.9],
        [k + 3.3, k + 3.7],
      ])
      .pipe(cardinal2d.withInterpolatedEndpoints, cardinal2d.toPath)
    expect(cubicPath2d.isContinuous(drifted)).toBe(true)

    // A genuine gap at the same magnitude is still far outside the band.
    const a = cardinal2d
      .fromTuples([
        [k, k],
        [k + 1, k + 2],
      ])
      .pipe(cardinal2d.withInterpolatedEndpoints, cardinal2d.toPath)
    const b = cardinal2d
      .fromTuples([
        [k + 5, k + 5],
        [k + 6, k + 7],
      ])
      .pipe(cardinal2d.withInterpolatedEndpoints, cardinal2d.toPath)
    const gapped = cubicPath2d.append(a, [...b][0] as never)
    expect(cubicPath2d.isContinuous(gapped)).toBe(false)
  })
  test('linear path Continuous refiner', () => {
    const c0 = linearCurve2d.fromEndpoints(vector2.make(0, 0), vector2.make(1, 1))
    const c1 = linearCurve2d.fromEndpoints(vector2.make(1, 1), vector2.make(2, 0))
    const p = linearPath2d.make(c0, c1)
    expect(linearPath2d.isContinuous(p)).toBe(true)
    if (linearPath2d.isContinuous(p)) {
      expectTypeOf(p).toMatchTypeOf<linearPath2d.LinearPath2d<linearPath2d.Continuous>>()
    }
  })
  test('quadratic path Continuous refiner', () => {
    const c0 = quadraticCurve2d.fromBezierPoints(
      vector2.make(0, 0),
      vector2.make(1, 1),
      vector2.make(2, 0),
    )
    const c1 = quadraticCurve2d.fromBezierPoints(
      vector2.make(2, 0),
      vector2.make(3, -1),
      vector2.make(4, 0),
    )
    const p = quadraticPath2d.make(c0, c1)
    expect(quadraticPath2d.isContinuous(p)).toBe(true)
  })
})

describe('LinearPath2d per-axis monotonicity', () => {
  test('isIncreasingX on a path with strictly-increasing x segments', () => {
    const p = linearPath2d.make(
      linearCurve2d.fromEndpoints(vector2.make(0, 0), vector2.make(1, 2)),
      linearCurve2d.fromEndpoints(vector2.make(1, 2), vector2.make(3, 5)),
    )
    expect(linearPath2d.isIncreasingX(p)).toBe(true)
    expect(linearPath2d.isMonotonicX(p)).toBe(true)
    expect(linearPath2d.isDecreasingX(p)).toBe(false)
  })
  test('isIncreasingX fails when adjacent segments overlap in x', () => {
    const p = linearPath2d.make(
      linearCurve2d.fromEndpoints(vector2.make(0, 0), vector2.make(5, 2)),
      linearCurve2d.fromEndpoints(vector2.make(3, 2), vector2.make(7, 5)),
    )
    expect(linearPath2d.isIncreasingX(p)).toBe(false)
  })
  test('isDecreasingX on a path with strictly-decreasing x segments', () => {
    const p = linearPath2d.make(
      linearCurve2d.fromEndpoints(vector2.make(3, 0), vector2.make(1, 2)),
      linearCurve2d.fromEndpoints(vector2.make(1, 2), vector2.make(-1, 5)),
    )
    expect(linearPath2d.isDecreasingX(p)).toBe(true)
    expect(linearPath2d.isMonotonicX(p)).toBe(true)
  })
  test('isIncreasingY / isDecreasingY check the y axis', () => {
    const incY = linearPath2d.make(
      linearCurve2d.fromEndpoints(vector2.make(0, 0), vector2.make(3, 1)),
      linearCurve2d.fromEndpoints(vector2.make(3, 1), vector2.make(-2, 4)),
    )
    expect(linearPath2d.isIncreasingY(incY)).toBe(true)
    expect(linearPath2d.isIncreasingX(incY)).toBe(false) // x goes 0→3→-2
  })
  test('asMonotonicX returns the branded path', () => {
    const p = linearPath2d.make(linearCurve2d.fromEndpoints(vector2.make(0, 0), vector2.make(2, 5)))
    const branded = linearPath2d.asMonotonicX(p)
    expectTypeOf(branded).toMatchTypeOf<linearPath2d.LinearPath2d<linearPath2d.MonotonicX>>()
  })
  test('asMonotonicX throws on non-monotonic-x paths', () => {
    const p = linearPath2d.make(
      linearCurve2d.fromEndpoints(vector2.make(0, 0), vector2.make(2, 1)),
      linearCurve2d.fromEndpoints(vector2.make(2, 1), vector2.make(0, 2)), // x reverses
    )
    expect(() => linearPath2d.asMonotonicX(p)).toThrow(/not monotonic in x/)
  })
})

describe('QuadraticPath2d per-axis monotonicity', () => {
  test('isIncreasingX on a monotonic-in-x quadratic path', () => {
    // x(t) = 0 + 2t + 0t² over [0,1] = [0, 2], strictly increasing
    const c0 = quadraticCurve2d.fromBezierPoints(
      vector2.make(0, 0),
      vector2.make(1, 1),
      vector2.make(2, 0),
    )
    const c1 = quadraticCurve2d.fromBezierPoints(
      vector2.make(2, 0),
      vector2.make(3, -1),
      vector2.make(4, 1),
    )
    const p = quadraticPath2d.make(c0, c1)
    expect(quadraticPath2d.isIncreasingX(p)).toBe(true)
  })
  test('isIncreasingX rejects a curve with an interior x-extremum', () => {
    // x goes up then down: 0 → 1 → 0 (control p1 at x=1, peak in interior)
    const c = quadraticCurve2d.fromBezierPoints(
      vector2.make(0, 0),
      vector2.make(1, 1),
      vector2.make(0, 0),
    )
    const p = quadraticPath2d.make(c)
    expect(quadraticPath2d.isIncreasingX(p)).toBe(false)
  })
})

describe('CubicPath2d per-axis monotonicity', () => {
  test('isIncreasingX on a path with strictly-increasing x cubics', () => {
    const c0 = cubicCurve2d.fromBezierPoints(
      vector2.make(0, 0),
      vector2.make(1, 1),
      vector2.make(2, 2),
      vector2.make(3, 3),
    )
    const c1 = cubicCurve2d.fromBezierPoints(
      vector2.make(3, 3),
      vector2.make(4, 4),
      vector2.make(5, 5),
      vector2.make(6, 6),
    )
    const p = cubicPath2d.make(c0, c1)
    expect(cubicPath2d.isIncreasingX(p)).toBe(true)
  })
  test('isMonotonicY rejects a path with a y-extremum in [0, 1]', () => {
    // y(t) traces 0 → 1 → 1 → 0 — has an interior maximum
    const c = cubicCurve2d.fromBezierPoints(
      vector2.make(0, 0),
      vector2.make(1, 1),
      vector2.make(2, 1),
      vector2.make(3, 0),
    )
    const p = cubicPath2d.make(c)
    expect(cubicPath2d.isMonotonicY(p)).toBe(false)
  })
})

describe('Trait accumulation', () => {
  test('isIncreasing implies Monotonic at the type level', () => {
    const p = linear.make(0, 2)
    if (linear.isIncreasing(p)) {
      // Increasing extends Monotonic, so the narrowed type satisfies both.
      expectTypeOf(p).toMatchTypeOf<linear.LinearPolynomial<Monotonic>>()
      expectTypeOf(p).toMatchTypeOf<linear.LinearPolynomial<Increasing>>()
    }
  })
  test('Decreasing also implies Monotonic', () => {
    const p = linear.make(0, -2)
    if (linear.isDecreasing(p)) {
      expectTypeOf(p).toMatchTypeOf<linear.LinearPolynomial<Monotonic>>()
      expectTypeOf(p).toMatchTypeOf<linear.LinearPolynomial<Decreasing>>()
    }
  })
})

describe('Matrix3x3 Invertible trait', () => {
  test('isInvertible narrows a non-singular matrix to Invertible', () => {
    const m = matrix3x3.make(1, 2, 3, 0, 1, 4, 5, 6, 0)
    expect(matrix3x3.isInvertible(m)).toBe(true)
    if (matrix3x3.isInvertible(m)) {
      expectTypeOf(m).toEqualTypeOf<matrix3x3.Matrix3x3<unknown & Invertible>>()
    }
  })
  test('isInvertible returns false for a singular matrix', () => {
    expect(matrix3x3.isInvertible(matrix3x3.make(1, 2, 3, 4, 5, 6, 7, 8, 9))).toBe(false)
  })
  test('singularity threshold is relative to the matrix scale', () => {
    // det = 1e-16, but the matrix is a perfectly conditioned uniform scale —
    // its inverse is exactly diag(1e8, 1e8, 1). A small determinant alone
    // does not make a matrix singular.
    const scaled = matrix3x3.make(1e-8, 0, 0, 0, 1e-8, 0, 0, 0, 1)
    expect(matrix3x3.isInvertible(scaled)).toBe(true)

    // det ≈ -3e-13 from an ulp-scale perturbation of a genuinely singular
    // matrix with rows of magnitude ~10 — noise relative to the matrix
    // scale, so it must still classify as singular.
    const nearSingular = matrix3x3.make(1, 2, 3, 4, 5, 6, 7, 8, 9 + 1e-13)
    expect(matrix3x3.isInvertible(nearSingular)).toBe(false)
  })
  test('asInvertible returns the same matrix when invertible', () => {
    const m = matrix3x3.make(1, 2, 3, 0, 1, 4, 5, 6, 0)
    expect(matrix3x3.asInvertible(m)).toBe(m)
  })
  test('asInvertible throws on a singular matrix', () => {
    expect(() => matrix3x3.asInvertible(matrix3x3.make(1, 2, 3, 4, 5, 6, 7, 8, 9))).toThrow(
      /not invertible/,
    )
  })
  test('inverse on Invertible returns Solution.One, not AtMostOne', () => {
    const m = matrix3x3.asInvertible(matrix3x3.make(1, 2, 3, 0, 1, 4, 5, 6, 0))
    const result = matrix3x3.inverse(m)
    expectTypeOf(result).toEqualTypeOf<Solution.One<matrix3x3.Matrix3x3<unknown & Invertible>>>()
    expect(matrix3x3.multiply(m, result.value)).toBeCloseToValue(matrix3x3.identity)
  })
  test('inverse on plain Matrix3x3 returns Solution.AtMostOne', () => {
    const m = matrix3x3.make(1, 2, 3, 0, 1, 4, 5, 6, 0)
    const result = matrix3x3.inverse(m)
    expectTypeOf(result).toEqualTypeOf<Solution.AtMostOne<matrix3x3.Matrix3x3<unknown>>>()
    expect(Solution.isSome(result)).toBe(true)
  })
  test('inverse returns Solution.none for a singular matrix', () => {
    const result = matrix3x3.inverse(matrix3x3.make(1, 2, 3, 4, 5, 6, 7, 8, 9))
    expect(Solution.isNone(result)).toBe(true)
  })
  test('inverseUnsafe throws on a singular matrix', () => {
    expect(() => matrix3x3.inverseUnsafe(matrix3x3.make(1, 2, 3, 4, 5, 6, 7, 8, 9))).toThrow(
      /singular/,
    )
  })
})

describe('Matrix4x4 Invertible trait', () => {
  const m = matrix4x4.make(1, 0, 0, 0, -3, 3, 0, 0, 3, -6, 3, 0, -1, 3, -3, 1)
  const singular = matrix4x4.make(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)

  test('isInvertible narrows a non-singular matrix to Invertible', () => {
    expect(matrix4x4.isInvertible(m)).toBe(true)
    if (matrix4x4.isInvertible(m)) {
      expectTypeOf(m).toEqualTypeOf<matrix4x4.Matrix4x4<unknown & Invertible>>()
    }
  })
  test('isInvertible returns false for a singular matrix', () => {
    expect(matrix4x4.isInvertible(singular)).toBe(false)
  })
  test('singularity threshold is relative to the matrix scale', () => {
    // A uniform small scale is perfectly conditioned despite its tiny
    // determinant — see the Matrix3x3 counterpart.
    const scaled = matrix4x4.make(1e-8, 0, 0, 0, 0, 1e-8, 0, 0, 0, 0, 1e-8, 0, 0, 0, 0, 1)
    expect(matrix4x4.isInvertible(scaled)).toBe(true)
  })
  test('asInvertible throws on a singular matrix', () => {
    expect(() => matrix4x4.asInvertible(singular)).toThrow(/not invertible/)
  })
  test('inverse on Invertible returns Solution.One', () => {
    const invertible = matrix4x4.asInvertible(m)
    const result = matrix4x4.inverse(invertible)
    expectTypeOf(result).toEqualTypeOf<Solution.One<matrix4x4.Matrix4x4<unknown & Invertible>>>()
    expect(matrix4x4.multiply(invertible, result.value)).toBeCloseToValue(matrix4x4.identity)
  })
  test('inverse returns Solution.none for a singular matrix', () => {
    expect(Solution.isNone(matrix4x4.inverse(singular))).toBe(true)
  })
  test('inverseUnsafe throws on a singular matrix', () => {
    expect(() => matrix4x4.inverseUnsafe(singular)).toThrow(/singular/)
  })
})

describe('Affine2d Invertible trait', () => {
  test('isInvertible narrows a non-singular transform to Invertible', () => {
    const a = Affine2d.identity.pipe(Affine2d.andThen(Affine2d.scale(2, 3)))
    expect(Affine2d.isInvertible(a)).toBe(true)
    if (Affine2d.isInvertible(a)) {
      expectTypeOf(a).toEqualTypeOf<Affine2d.Affine2d<unknown & Invertible>>()
    }
  })
  test('isInvertible returns false for a zero-scale transform', () => {
    expect(Affine2d.isInvertible(Affine2d.scale(0, 1))).toBe(false)
    expect(Affine2d.isInvertible(Affine2d.scale(1, 0))).toBe(false)
  })
  test('asInvertible throws on a singular transform', () => {
    expect(() => Affine2d.asInvertible(Affine2d.scale(0, 1))).toThrow(/not invertible/)
  })
  test('inverse on Invertible returns Solution.One', () => {
    const a = Affine2d.asInvertible(Affine2d.scale(2, 3))
    const result = Affine2d.inverse(a)
    expectTypeOf(result).toEqualTypeOf<Solution.One<Affine2d.Affine2d<unknown & Invertible>>>()
    const p = vector2.make(7, 11)
    expect(Affine2d.apply(result.value, Affine2d.apply(a, p))).toBeCloseToValue(p)
  })
  test('inverse returns Solution.none for a singular transform', () => {
    expect(Solution.isNone(Affine2d.inverse(Affine2d.scale(0, 1)))).toBe(true)
  })
  test('inverseUnsafe throws on a singular transform', () => {
    expect(() => Affine2d.inverseUnsafe(Affine2d.scale(0, 1))).toThrow(/singular/)
  })
})
