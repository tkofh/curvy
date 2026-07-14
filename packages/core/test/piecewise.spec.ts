import { describe, expect, expectTypeOf, test } from 'vitest'
import * as cubicCurve2d from '../src/curve/cubic2d.ts'
import * as interval from '../src/interval/interval.ts'
import * as cubicPath2d from '../src/path/cubic2d.ts'
import * as Piecewise from '../src/piecewise/piecewise.ts'
import * as cubicPolynomial from '../src/polynomial/cubic.ts'
import * as linearPolynomial from '../src/polynomial/linear.ts'
import * as Solution from '../src/solution/solution.ts'
import * as Cardinal2d from '../src/splines/cardinal2d.ts'
import * as vector2 from '../src/vector/vector2.ts'

// A cubic piece over [lo, hi] governed by `y(u) = c0 + c1 u + c2 u^2 + c3 u^3`.
const piece = (
  lo: number,
  hi: number,
  c0: number,
  c1: number,
  c2 = 0,
  c3 = 0,
): Piecewise.Piece<cubicPolynomial.CubicPolynomial> => [
  interval.make(lo, hi),
  cubicPolynomial.make(c0, c1, c2, c3),
]

const at = (pp: Piecewise.Piecewise<cubicPolynomial.CubicPolynomial>, x: number) =>
  Solution.valueOrUndefined(Piecewise.solve(pp, x))

describe('Piecewise.make / fromArray', () => {
  test('requires at least one piece', () => {
    expect(() => Piecewise.make()).toThrow()
    expect(() => Piecewise.fromArray([])).toThrow()
  })
  test('rejects overlapping pieces', () => {
    expect(() => Piecewise.make(piece(0, 2, 0, 1), piece(1, 3, 0, 1))).toThrow()
  })
  test('allows a gap between pieces (partial function)', () => {
    const pp = Piecewise.make(piece(0, 1, 0, 1), piece(2, 3, 0, 1))
    expect([...pp].length).toBe(2)
    expect(Piecewise.isContiguous(pp)).toBe(false)
  })
})

describe('Piecewise.solve', () => {
  // A: y = 14 + 4u over [0, 10];  B: y = 18 + 2u^2 over [10, 30].
  const pp = Piecewise.make(piece(0, 10, 14, 4), piece(10, 30, 18, 0, 2))

  test('evaluates the bracketing piece at the local coordinate', () => {
    expect(at(pp, 5)).toBeCloseTo(16) // A, u=0.5 -> 16
    expect(at(pp, 20)).toBeCloseTo(18.5) // B, u=0.5 -> 18 + 2*0.25
  })
  test('endpoints and the shared join', () => {
    expect(at(pp, 0)).toBeCloseTo(14)
    expect(at(pp, 30)).toBeCloseTo(20)
    expect(at(pp, 10)).toBeCloseTo(18) // first bracketing piece: A at u=1
  })
  test('returns none outside the domain', () => {
    expect(Solution.isNone(Piecewise.solve(pp, -1))).toBe(true)
    expect(Solution.isNone(Piecewise.solve(pp, 31))).toBe(true)
  })
  test('returns none inside a gap', () => {
    const gapped = Piecewise.make(piece(0, 1, 0, 1), piece(2, 3, 0, 1))
    expect(Solution.isNone(Piecewise.solve(gapped, 1.5))).toBe(true)
  })
  test('data-last form composes under pipe', () => {
    expect(pp.pipe(Piecewise.solve(20), Solution.valueOrUndefined)).toBeCloseTo(18.5)
  })
  test('solve returns AtMostOne', () => {
    expectTypeOf(Piecewise.solve(pp, 5)).toEqualTypeOf<Solution.AtMostOne<number>>()
  })
})

