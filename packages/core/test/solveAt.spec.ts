import { describe, expect, expectTypeOf, test } from 'vitest'
import * as cubicCurve2d from '../src/curve/cubic2d.ts'
import * as linearCurve2d from '../src/curve/linear2d.ts'
import * as quadraticCurve2d from '../src/curve/quadratic2d.ts'
import * as cubicPath2d from '../src/path/cubic2d.ts'
import * as linearPath2d from '../src/path/linear2d.ts'
import * as quadraticPath2d from '../src/path/quadratic2d.ts'
import * as cubicPolynomial from '../src/polynomial/cubic.ts'
import * as quadraticPolynomial from '../src/polynomial/quadratic.ts'
import * as Solution from '../src/solution/solution.ts'
import * as vector2 from '../src/vector/vector2.ts'

describe('LinearCurve2d.solveAtX/solveAtY', () => {
  test('on a line within the [0, 1] parameter domain', () => {
    // x(t) = t, y(t) = 1 + 2t — so y = 2x + 1 for x ∈ [0, 1]
    const c = linearCurve2d.fromCoefficients(vector2.make(0, 1), vector2.make(1, 2))
    expect([...linearCurve2d.solveAtX(c, 0.5)]).toEqual([2])
    expect([...linearCurve2d.solveAtY(c, 2)]).toEqual([0.5])
  })
  test('returns empty solution when query is outside the parameter domain', () => {
    // line from (0, 1) to (1, 3) — t ∈ [0, 1] gives x ∈ [0, 1]
    const c = linearCurve2d.fromCoefficients(vector2.make(0, 1), vector2.make(1, 2))
    expect(Solution.isNone(linearCurve2d.solveAtX(c, 3))).toBe(true) // x=3 → t=3, outside [0, 1]
    expect(Solution.isNone(linearCurve2d.solveAtX(c, -1))).toBe(true)
  })
  test('returns empty solution when the queried axis is constant', () => {
    // x = 5 (constant), y = t — solveAtX is undefined
    const c = linearCurve2d.fromCoefficients(vector2.make(5, 0), vector2.make(0, 1))
    expect(Solution.isNone(linearCurve2d.solveAtX(c, 5))).toBe(true)
    expect(Solution.isNone(linearCurve2d.solveAtX(c, 1))).toBe(true)
  })
  test('linear solveAtX/solveAtY return AtMostOne regardless of trait', () => {
    const c = linearCurve2d.fromCoefficients(vector2.make(0, 1), vector2.make(1, 2))
    const plain = linearCurve2d.solveAtX(c, 0.5)
    expectTypeOf(plain).toEqualTypeOf<Solution.AtMostOne<number>>()
  })
  test('curried form works', () => {
    const c = linearCurve2d.fromCoefficients(vector2.make(0, 1), vector2.make(1, 2))
    expect([...linearCurve2d.solveAtX(0.5)(c)]).toEqual([2])
    expect([...linearCurve2d.solveAtY(2)(c)]).toEqual([0.5])
  })
})

