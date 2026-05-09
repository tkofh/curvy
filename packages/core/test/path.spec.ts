import { describe, expect, test } from 'vitest'
import * as cubicCurve2d from '../src/curve/cubic2d'
import * as linearCurve2d from '../src/curve/linear2d'
import * as quadraticCurve2d from '../src/curve/quadratic2d'
import * as interval from '../src/interval'
import * as cubicPath2d from '../src/path/cubic2d'
import * as linearPath2d from '../src/path/linear2d'
import * as quadraticPath2d from '../src/path/quadratic2d'
import * as cubicPolynomial from '../src/polynomial/cubic'
import * as linearPolynomial from '../src/polynomial/linear'
import * as quadraticPolynomial from '../src/polynomial/quadratic'
import * as Bezier2d from '../src/splines/bezier2d'
import * as vector2 from '../src/vector/vector2'

describe('linear2d', () => {
  test('fromCurves', () => {
    expect(
      linearPath2d.fromCurves(
        linearCurve2d.fromPolynomials(linearPolynomial.make(0, 1), linearPolynomial.make(1, 0)),
        linearCurve2d.fromPolynomials(linearPolynomial.make(1, 1), linearPolynomial.make(1, -1)),
      ),
    ).toBeDefined()
  })
  test('fromCurveArray', () => {
    expect(
      linearPath2d.fromCurveArray([
        linearCurve2d.fromPolynomials(linearPolynomial.make(0, 1), linearPolynomial.make(1, 0)),
        linearCurve2d.fromPolynomials(linearPolynomial.make(1, 1), linearPolynomial.make(1, -1)),
      ]),
    ).toBeDefined()
  })
  test('isLinear2dPath', () => {
    expect(
      linearPath2d.isLinearPath2d(
        linearPath2d.fromCurves(
          linearCurve2d.fromPolynomials(linearPolynomial.make(0, 1), linearPolynomial.make(1, 0)),
          linearCurve2d.fromPolynomials(linearPolynomial.make(1, 1), linearPolynomial.make(1, -1)),
        ),
      ),
    ).toBe(true)
  })
  test('append', () => {
    const c0 = linearCurve2d.fromPolynomials(
      linearPolynomial.make(0, 1),
      linearPolynomial.make(1, 0),
    )
    const c1 = linearCurve2d.fromPolynomials(
      linearPolynomial.make(1, 1),
      linearPolynomial.make(1, -1),
    )
    const p0 = linearPath2d.fromCurves(c0)

    const p1Curves = [...p0]

    expect(p1Curves).toEqual([c0])

    const p1 = linearPath2d.append(p0, c1)

    const p2Curves = [...p1]

    expect(p2Curves).toEqual([c0, c1])
  })
  test('solve', () => {
    const p = linearPath2d.fromCurves(
      linearCurve2d.fromPolynomials(linearPolynomial.make(0, 1), linearPolynomial.make(1, 0)),
      linearCurve2d.fromPolynomials(linearPolynomial.make(1, 1), linearPolynomial.make(1, -1)),
    )

    expect(linearPath2d.solve(p, 0)).toEqual(vector2.make(0, 1))
    expect(linearPath2d.solve(p, 0.5)).toEqual(vector2.make(1, 1))
    expect(linearPath2d.solve(p, 1)).toEqual(vector2.make(2, 0))
  })
  test('length', () => {
    expect(
      linearPath2d.length(
        linearPath2d.fromCurves(
          linearCurve2d.fromPolynomials(linearPolynomial.make(0, 1), linearPolynomial.make(1, 0)),
          linearCurve2d.fromPolynomials(linearPolynomial.make(1, 1), linearPolynomial.make(1, -1)),
        ),
      ),
    ).toBeCloseTo(1 + Math.sqrt(2), 10)
  })
})