describe('Piecewise.domain / boundingBox', () => {
  test('domain spans first start to last end', () => {
    const pp = Piecewise.make(piece(0, 10, 0, 1), piece(10, 30, 1, 1))
    expect(interval.aligned(Piecewise.domain(pp), interval.make(0, 30))).toBe(true)
  })
  test('boundingBox includes interior extrema', () => {
    // y = 4u - 4u^2 = 4u(1 - u): endpoints 0, interior max 1 at u = 0.5.
    const pp = Piecewise.make(piece(0, 1, 0, 4, -4))
    expect(interval.aligned(Piecewise.boundingBox(pp), interval.make(0, 1))).toBe(true)
  })
})

describe('Piecewise trait refiners', () => {
  test('isContiguous: tiled true, gapped false', () => {
    expect(Piecewise.isContiguous(Piecewise.make(piece(0, 1, 0, 1), piece(1, 2, 1, 1)))).toBe(true)
    expect(Piecewise.isContiguous(Piecewise.make(piece(0, 1, 0, 1), piece(2, 3, 0, 1)))).toBe(false)
  })
  test('isContinuous: matching join true, jump false', () => {
    // p0 ends at 1 (u=1 -> 0+1), p1 starts at 1 (u=0 -> 1): continuous.
    expect(Piecewise.isContinuous(Piecewise.make(piece(0, 1, 0, 1), piece(1, 2, 1, 1)))).toBe(true)
    // p1 starts at 5: contiguous in x, but a value jump.
    const jump = Piecewise.make(piece(0, 1, 0, 1), piece(1, 2, 5, 1))
    expect(Piecewise.isContiguous(jump)).toBe(true)
    expect(Piecewise.isContinuous(jump)).toBe(false)
    expect(() => Piecewise.asContinuous(jump)).toThrow()
  })
  test('isMonotonic: increasing chain true, up-then-down false', () => {
    const rising = Piecewise.make(piece(0, 1, 0, 1), piece(1, 2, 1, 1))
    expect(Piecewise.isMonotonic(rising)).toBe(true)
    // single piece that rises then falls.
    const hump = Piecewise.make(piece(0, 1, 0, 4, -4))
    expect(Piecewise.isMonotonic(hump)).toBe(false)
    expect(() => Piecewise.asMonotonic(hump)).toThrow()
  })
  test('a decreasing chain is monotonic too', () => {
    const falling = Piecewise.make(piece(0, 1, 2, -1), piece(1, 2, 1, -1))
    expect(Piecewise.isMonotonic(falling)).toBe(true)
  })
})

describe('Piecewise.append / mapPolynomials', () => {
  test('append extends the domain', () => {
    const pp = Piecewise.make(piece(0, 1, 0, 1)).pipe(Piecewise.append(piece(1, 2, 1, 1)))
    expect([...pp].length).toBe(2)
    expect(at(pp, 1.5)).toBeCloseTo(1.5)
  })
  test('mapPolynomials transforms values, keeps intervals', () => {
    const pp = Piecewise.make(piece(0, 2, 3, 0)).pipe(
      Piecewise.mapPolynomials((p) => cubicPolynomial.make(p.c0 + 10, p.c1, p.c2, p.c3)),
    )
    expect(at(pp, 1)).toBeCloseTo(13)
    expect(interval.aligned(Piecewise.domain(pp), interval.make(0, 2))).toBe(true)
  })
})

describe('Piecewise trait-preserving append', () => {
  const contiguous = Piecewise.asContiguous(Piecewise.make(piece(0, 1, 0, 1)))
  // y(u) = u, so the last piece ends at 1.
  const continuous = Piecewise.asContinuous(Piecewise.make(piece(0, 1, 0, 1)))

  test('appendContiguous keeps the brand on a gapless join', () => {
    const pp = Piecewise.appendContiguous(contiguous, piece(1, 2, 5, 1))
    expect([...pp].length).toBe(2)
    expectTypeOf(pp).toEqualTypeOf<
      Piecewise.Piecewise<cubicPolynomial.CubicPolynomial, Piecewise.Contiguous>
    >()
  })
  test('appendContiguous throws on a gap', () => {
    expect(() => Piecewise.appendContiguous(contiguous, piece(2, 3, 0, 1))).toThrow()
  })
  test('appendContinuous keeps the brand when the value agrees at the join', () => {
    const pp = Piecewise.appendContinuous(continuous, piece(1, 2, 1, 1)) // starts at 1
    expect(Piecewise.isContinuous(pp)).toBe(true)
    expectTypeOf(pp).toEqualTypeOf<
      Piecewise.Piecewise<cubicPolynomial.CubicPolynomial, Piecewise.Continuous>
    >()
  })
  test('appendContinuous throws on a value jump', () => {
    expect(() => Piecewise.appendContinuous(continuous, piece(1, 2, 5, 1))).toThrow()
  })
  test('data-last form composes under pipe', () => {
    const pp = continuous.pipe(Piecewise.appendContinuous(piece(1, 2, 1, 1)))
    expect([...pp].length).toBe(2)
  })
})

