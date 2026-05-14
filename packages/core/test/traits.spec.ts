import { describe, expect, expectTypeOf, test } from 'vitest'
import * as cubicCurve2d from '../src/curve/cubic2d.ts'
import * as linearCurve2d from '../src/curve/linear2d.ts'
import * as quadraticCurve2d from '../src/curve/quadratic2d.ts'
import * as interval from '../src/interval/interval.ts'
import * as cubicPath2d from '../src/path/cubic2d.ts'
import * as linearPath2d from '../src/path/linear2d.ts'
import * as quadraticPath2d from '../src/path/quadratic2d.ts'
import * as cubic from '../src/polynomial/cubic.ts'
import * as linear from '../src/polynomial/linear.ts'
import * as quadratic from '../src/polynomial/quadratic.ts'
import type { Decreasing, Increasing, Monotonic } from '../src/polynomial/traits.ts'
import * as Bezier2d from '../src/splines/bezier2d.ts'
import type * as Solution from '../src/solution/solution.ts'
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
    const c = linearCurve2d.fromBezierPoints(vector2.make(0, 0), vector2.make(2, 3))
    expect(linearCurve2d.isMonotonic(c)).toBe(true)
    if (linearCurve2d.isMonotonic(c)) {
      expectTypeOf(c).toEqualTypeOf<
        linearCurve2d.LinearCurve2d<unknown & Monotonic, unknown & Monotonic>
      >()
    }
  })
  test('isMonotonic returns false when one axis is constant', () => {
    // y axis constant — curve is monotonic in x but not in y
    const c = linearCurve2d.fromBezierPoints(vector2.make(0, 5), vector2.make(2, 5))
    expect(linearCurve2d.isMonotonic(c)).toBe(false)
  })
  test('combined isIncreasing narrows both axes', () => {
    const c = linearCurve2d.fromBezierPoints(vector2.make(0, 0), vector2.make(2, 3))
    expect(linearCurve2d.isIncreasing(c)).toBe(true)
    if (linearCurve2d.isIncreasing(c)) {
      expectTypeOf(c).toEqualTypeOf<
        linearCurve2d.LinearCurve2d<unknown & Increasing, unknown & Increasing>
      >()
    }
  })
  test('asMonotonic throws when one axis is constant', () => {
    const c = linearCurve2d.fromBezierPoints(vector2.make(0, 5), vector2.make(2, 5))
    expect(() => linearCurve2d.asMonotonic(c)).toThrow(/not monotonic in both axes/)
  })
  test('per-axis check is via the polynomial directly', () => {
    // documents the recommended path for one-axis checks
    const c = linearCurve2d.fromBezierPoints(vector2.make(0, 5), vector2.make(2, 5))
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
  test('linear path Continuous refiner', () => {
    const c0 = linearCurve2d.fromBezierPoints(vector2.make(0, 0), vector2.make(1, 1))
    const c1 = linearCurve2d.fromBezierPoints(vector2.make(1, 1), vector2.make(2, 0))
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