describe('quadratic2d', () => {
  test('fromCurves', () => {
    expect(
      quadraticPath2d.fromCurves(
        quadraticCurve2d.fromPolynomials(
          quadraticPolynomial.make(0, 0, 1),
          quadraticPolynomial.make(0, 0, 1),
        ),
        quadraticCurve2d.fromPolynomials(
          quadraticPolynomial.make(0, 0, 1),
          quadraticPolynomial.make(0, 0, 1),
        ),
      ),
    ).toBeDefined()
  })
  test('fromCurveArray', () => {
    expect(
      quadraticPath2d.fromCurveArray([
        quadraticCurve2d.fromPolynomials(
          quadraticPolynomial.make(0, 0, 1),
          quadraticPolynomial.make(0, 0, 1),
        ),
        quadraticCurve2d.fromPolynomials(
          quadraticPolynomial.make(0, 0, 1),
          quadraticPolynomial.make(0, 0, 1),
        ),
      ]),
    ).toBeDefined()
  })
  test('isQuadratic2dPath', () => {
    expect(
      quadraticPath2d.isQuadraticPath2d(
        quadraticPath2d.fromCurves(
          quadraticCurve2d.fromPolynomials(
            quadraticPolynomial.make(0, 0, 1),
            quadraticPolynomial.make(0, 0, 1),
          ),
          quadraticCurve2d.fromPolynomials(
            quadraticPolynomial.make(0, 0, 1),
            quadraticPolynomial.make(0, 0, 1),
          ),
        ),
      ),
    ).toBe(true)
  })
  test('append', () => {
    const c0 = quadraticCurve2d.fromPolynomials(
      quadraticPolynomial.make(0, 0, 1),
      quadraticPolynomial.make(0, 0, 1),
    )
    const c1 = quadraticCurve2d.fromPolynomials(
      quadraticPolynomial.make(0, 0, 1),
      quadraticPolynomial.make(0, 0, 1),
    )
    const p0 = quadraticPath2d.fromCurves(c0)

    const p1Curves = [...p0]

    expect(p1Curves).toEqual([c0])

    const p1 = quadraticPath2d.append(p0, c1)

    const p2Curves = [...p1]

    expect(p2Curves).toEqual([c0, c1])
  })
  test('solve', () => {
    const p = quadraticPath2d.fromCurves(
      quadraticCurve2d.fromPolynomials(
        quadraticPolynomial.make(0, 0, 1),
        quadraticPolynomial.make(0, 0, 1),
      ),
      quadraticCurve2d.fromPolynomials(
        quadraticPolynomial.make(1, 0, 1),
        quadraticPolynomial.make(1, 0, 1),
      ),
    )

    expect(quadraticPath2d.solve(p, 0)).toEqual(vector2.make(0, 0))
    expect(quadraticPath2d.solve(p, 0.5)).toEqual(vector2.make(1, 1))
    expect(quadraticPath2d.solve(p, 1)).toEqual(vector2.make(2, 2))
  })
})