describe('Piecewise is generic over polynomial degree', () => {
  test('linear pieces evaluate through the linear ops', () => {
    const pp = Piecewise.make<linearPolynomial.LinearPolynomial>([
      interval.make(0, 4),
      linearPolynomial.make(1, 2), // y = 1 + 2u
    ])
    expect(Solution.valueOrUndefined(Piecewise.solve(pp, 2))).toBeCloseTo(2) // u=0.5 -> 2
  })
})

describe('Piecewise.fromPath', () => {
  test('affine-x source is transcribed exactly, one piece per segment', () => {
    const segA = cubicCurve2d.fromCoefficients(
      vector2.make(0, 0),
      vector2.make(2, 1),
      vector2.make(0, 3),
      vector2.make(0, -1),
    )
    const segB = cubicCurve2d.fromCoefficients(
      vector2.make(2, 3),
      vector2.make(2, 2),
      vector2.make(0, -1),
      vector2.make(0, 0.5),
    )
    const path = cubicPath2d.make(segA, segB).pipe(cubicPath2d.asIncreasingX)
    const pp = Piecewise.fromPath(path)

    expect([...pp].length).toBe(2) // no subdivision
    for (const x of [0.3, 1.0, 1.7, 2.4, 3.1, 3.9]) {
      const exact = Solution.valueOrUndefined(cubicPath2d.solveAtX(path, x))
      expect(at(pp, x)).toBeCloseTo(exact as number, 10)
    }
  })

  test('refits a centripetal cardinal curve within tolerance', () => {
    // The uneven-knot case the source problem measures at 30% off with one cell.
    const path = Cardinal2d.fromTuples([
      [320, 14],
      [400, 18],
      [1280, 20],
    ]).pipe(Cardinal2d.withInterpolatedEndpoints, Cardinal2d.toPath, cubicPath2d.asIncreasingX)

    const pp = Piecewise.fromPath(path, { tolerance: 1e-5 })

    const yScale = interval.size(cubicPath2d.boundingBox(path).y)
    let maxDev = 0
    for (let i = 0; i <= 400; i++) {
      const x = 320 + (1280 - 320) * (i / 400)
      const exact = Solution.valueOrUndefined(cubicPath2d.solveAtX(path, x))
      const fit = Solution.valueOrUndefined(Piecewise.solve(pp, x))
      if (exact !== undefined && fit !== undefined) {
        maxDev = Math.max(maxDev, Math.abs(fit - exact))
      }
    }
    expect(maxDev / yScale).toBeLessThan(1e-3)
    expect(Piecewise.isContiguous(pp)).toBe(true)
    expect(Piecewise.isContinuous(pp)).toBe(true)
  })

  test('a looser tolerance yields fewer pieces', () => {
    const path = Cardinal2d.fromTuples([
      [320, 14],
      [400, 18],
      [1280, 20],
    ]).pipe(Cardinal2d.withInterpolatedEndpoints, Cardinal2d.toPath, cubicPath2d.asIncreasingX)

    const coarse = [...Piecewise.fromPath(path, { tolerance: 1e-2 })].length
    const fine = [...Piecewise.fromPath(path, { tolerance: 1e-5 })].length
    expect(coarse).toBeLessThan(fine)
  })
})