describe('QuadraticCurve2d.solveAtX/solveAtY', () => {
  test('parabola x=t, y=t² over [0, 1]: solveAtY filters to in-domain t', () => {
    // y = 0.25 has roots t = ±0.5; only t = 0.5 is in [0, 1]
    const c = quadraticCurve2d.fromPolynomials(
      quadraticPolynomial.make(0, 1, 0),
      quadraticPolynomial.make(0, 0, 1),
    )
    const xs = quadraticCurve2d.solveAtY(c, 0.25)
    expect([...xs]).toEqual([0.5])
  })
  test('parabola x=t, y=t²: solveAtX(0.5) returns y at t=0.5', () => {
    const c = quadraticCurve2d.fromPolynomials(
      quadraticPolynomial.make(0, 1, 0),
      quadraticPolynomial.make(0, 0, 1),
    )
    expect([...quadraticCurve2d.solveAtX(c, 0.5)]).toEqual([0.25])
  })
  test('returns empty solution when no solution exists in [0, 1]', () => {
    // y = x² has no real solution for y < 0
    const c = quadraticCurve2d.fromPolynomials(
      quadraticPolynomial.make(0, 1, 0),
      quadraticPolynomial.make(0, 0, 1),
    )
    expect(Solution.isNone(quadraticCurve2d.solveAtY(c, -1))).toBe(true)
  })
  test('non-monotonic-y curve can have two solveAtY solutions in [0, 1]', () => {
    // y(t) = -4(t-0.5)² + 1 — peak at t=0.5 (y=1), endpoints y=0
    // expanded: y = -4t² + 4t = 0t⁰ + 4t - 4t²
    // x = t for simplicity
    const c = quadraticCurve2d.fromPolynomials(
      quadraticPolynomial.make(0, 1, 0),
      quadraticPolynomial.make(0, 4, -4),
    )
    const xs = quadraticCurve2d.solveAtY(c, 0.75)
    // y = 0.75 at t = 0.25 and t = 0.75, both in [0, 1]
    expect(xs).toHaveLength(2)
    const xsArr = [...xs]
    expect(xsArr[0]).toBeCloseTo(0.25, 10)
    expect(xsArr[1]).toBeCloseTo(0.75, 10)
  })
  test('Monotonic narrowing tightens to ZeroToOne', () => {
    const c = quadraticCurve2d.fromPolynomials(
      quadraticPolynomial.make(0, 1, 0),
      quadraticPolynomial.make(0, 0, 1),
    )
    const plain = quadraticCurve2d.solveAtY(c, 0.25)
    expectTypeOf(plain).toEqualTypeOf<Solution.AtMostTwo<number>>()
    // x polynomial monotonic (c2=0), so solveAtX is at most one
    if (quadraticCurve2d.isMonotonic(c)) {
      const tight = quadraticCurve2d.solveAtX(c, 0.5)
      expectTypeOf(tight).toEqualTypeOf<Solution.AtMostOne<number>>()
    }
  })
})