describe('cubic2d', () => {
  test('fromCurves', () => {
    expect(
      cubicPath2d.fromCurves(
        cubicCurve2d.fromPolynomials(
          cubicPolynomial.make(0, 0, 0, 1),
          cubicPolynomial.make(0, 0, 0, 1),
        ),
        cubicCurve2d.fromPolynomials(
          cubicPolynomial.make(0, 0, 0, 1),
          cubicPolynomial.make(0, 0, 0, 1),
        ),
      ),
    ).toBeDefined()
  })
  test('fromCurveArray', () => {
    expect(
      cubicPath2d.fromCurveArray([
        cubicCurve2d.fromPolynomials(
          cubicPolynomial.make(0, 0, 0, 1),
          cubicPolynomial.make(0, 0, 0, 1),
        ),
        cubicCurve2d.fromPolynomials(
          cubicPolynomial.make(0, 0, 0, 1),
          cubicPolynomial.make(0, 0, 0, 1),
        ),
      ]),
    ).toBeDefined()
  })
  test('isCubic2dPath', () => {
    expect(
      cubicPath2d.isCubicPath2d(
        cubicPath2d.fromCurves(
          cubicCurve2d.fromPolynomials(
            cubicPolynomial.make(0, 0, 0, 1),
            cubicPolynomial.make(0, 0, 0, 1),
          ),
          cubicCurve2d.fromPolynomials(
            cubicPolynomial.make(0, 0, 0, 1),
            cubicPolynomial.make(0, 0, 0, 1),
          ),
        ),
      ),
    ).toBe(true)
  })
  test('append', () => {
    const c0 = cubicCurve2d.fromPolynomials(
      cubicPolynomial.make(0, 0, 0, 1),
      cubicPolynomial.make(0, 0, 0, 1),
    )
    const c1 = cubicCurve2d.fromPolynomials(
      cubicPolynomial.make(0, 0, 0, 1),
      cubicPolynomial.make(0, 0, 0, 1),
    )
    const p0 = cubicPath2d.fromCurves(c0)

    const p1Curves = [...p0]

    expect(p1Curves).toEqual([c0])

    const p1 = cubicPath2d.append(p0, c1)

    const p2Curves = [...p1]

    expect(p2Curves).toEqual([c0, c1])
  })
  test('solve', () => {
    const p = cubicPath2d.fromCurves(
      cubicCurve2d.fromPolynomials(
        cubicPolynomial.make(0, 0, 0, 1),
        cubicPolynomial.make(0, 0, 0, 1),
      ),
      cubicCurve2d.fromPolynomials(
        cubicPolynomial.make(1, 0, 0, 1),
        cubicPolynomial.make(1, 0, 0, 1),
      ),
    )

    expect(cubicPath2d.solve(p, 0)).toEqual(vector2.make(0, 0))
    expect(cubicPath2d.solve(p, 0.5)).toEqual(vector2.make(1, 1))
    expect(cubicPath2d.solve(p, 1)).toEqual(vector2.make(2, 2))
  })
  test('solveByDistance endpoints', () => {
    const p = Bezier2d.toPath(
      Bezier2d.make(
        vector2.make(0, 0),
        vector2.make(0.5, 0),
        vector2.make(1.5, 0),
        vector2.make(2, 0),
      ),
    )
    expect(cubicPath2d.solveByDistance(p, 0)).toBeCloseToValue(vector2.make(0, 0))
    expect(cubicPath2d.solveByDistance(p, 1)).toBeCloseToValue(vector2.make(2, 0))
  })
  test('solveByDistance straight line midpoint', () => {
    // straight line with evenly spaced bezier controls — t and arc length match
    const p = Bezier2d.toPath(
      Bezier2d.make(vector2.make(0, 0), vector2.make(1, 0), vector2.make(3, 0), vector2.make(4, 0)),
    )
    expect(cubicPath2d.solveByDistance(p, 0.5)).toBeCloseToValue(vector2.make(2, 0), 1e-6)
  })
  test('solveByDistance arc-length matches target', () => {
    // non-uniform parameterization: control points clustered toward middle.
    // Verifies the round-trip property: arc length from start to the point
    // returned by solveByDistance(s) ≈ s * totalLength.
    const p = Bezier2d.toPath(
      Bezier2d.make(
        vector2.make(0, 0),
        vector2.make(0.1, 1),
        vector2.make(0.9, 1),
        vector2.make(1, 0),
      ),
    )
    const total = cubicPath2d.length(p)
    for (const s of [0.1, 0.25, 0.5, 0.75, 0.9]) {
      const point = cubicPath2d.solveByDistance(p, s)
      // recover the parameter u that produced this point by linear search
      let bestU = 0
      let bestDist = Number.POSITIVE_INFINITY
      for (let i = 0; i <= 2000; i++) {
        const u = i / 2000
        const sample = cubicPath2d.solve(p, u)
        const dist = Math.hypot(sample.x - point.x, sample.y - point.y)
        if (dist < bestDist) {
          bestDist = dist
          bestU = u
        }
      }
      const [curve] = [...p]
      const arcAtBestU = cubicCurve2d.length(
        curve as cubicCurve2d.CubicCurve2d,
        interval.make(0, bestU),
      )
      expect(arcAtBestU).toBeCloseTo(s * total, 2)
    }
  })
  test('solveByDistance multi-segment lands at symmetric midpoint', () => {
    // A two-segment path symmetric about (1, 0). The arc-length midpoint
    // should land exactly at the segment join.
    const p = Bezier2d.make(
      vector2.make(0, 0),
      vector2.make(0, 1),
      vector2.make(1, 1),
      vector2.make(1, 0),
    ).pipe(
      Bezier2d.append(vector2.make(1, -1), vector2.make(2, -1), vector2.make(2, 0)),
      Bezier2d.toPath,
    )
    expect(cubicPath2d.solveByDistance(p, 0.5)).toBeCloseToValue(vector2.make(1, 0), 1e-6)
  })
})
