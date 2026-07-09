import { describe, expect, test } from 'vitest'
import * as cubicCurve2d from '../src/curve/cubic2d.ts'
import * as linearCurve2d from '../src/curve/linear2d.ts'
import * as quadraticCurve2d from '../src/curve/quadratic2d.ts'
import * as rationalCubicCurve2d from '../src/curve/rationalCubic2d.ts'
import * as interval from '../src/interval/interval.ts'
import * as cubicPath2d from '../src/path/cubic2d.ts'
import * as linearPath2d from '../src/path/linear2d.ts'
import * as quadraticPath2d from '../src/path/quadratic2d.ts'
import * as rationalCubicPath2d from '../src/path/rationalCubic2d.ts'
import * as cubicPolynomial from '../src/polynomial/cubic.ts'
import * as linearPolynomial from '../src/polynomial/linear.ts'
import * as quadraticPolynomial from '../src/polynomial/quadratic.ts'
import * as Bezier2d from '../src/splines/bezier2d.ts'
import * as vector2 from '../src/vector/vector2.ts'

describe('linear2d', () => {
  test('make', () => {
    expect(
      linearPath2d.make(
        linearCurve2d.fromPolynomials(linearPolynomial.make(0, 1), linearPolynomial.make(1, 0)),
        linearCurve2d.fromPolynomials(linearPolynomial.make(1, 1), linearPolynomial.make(1, -1)),
      ),
    ).toBeDefined()
  })
  test('fromArray', () => {
    expect(
      linearPath2d.fromArray([
        linearCurve2d.fromPolynomials(linearPolynomial.make(0, 1), linearPolynomial.make(1, 0)),
        linearCurve2d.fromPolynomials(linearPolynomial.make(1, 1), linearPolynomial.make(1, -1)),
      ]),
    ).toBeDefined()
  })
  test('isLinear2dPath', () => {
    expect(
      linearPath2d.isLinearPath2d(
        linearPath2d.make(
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
    const p0 = linearPath2d.make(c0)

    const p1Curves = [...p0]

    expect(p1Curves).toEqual([c0])

    const p1 = linearPath2d.append(p0, c1)

    const p2Curves = [...p1]

    expect(p2Curves).toEqual([c0, c1])
  })
  test('solve', () => {
    const p = linearPath2d.make(
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
        linearPath2d.make(
          linearCurve2d.fromPolynomials(linearPolynomial.make(0, 1), linearPolynomial.make(1, 0)),
          linearCurve2d.fromPolynomials(linearPolynomial.make(1, 1), linearPolynomial.make(1, -1)),
        ),
      ),
    ).toBeCloseTo(1 + Math.sqrt(2), 10)
  })
})

describe('quadratic2d', () => {
  test('make', () => {
    expect(
      quadraticPath2d.make(
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
  test('fromArray', () => {
    expect(
      quadraticPath2d.fromArray([
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
        quadraticPath2d.make(
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
    const p0 = quadraticPath2d.make(c0)

    const p1Curves = [...p0]

    expect(p1Curves).toEqual([c0])

    const p1 = quadraticPath2d.append(p0, c1)

    const p2Curves = [...p1]

    expect(p2Curves).toEqual([c0, c1])
  })
  test('solve', () => {
    const p = quadraticPath2d.make(
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
  test('make', () => {
    expect(
      cubicPath2d.make(
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
  test('fromArray', () => {
    expect(
      cubicPath2d.fromArray([
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
        cubicPath2d.make(
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
    const p0 = cubicPath2d.make(c0)

    const p1Curves = [...p0]

    expect(p1Curves).toEqual([c0])

    const p1 = cubicPath2d.append(p0, c1)

    const p2Curves = [...p1]

    expect(p2Curves).toEqual([c0, c1])
  })
  test('solve', () => {
    const p = cubicPath2d.make(
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
  test('solveByDistance is invariant under uniform scaling of the path', () => {
    // The Newton convergence criterion is relative to the segment length, so
    // a path a billion times smaller resolves distances to the same relative
    // precision — an absolute criterion would exit on the first iterate for
    // tiny paths and burn every iteration on huge ones.
    const shape = (k: number) =>
      Bezier2d.make(
        vector2.make(0, 0),
        vector2.make(0, k),
        vector2.make(k, k),
        vector2.make(2 * k, 0),
      ).pipe(Bezier2d.toPath)

    const unit = shape(1)
    const tiny = shape(1e-9)
    for (const s of [0.25, 0.5, 0.75]) {
      const u = cubicPath2d.solveByDistance(unit, s)
      const t = cubicPath2d.solveByDistance(tiny, s)
      expect(t.x * 1e9).toBeCloseTo(u.x, 9)
      expect(t.y * 1e9).toBeCloseTo(u.y, 9)
    }
  })
  test('toPathData renders a single bezier segment', () => {
    const d = Bezier2d.make(
      vector2.zero,
      vector2.make(1, 0),
      vector2.make(1, 1),
      vector2.make(0, 1),
    ).pipe(Bezier2d.toPath, cubicPath2d.toPathData)
    expect(d).toBe('M 0,0 C 1,0 1,1 0,1')
  })
  test('toPathData stitches continuous segments without re-emitting M', () => {
    const d = Bezier2d.make(
      vector2.zero,
      vector2.make(0, 1),
      vector2.make(1, 1),
      vector2.make(1, 0),
    )
      .pipe(
        Bezier2d.append(vector2.make(1, -1), vector2.make(2, -1), vector2.make(2, 0)),
        Bezier2d.toPath,
      )
      .pipe(cubicPath2d.toPathData)
    expect(d).toBe('M 0,0 C 0,1 1,1 1,0 C 1,-1 2,-1 2,0')
  })
  test('toPathData emits a fresh M for discontinuous segments', () => {
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
    const d = cubicPath2d.make(c0, c1).pipe(cubicPath2d.toPathData)
    expect(d).toBe('M 0,0 C 1,0 1,1 0,1 M 10,10 C 11,10 11,11 10,11')
  })
})

describe('toPathData', () => {
  test('linear path renders M and L commands', () => {
    const d = linearPath2d
      .make(
        linearCurve2d.fromEndpoints(vector2.make(0, 0), vector2.make(1, 1)),
        linearCurve2d.fromEndpoints(vector2.make(1, 1), vector2.make(2, 0)),
      )
      .pipe(linearPath2d.toPathData)
    expect(d).toBe('M 0,0 L 1,1 L 2,0')
  })
  test('linear path emits fresh M on discontinuity', () => {
    const d = linearPath2d
      .make(
        linearCurve2d.fromEndpoints(vector2.make(0, 0), vector2.make(1, 1)),
        linearCurve2d.fromEndpoints(vector2.make(5, 5), vector2.make(6, 6)),
      )
      .pipe(linearPath2d.toPathData)
    expect(d).toBe('M 0,0 L 1,1 M 5,5 L 6,6')
  })
  test('quadratic path renders M and Q commands', () => {
    const d = quadraticPath2d
      .make(
        quadraticCurve2d.fromBezierPoints(
          vector2.make(0, 0),
          vector2.make(1, 1),
          vector2.make(2, 0),
        ),
        quadraticCurve2d.fromBezierPoints(
          vector2.make(2, 0),
          vector2.make(3, -1),
          vector2.make(4, 0),
        ),
      )
      .pipe(quadraticPath2d.toPathData)
    expect(d).toBe('M 0,0 Q 1,1 2,0 Q 3,-1 4,0')
  })
  test('quadratic path emits fresh M on discontinuity', () => {
    const d = quadraticPath2d
      .make(
        quadraticCurve2d.fromBezierPoints(
          vector2.make(0, 0),
          vector2.make(1, 1),
          vector2.make(2, 0),
        ),
        quadraticCurve2d.fromBezierPoints(
          vector2.make(10, 10),
          vector2.make(11, 11),
          vector2.make(12, 10),
        ),
      )
      .pipe(quadraticPath2d.toPathData)
    expect(d).toBe('M 0,0 Q 1,1 2,0 M 10,10 Q 11,11 12,10')
  })
})

describe('rationalCubicPath2d.approximateAsCubicPath', () => {
  test('result segment count equals sum of per-curve approximations', () => {
    const curveA = rationalCubicCurve2d.fromBezierPoints(
      vector2.makeWeighted(0, 0, 1),
      vector2.makeWeighted(1, 2, 5),
      vector2.makeWeighted(2, 2, 5),
      vector2.makeWeighted(3, 0, 1),
    )
    const curveB = rationalCubicCurve2d.fromBezierPoints(
      vector2.makeWeighted(3, 0, 1),
      vector2.makeWeighted(4, -1, 1),
      vector2.makeWeighted(5, -1, 1),
      vector2.makeWeighted(6, 0, 1),
    )
    const path = rationalCubicPath2d.make(curveA, curveB)
    const tolerance = 1e-3
    const approxA = rationalCubicCurve2d.approximateAsCubicCurves(curveA, tolerance)
    const approxB = rationalCubicCurve2d.approximateAsCubicCurves(curveB, tolerance)
    const approxPath = rationalCubicPath2d.approximateAsCubicPath(path, tolerance)
    expect([...approxPath]).toHaveLength(approxA.length + approxB.length)
  })

  test('endpoints match input path at u = 0 and u = 1', () => {
    const path = rationalCubicPath2d.make(
      rationalCubicCurve2d.fromBezierPoints(
        vector2.makeWeighted(0, 0, 1),
        vector2.makeWeighted(1, 2, 5),
        vector2.makeWeighted(2, 2, 5),
        vector2.makeWeighted(3, 0, 1),
      ),
      rationalCubicCurve2d.fromBezierPoints(
        vector2.makeWeighted(3, 0, 1),
        vector2.makeWeighted(4, -1, 1),
        vector2.makeWeighted(5, -1, 1),
        vector2.makeWeighted(6, 0, 1),
      ),
    )
    const approx = rationalCubicPath2d.approximateAsCubicPath(path, 1e-3)
    expect(cubicPath2d.solve(approx, 0)).toBeCloseToValue(rationalCubicPath2d.solve(path, 0), 1e-10)
    expect(cubicPath2d.solve(approx, 1)).toBeCloseToValue(rationalCubicPath2d.solve(path, 1), 1e-10)
  })

  test('preserves C0 continuity from a continuous input', () => {
    const path = rationalCubicPath2d.make(
      rationalCubicCurve2d.fromBezierPoints(
        vector2.makeWeighted(0, 0, 1),
        vector2.makeWeighted(1, 2, 5),
        vector2.makeWeighted(2, 2, 5),
        vector2.makeWeighted(3, 0, 1),
      ),
      rationalCubicCurve2d.fromBezierPoints(
        vector2.makeWeighted(3, 0, 1),
        vector2.makeWeighted(4, -1, 1),
        vector2.makeWeighted(5, -1, 1),
        vector2.makeWeighted(6, 0, 1),
      ),
    )
    const approx = rationalCubicPath2d.approximateAsCubicPath(path, 1e-3)
    expect(cubicPath2d.isContinuous(approx)).toBe(true)
  })
})

describe('rationalCubicPath2d.boundingBox', () => {
  test('encloses every segment of the path', () => {
    const path = rationalCubicPath2d.make(
      rationalCubicCurve2d.fromBezierPoints(
        vector2.makeWeighted(0, 0, 1),
        vector2.makeWeighted(1, 3, 2),
        vector2.makeWeighted(2, 3, 2),
        vector2.makeWeighted(3, 0, 1),
      ),
      rationalCubicCurve2d.fromBezierPoints(
        vector2.makeWeighted(3, 0, 1),
        vector2.makeWeighted(4, -2, 1),
        vector2.makeWeighted(5, -2, 1),
        vector2.makeWeighted(6, 0, 1),
      ),
    )
    const box = rationalCubicPath2d.boundingBox(path, 1e-3)
    for (let i = 0; i <= 400; i++) {
      const u = i / 400
      const p = rationalCubicPath2d.solve(path, u)
      expect(p.x).toBeGreaterThanOrEqual(box.x.start - 1e-9)
      expect(p.x).toBeLessThanOrEqual(box.x.end + 1e-9)
      expect(p.y).toBeGreaterThanOrEqual(box.y.start - 1e-9)
      expect(p.y).toBeLessThanOrEqual(box.y.end + 1e-9)
    }
  })

  test('equals union of per-segment bounding boxes', () => {
    const seg0 = rationalCubicCurve2d.fromBezierPoints(
      vector2.makeWeighted(0, 0, 1),
      vector2.makeWeighted(1, 3, 2),
      vector2.makeWeighted(2, 3, 2),
      vector2.makeWeighted(3, 0, 1),
    )
    const seg1 = rationalCubicCurve2d.fromBezierPoints(
      vector2.makeWeighted(3, 0, 1),
      vector2.makeWeighted(4, -2, 1),
      vector2.makeWeighted(5, -2, 1),
      vector2.makeWeighted(6, 0, 1),
    )
    const tolerance = 1e-3
    const pathBox = rationalCubicPath2d.boundingBox(rationalCubicPath2d.make(seg0, seg1), tolerance)
    const box0 = rationalCubicCurve2d.boundingBox(seg0, tolerance)
    const box1 = rationalCubicCurve2d.boundingBox(seg1, tolerance)

    // Per-segment boxes feed straight into the union — the path-level
    // result is exactly what a hand-rolled `union(boxᵢ)` would produce.
    expect(pathBox.x.start).toBeCloseTo(Math.min(box0.x.start, box1.x.start), 12)
    expect(pathBox.x.end).toBeCloseTo(Math.max(box0.x.end, box1.x.end), 12)
    expect(pathBox.y.start).toBeCloseTo(Math.min(box0.y.start, box1.y.start), 12)
    expect(pathBox.y.end).toBeCloseTo(Math.max(box0.y.end, box1.y.end), 12)
  })
})