describe('CubicCurve2d.solveAtX/solveAtY', () => {
  test('non-monotonic cubic can have multiple solveAtY solutions in [0, 1]', () => {
    // x(t) = t, y(t) = t³ - t — roots at t = -1, 0, 1
    // Only t = 0 and t = 1 are in the curve's parameter domain [0, 1].
    const c = cubicCurve2d.fromPolynomials(
      cubicPolynomial.make(0, 1, 0, 0),
      cubicPolynomial.make(0, -1, 0, 1),
    )
    const xs = cubicCurve2d.solveAtY(c, 0)
    expect(xs).toHaveLength(2)
    const xsArr = [...xs]
    expect(xsArr[0]).toBeCloseTo(0, 6)
    expect(xsArr[1]).toBeCloseTo(1, 6)
  })
  test('monotonic cubic has at most one solveAtY solution', () => {
    // y = x³ + x is monotonic everywhere — for any y there is exactly one x
    const c = cubicCurve2d.fromPolynomials(
      cubicPolynomial.make(0, 1, 0, 0),
      cubicPolynomial.make(0, 1, 0, 1),
    )
    const xs = cubicCurve2d.solveAtY(c, 2)
    // y = x³ + x = 2 → x = 1 (only real root)
    expect(xs).toHaveLength(1)
    expect([...xs][0]).toBeCloseTo(1, 10)
  })
  test('solveAtX on a typical Bézier curve', () => {
    // a bezier from (0,0) to (1,1) with non-trivial controls
    const c = cubicCurve2d.fromBezierPoints(
      vector2.make(0, 0),
      vector2.make(0.5, 0),
      vector2.make(0.5, 1),
      vector2.make(1, 1),
    )
    // x at the curve's start and end
    const ysAtStart = cubicCurve2d.solveAtX(c, 0)
    expect([...ysAtStart]).toEqual([0])
    const ysAtEnd = cubicCurve2d.solveAtX(c, 1)
    expect([...ysAtEnd][0]).toBeCloseTo(1, 10)
  })
  test('Monotonic narrowing tightens to ZeroToOne', () => {
    // x = t (monotonic), y = t³ + t (also monotonic — chosen so we can use asMonotonic)
    const c = cubicCurve2d.fromPolynomials(
      cubicPolynomial.make(0, 1, 0, 0),
      cubicPolynomial.make(0, 1, 0, 1),
    )
    const plain = cubicCurve2d.solveAtY(c, 2)
    expectTypeOf(plain).toEqualTypeOf<Solution.AtMostThree<number>>()
    if (cubicCurve2d.isMonotonic(c)) {
      const tight = cubicCurve2d.solveAtY(c, 2)
      expectTypeOf(tight).toEqualTypeOf<Solution.AtMostOne<number>>()
    }
  })
  test('result order matches t-ascending', () => {
    // x(t) = t, y(t) = (t - 0.3)·(t - 0.7)·t · 4 — three roots within [0, 1]
    // expanded: y = 4t³ - 4t² + 0.84t  (rough approximation)
    // Easier: pick a cubic where y(t) = (t-0.2)(t-0.5)(t-0.8) — roots in t-order
    // Since x = t monotonically, x values should equal the roots in their t-order.
    // (t-0.2)(t-0.5)(t-0.8) expanded:
    //   (t-0.2)(t-0.5) = t² - 0.7t + 0.1
    //   * (t-0.8): t³ - 0.8t² - 0.7t² + 0.56t + 0.1t - 0.08 = t³ - 1.5t² + 0.66t - 0.08
    const c = cubicCurve2d.fromPolynomials(
      cubicPolynomial.make(0, 1, 0, 0),
      cubicPolynomial.make(-0.08, 0.66, -1.5, 1),
    )
    const xs = cubicCurve2d.solveAtY(c, 0)
    expect(xs).toHaveLength(3)
    const xsArr = [...xs]
    expect(xsArr[0]).toBeCloseTo(0.2, 10)
    expect(xsArr[1]).toBeCloseTo(0.5, 10)
    expect(xsArr[2]).toBeCloseTo(0.8, 10)
  })
})

describe('Path solveAtX / solveAtY (Monotonic-axis required)', () => {
  test('LinearPath: solveAtX picks the segment whose x-range contains the query', () => {
    const p = linearPath2d.make(
      linearCurve2d.fromEndpoints(vector2.make(0, 0), vector2.make(2, 4)),
      linearCurve2d.fromEndpoints(vector2.make(2, 4), vector2.make(5, 1)),
    )
    if (!linearPath2d.isMonotonicX(p)) {
      throw new Error('expected MonotonicX')
    }
    // x=1 is in the first segment (slope = 2 in y); y(1) = 2
    const ys1 = linearPath2d.solveAtX(p, 1)
    expect(ys1).toHaveLength(1)
    if (Solution.isSome(ys1)) {
      expect(ys1.value).toBeCloseTo(2, 10)
    }
    // x=4 is in the second segment: line from (2,4) to (5,1); y(4) = 2
    const ys2 = linearPath2d.solveAtX(p, 4)
    expect(ys2).toHaveLength(1)
    if (Solution.isSome(ys2)) {
      expect(ys2.value).toBeCloseTo(2, 10)
    }
  })
  test('LinearPath: solveAtX returns None when x is outside the range', () => {
    const p = linearPath2d.asMonotonicX(
      linearPath2d.make(linearCurve2d.fromEndpoints(vector2.make(0, 0), vector2.make(2, 4))),
    )
    expect(Solution.isNone(linearPath2d.solveAtX(p, -1))).toBe(true)
    expect(Solution.isNone(linearPath2d.solveAtX(p, 5))).toBe(true)
  })
  test('LinearPath: solveAtY mirrors solveAtX on the y axis', () => {
    const p = linearPath2d.make(
      linearCurve2d.fromEndpoints(vector2.make(0, 0), vector2.make(3, 1)),
      linearCurve2d.fromEndpoints(vector2.make(3, 1), vector2.make(-2, 4)),
    )
    if (!linearPath2d.isMonotonicY(p)) {
      throw new Error('expected MonotonicY')
    }
    const xs = linearPath2d.solveAtY(p, 2)
    // y=2 is on the second segment ((3,1)→(-2,4)); halfway through y range,
    // so x ≈ 3 + (-2 - 3) * (2 - 1)/(4 - 1) = 3 - 5/3
    expect(xs).toHaveLength(1)
    if (Solution.isSome(xs)) {
      expect(xs.value).toBeCloseTo(3 - 5 / 3, 10)
    }
  })
  test('QuadraticPath: solveAtX on a monotonic-x path round-trips at a known x', () => {
    // c0: x goes 0→2 over [0,1], y is some quadratic
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
    if (!quadraticPath2d.isMonotonicX(p)) {
      throw new Error('expected MonotonicX')
    }
    // verify round-trip: sample the path at u, get (x, y), then solveAtX(x) should return y
    const u = 0.25
    const point = quadraticPath2d.solve(p, u)
    const ys = quadraticPath2d.solveAtX(p, point.x)
    expect(ys).toHaveLength(1)
    if (Solution.isSome(ys)) {
      expect(ys.value).toBeCloseTo(point.y, 6)
    }
  })
  test('CubicPath: solveAtX round-trips on a monotonic-x easing path', () => {
    const c = cubicCurve2d.fromBezierPoints(
      vector2.make(0, 0),
      vector2.make(0.42, 0),
      vector2.make(0.58, 1),
      vector2.make(1, 1),
    )
    const p = cubicPath2d.make(c)
    if (!cubicPath2d.isMonotonicX(p)) {
      throw new Error('expected MonotonicX')
    }
    const x0 = 0.3
    const ys = cubicPath2d.solveAtX(p, x0)
    expect(ys).toHaveLength(1)
  })
  test('solveAtX result narrows to AtMostOne under MonotonicX', () => {
    const p = linearPath2d.asMonotonicX(
      linearPath2d.make(linearCurve2d.fromEndpoints(vector2.make(0, 0), vector2.make(1, 1))),
    )
    const result = linearPath2d.solveAtX(p, 0.5)
    expectTypeOf(result).toEqualTypeOf<Solution.AtMostOne<number>>()
  })
  test('curried form works', () => {
    const p = linearPath2d.asMonotonicX(
      linearPath2d.make(linearCurve2d.fromEndpoints(vector2.make(0, 0), vector2.make(2, 4))),
    )
    expect([...linearPath2d.solveAtX(1)(p)]).toEqual([2])
  })
})

describe('solveAt symmetry: easing curve case', () => {
  test('a function-of-x curve where both axes are monotonic-increasing', () => {
    // an easing curve from (0, 0) to (1, 1) — both x and y monotonic-increasing
    const c = cubicCurve2d.fromBezierPoints(
      vector2.make(0, 0),
      vector2.make(0.42, 0),
      vector2.make(0.58, 1),
      vector2.make(1, 1),
    )
    if (cubicCurve2d.isMonotonic(c)) {
      // round-trip: pick an x, find y, then solveAtY(y) should give back x
      const x0 = 0.5
      const ys = cubicCurve2d.solveAtX(c, x0)
      expect(ys).toHaveLength(1)
      if (Solution.isSome(ys)) {
        const xs = cubicCurve2d.solveAtY(c, ys.value)
        expect(xs).toHaveLength(1)
        if (Solution.isSome(xs)) {
          expect(xs.value).toBeCloseTo(x0, 6)
        }
      }
    } else {
      throw new Error('expected curve to be monotonic')
    }
  })
})
