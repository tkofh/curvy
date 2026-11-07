import { describe, expect, expectTypeOf, test } from 'vitest'
import * as RationalCubicPath2d from '../src/path/rationalCubic2d.ts'
import * as LinearPath2d from '../src/path/linear2d.ts'
import type { Convex } from '../src/polygon/polygon2d.ts'
import * as Polygon2d from '../src/polygon/polygon2d.ts'
import * as Solution from '../src/solution/solution.ts'
import * as Affine2d from '../src/transform/affine2d.ts'
import * as Vector2 from '../src/vector/vector2.ts'

const square = (size = 4, x = 0, y = 0) =>
  Polygon2d.asConvex(
    Polygon2d.fromTuples([
      [x, y],
      [x + size, y],
      [x + size, y + size],
      [x, y + size],
    ]),
  )

const tuples = (s: Solution.AtMostOne<Polygon2d.Polygon2d>) =>
  Solution.isNone(s) ? undefined : s.value.vertices.map((v) => [v.x, v.y])

describe('construction', () => {
  test('make, fromArray, and fromTuples agree', () => {
    const a = Polygon2d.fromArray([Vector2.make(0, 0), Vector2.make(1, 0), Vector2.make(0, 1)])
    const b = Polygon2d.fromArray([Vector2.make(0, 0), Vector2.make(1, 0), Vector2.make(0, 1)])
    const c = Polygon2d.fromTuples([
      [0, 0],
      [1, 0],
      [0, 1],
    ])
    expect(Polygon2d.equals(a, b)).toBe(true)
    expect(Polygon2d.equals(b, c)).toBe(true)
  })

  test('requires three finite vertices', () => {
    expect(() => Polygon2d.fromArray([Vector2.zero, Vector2.one])).toThrow()
    expect(() =>
      Polygon2d.fromTuples([
        [0, 0],
        [1, Number.NaN],
        [0, 1],
      ]),
    ).toThrow()
  })

  test('copies its input array', () => {
    const input = [Vector2.make(0, 0), Vector2.make(1, 0), Vector2.make(0, 1)]
    const p = Polygon2d.fromArray(input)
    input.push(Vector2.make(5, 5))
    expect(p.vertices).toHaveLength(3)
  })

  test('is iterable and prints as itself', () => {
    const p = Polygon2d.fromTuples([
      [0, 0],
      [1, 0],
      [0, 1],
    ])
    expect([...p].map((v) => v.x)).toEqual([0, 1, 0])
    expect(String(p)).toBe('Polygon2d((0, 0), (1, 0), (0, 1))')
    expect(Polygon2d.isPolygon2d(p)).toBe(true)
    expect(Polygon2d.isPolygon2d({ vertices: [] })).toBe(false)
  })

  test('equals compares representation, not region', () => {
    const p = square()
    expect(Polygon2d.equals(p, Polygon2d.reverse(p))).toBe(false)
    expect(Polygon2d.equals(Polygon2d.reverse(Polygon2d.reverse(p)))(p)).toBe(true)
  })
})

describe('measures', () => {
  test('signedArea example', () => {
    const s = Polygon2d.fromTuples([
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
    ])
    expect(Polygon2d.signedArea(s)).toBe(4)
    expect(Polygon2d.signedArea(Polygon2d.reverse(s))).toBe(-4)
    expect(Polygon2d.area(Polygon2d.reverse(s))).toBe(4)
  })

  test('signed area survives a far-off translation', () => {
    const far = square(1, 1e8 + 0.1, 1e8 + 0.1)
    expect(Polygon2d.signedArea(far)).toBeCloseTo(1, 6)
  })

  test('winding example', () => {
    const face = Polygon2d.fromTuples([
      [0, 0],
      [10, 0],
      [10, 10],
    ])
    expect(Polygon2d.winding(face)).toEqual(Solution.one('clockwise'))
    expect(Polygon2d.winding(Polygon2d.reverse(face))).toEqual(Solution.one('counterclockwise'))
    expect(
      Polygon2d.winding(
        Polygon2d.fromTuples([
          [0, 0],
          [1, 1],
          [2, 2],
        ]),
      ),
    ).toBe(Solution.none)
  })

  test('winding verdicts are invariant under uniform scaling', () => {
    // Collinear up to rounding, at every scale.
    for (const k of [1e-6, 1, 1e6]) {
      const p = Polygon2d.fromTuples([
        [0.1 * k, 0.1 * k],
        [0.2 * k, 0.2 * k],
        [0.3 * k, 0.3 * k],
      ])
      expect(Solution.isNone(Polygon2d.winding(p))).toBe(true)
      const thin = Polygon2d.fromTuples([
        [0.1 * k, 0.1 * k],
        [0.2 * k, 0.2 * k],
        [0.3 * k, 0.3 * k + 1e-6 * k],
      ])
      expect(Polygon2d.winding(thin)).toEqual(Solution.one('clockwise'))
    }
  })

  test('perimeter includes the closing edge', () => {
    expect(Polygon2d.perimeter(square(3))).toBe(12)
  })

  test('centroid is the area centroid, not the vertex average', () => {
    // An extra vertex on the bottom edge moves the vertex average, not the centroid.
    const p = Polygon2d.fromTuples([
      [0, 0],
      [1, 0],
      [4, 0],
      [4, 4],
      [0, 4],
    ])
    expect(Polygon2d.centroid(p)).toEqual(Solution.one(Vector2.make(2, 2)))
    expect(
      Polygon2d.centroid(
        Polygon2d.fromTuples([
          [0, 0],
          [1, 0],
          [2, 0],
        ]),
      ),
    ).toBe(Solution.none)
  })

  test('boundingBox spans the vertices', () => {
    const box = Polygon2d.boundingBox(
      Polygon2d.fromTuples([
        [1, -2],
        [5, 0],
        [3, 7],
      ]),
    )
    expect([box.x.start, box.x.end, box.y.start, box.y.end]).toEqual([1, 5, -2, 7])
  })

  test('boundingBox handles more vertices than a call can take as arguments', () => {
    const n = 200_000
    const box = Polygon2d.boundingBox(
      Polygon2d.fromArray(Array.from({ length: n }, (_, i) => Vector2.make(i, Math.sin(i) * 3))),
    )
    expect([box.x.start, box.x.end]).toEqual([0, n - 1])
    expect(box.y.end).toBeCloseTo(3, 6)
  })
})

describe('convexity', () => {
  test('accepts convex polygons with collinear and repeated vertices', () => {
    const p = Polygon2d.fromTuples([
      [0, 0],
      [2, 0],
      [4, 0],
      [4, 0],
      [4, 4],
      [0, 4],
      [0, 0],
    ])
    expect(Polygon2d.isConvex(p)).toBe(true)
    expect(Polygon2d.isConvex(Polygon2d.reverse(p))).toBe(true)
  })

  test('rejects concave, degenerate, spiked, and doubly wound polygons', () => {
    const concave = Polygon2d.fromTuples([
      [0, 0],
      [4, 0],
      [2, 1],
      [4, 4],
      [0, 4],
    ])
    const flat = Polygon2d.fromTuples([
      [0, 0],
      [1, 0],
      [2, 0],
    ])
    const spike = Polygon2d.fromTuples([
      [0, 0],
      [4, 0],
      [6, 0],
      [4, 0],
      [4, 4],
      [0, 4],
    ])
    const pentagram = Polygon2d.fromArray(
      [0, 2, 4, 1, 3].map((k) => Vector2.fromPolar((2 * Math.PI * k) / 5, 1)),
    )
    for (const p of [concave, flat, spike, pentagram]) {
      expect(Polygon2d.isConvex(p)).toBe(false)
    }
    expect(() => Polygon2d.asConvex(concave)).toThrow()
  })

  test('narrows the type', () => {
    const p = Polygon2d.fromTuples([
      [0, 0],
      [1, 0],
      [0, 1],
    ])
    if (Polygon2d.isConvex(p)) {
      expectTypeOf(p).toEqualTypeOf<Polygon2d.Polygon2d<Convex>>()
    }
  })

  test('convexHull example', () => {
    const hull = Polygon2d.convexHull([
      Vector2.make(0, 0),
      Vector2.make(4, 0),
      Vector2.make(2, 1),
      Vector2.make(4, 4),
      Vector2.make(0, 4),
      Vector2.make(2, 4),
    ])
    expect(Solution.map(hull, Polygon2d.toPathData)).toEqual(
      Solution.one('M 0,0 L 4,0 L 4,4 L 0,4 Z'),
    )
  })

  test('convexHull of a random cloud is convex and contains every point', () => {
    let seed = 7
    const random = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    const points = Array.from({ length: 200 }, () => Vector2.make(random() * 10, random() * 10))
    const hull = Polygon2d.convexHull(points)
    expect(Solution.isSome(hull)).toBe(true)
    if (Solution.isNone(hull)) {
      return
    }
    expect(Polygon2d.isConvex(hull.value)).toBe(true)
    expect(Polygon2d.winding(hull.value)).toEqual(Solution.one('clockwise'))
    // Every point survives every clip by the hull's own edges.
    const vs = hull.value.vertices
    for (let i = 0; i < vs.length; i++) {
      const a = vs[i]!
      const b = vs[(i + 1) % vs.length]!
      const inward = Vector2.make(-(b.y - a.y), b.x - a.x)
      for (const p of points) {
        expect(Vector2.dot(Vector2.subtract(p, a), inward)).toBeGreaterThanOrEqual(-1e-9)
      }
    }
  })

  test('convexHull of too few or collinear points is none', () => {
    expect(Polygon2d.convexHull([Vector2.zero, Vector2.one])).toBe(Solution.none)
    expect(Polygon2d.convexHull([Vector2.zero, Vector2.one, Vector2.make(2, 2)])).toBe(
      Solution.none,
    )
    expect(Polygon2d.convexHull([Vector2.one, Vector2.one, Vector2.one])).toBe(Solution.none)
  })
})

describe('clip and split', () => {
  test('clip example', () => {
    expect(tuples(Polygon2d.clip(square(), Vector2.make(1, 0), Vector2.make(-1, 0)))).toEqual([
      [0, 0],
      [1, 0],
      [1, 4],
      [0, 4],
    ])
  })

  test('clip is data-last too, and keeps the convex brand', () => {
    const kept = square().pipe(Polygon2d.clip(Vector2.make(1, 0), Vector2.make(-1, 0)))
    expectTypeOf(kept).toEqualTypeOf<Solution.AtMostOne<Polygon2d.Polygon2d<Convex>>>()
    expect(Solution.isSome(kept)).toBe(true)
  })

  test('a polygon wholly on the kept side comes back as the same instance', () => {
    const s = square()
    expect(Polygon2d.clip(s, Vector2.make(-1, 0), Vector2.make(1, 0))).toEqual(Solution.one(s))
    // Touching the line along an edge still counts as wholly kept.
    const touching = Polygon2d.clip(s, Vector2.make(0, 0), Vector2.make(1, 0))
    expect(Solution.isSome(touching) && touching.value).toBe(s)
  })

  test('nothing kept is none', () => {
    expect(Polygon2d.clip(square(), Vector2.make(5, 0), Vector2.make(1, 0))).toBe(Solution.none)
    // Touching from the other side keeps nothing of area.
    expect(Polygon2d.clip(square(), Vector2.make(4, 0), Vector2.make(1, 0))).toBe(Solution.none)
  })

  test('clipping through a vertex keeps it exactly, without duplicating it', () => {
    expect(tuples(Polygon2d.clip(square(), Vector2.zero, Vector2.make(1, -1)))).toEqual([
      [0, 0],
      [4, 0],
      [4, 4],
    ])
  })

  test('split example', () => {
    const { front, back } = Polygon2d.split(square(), Vector2.zero, Vector2.make(-1, 1))
    expect(tuples(front)).toEqual([
      [0, 0],
      [4, 4],
      [0, 4],
    ])
    expect(tuples(back)).toEqual([
      [0, 0],
      [4, 0],
      [4, 4],
    ])
  })

  test('split pieces share their crossing vertices and conserve area', () => {
    const s = square()
    const { front, back } = Polygon2d.split(s, Vector2.make(1.3, 0), Vector2.make(1, 0.4))
    if (Solution.isNone(front) || Solution.isNone(back)) {
      throw new Error('expected two pieces')
    }
    expect(Polygon2d.area(front.value) + Polygon2d.area(back.value)).toBeCloseTo(16, 12)
    const shared = front.value.vertices.filter((v) =>
      back.value.vertices.some((w) => Vector2.equals(v, w)),
    )
    expect(shared).toHaveLength(2)
    expect(Polygon2d.isConvex(front.value)).toBe(true)
    expect(Polygon2d.isConvex(back.value)).toBe(true)
  })

  test('a line that misses puts the polygon on one side', () => {
    const s = square()
    const { front, back } = Polygon2d.split(s, Vector2.make(10, 0), Vector2.make(1, 0))
    expect(front).toBe(Solution.none)
    expect(back).toEqual(Solution.one(s))
  })

  test('a zero normal throws', () => {
    expect(() => Polygon2d.clip(square(), Vector2.zero, Vector2.zero)).toThrow()
    expect(() => Polygon2d.split(square(), Vector2.zero, Vector2.zero)).toThrow()
  })
})

describe('inset', () => {
  test('inset example', () => {
    const plate = Polygon2d.asConvex(
      Polygon2d.fromTuples([
        [0, 0],
        [10, 0],
        [10, 4],
        [0, 4],
      ]),
    )
    expect(tuples(Polygon2d.inset(plate, 1))).toEqual([
      [1, 1],
      [9, 1],
      [9, 3],
      [1, 3],
    ])
    expect(Polygon2d.inset(plate, 2)).toBe(Solution.none)
  })

  test('works for either winding and keeps it', () => {
    const p = Polygon2d.reverse(square(10))
    const inner = Polygon2d.inset(p, 2)
    if (Solution.isNone(inner)) {
      throw new Error('expected a polygon')
    }
    expect(Polygon2d.area(inner.value)).toBeCloseTo(36, 12)
    expect(Polygon2d.winding(inner.value)).toEqual(Polygon2d.winding(p))
  })

  test('short edges collapse and drop out', () => {
    // A rectangle with one corner cut by a short chamfer.
    const p = Polygon2d.asConvex(
      Polygon2d.fromTuples([
        [0, 0],
        [9, 0],
        [10, 1],
        [10, 10],
        [0, 10],
      ]),
    )
    const inner = Polygon2d.inset(p, 3)
    if (Solution.isNone(inner)) {
      throw new Error('expected a polygon')
    }
    // The chamfer's offset no longer reaches the corner region: four vertices remain.
    expect(inner.value.vertices).toHaveLength(4)
    expect(Polygon2d.boundingBox(inner.value).x.end).toBeCloseTo(7, 12)
  })

  test('every edge moves by exactly the distance on a triangle', () => {
    const t = Polygon2d.asConvex(
      Polygon2d.fromTuples([
        [0, 0],
        [6, 0],
        [0, 8],
      ]),
    )
    // Inradius of a 6-8-10 triangle is 2.
    const inner = Polygon2d.inset(t, 1)
    if (Solution.isNone(inner)) {
      throw new Error('expected a polygon')
    }
    expect(Polygon2d.area(inner.value)).toBeCloseTo(24 / 4, 12)
    expect(Polygon2d.inset(t, 2)).toBe(Solution.none)
  })

  test('zero distance returns the polygon, negative throws', () => {
    const s = square()
    expect(Polygon2d.inset(s, 0)).toEqual(Solution.one(s))
    expect(() => Polygon2d.inset(s, -1)).toThrow()
    expect(() => Polygon2d.inset(s, Number.NaN)).toThrow()
  })
})

describe('transform and output', () => {
  test('transform maps vertices and drops brands', () => {
    const moved = Polygon2d.transform(square(), Affine2d.translate(1, 2))
    expectTypeOf(moved).toEqualTypeOf<Polygon2d.Polygon2d>()
    expect(moved.vertices[0]).toBeCloseToValue(Vector2.make(1, 2))
    expect(Polygon2d.winding(Polygon2d.transform(square(), Affine2d.reflectX))).toEqual(
      Solution.one('counterclockwise'),
    )
  })

  test('toPathData closes with Z', () => {
    expect(
      Polygon2d.toPathData(
        Polygon2d.fromTuples([
          [0, 0],
          [4, 0],
          [4, 4],
        ]),
      ),
    ).toBe('M 0,0 L 4,0 L 4,4 Z')
  })

  test('toPath has one segment per edge and returns to the start', () => {
    const path = Polygon2d.toPath(square())
    expect([...path]).toHaveLength(4)
    expect(LinearPath2d.solve(path, 1)).toBeCloseToValue(Vector2.make(0, 0))
  })
})

describe('rounded corners', () => {
  const tenSquare = Polygon2d.fromTuples([
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ])

  test('roundedPathData example', () => {
    expect(Polygon2d.roundedPathData(tenSquare, 2)).toBe(
      'M 0,2 A 2 2 0 0 1 2,0 L 8,0 A 2 2 0 0 1 10,2 L 10,8 A 2 2 0 0 1 8,10 L 2,10 A 2 2 0 0 1 0,8 Z',
    )
  })

  test('zero radius matches toPathData up to the start point', () => {
    expect(Polygon2d.roundedPathData(tenSquare, 0)).toBe(Polygon2d.toPathData(tenSquare))
  })

  test('per-vertex radii, with sharp corners as lines', () => {
    expect(Polygon2d.roundedPathData(tenSquare, [0, 2, 0, 0])).toBe(
      'M 0,0 L 8,0 A 2 2 0 0 1 10,2 L 10,10 L 0,10 Z',
    )
    expect(() => Polygon2d.roundedPathData(tenSquare, [1, 2])).toThrow()
    expect(() => Polygon2d.roundedPathData(tenSquare, -1)).toThrow()
  })

  test('oversized radii shrink to meet at edge midpoints', () => {
    // Radius 50 on a 10-square clamps to 5: the outline becomes a circle.
    const d = Polygon2d.roundedPathData(tenSquare, 50)
    expect(d).toBe('M 0,5 A 5 5 0 0 1 5,0 A 5 5 0 0 1 10,5 A 5 5 0 0 1 5,10 A 5 5 0 0 1 0,5 Z')
  })

  test('reverse winding sweeps the other way', () => {
    expect(Polygon2d.roundedPathData(Polygon2d.reverse(tenSquare), 2)).toContain('A 2 2 0 0 0')
  })

  test('concave corners round outward from the region', () => {
    // An L shape: the corner at (5, 5) is concave.
    const l = Polygon2d.fromTuples([
      [0, 0],
      [10, 0],
      [10, 5],
      [5, 5],
      [5, 10],
      [0, 10],
    ])
    const d = Polygon2d.roundedPathData(l, [0, 0, 0, 1, 0, 0])
    expect(d).toBe('M 0,0 L 10,0 L 10,5 L 6,5 A 1 1 0 0 0 5,6 L 5,10 L 0,10 Z')
  })

  test('rounded traces the same outline as roundedPathData', () => {
    const p = Polygon2d.fromTuples([
      [0, 0],
      [8, 1],
      [9, 7],
      [2, 9],
    ])
    const path = Polygon2d.rounded(p, 1.5)
    // Closed, continuous outline: each segment ends where the next begins.
    const segments = [...path].map((c) => RationalCubicPath2d.fromArray([c]))
    const junctions = segments.map((s) => RationalCubicPath2d.solve(s, 0))
    segments.forEach((s, i) => {
      expect(
        Vector2.equals(RationalCubicPath2d.solve(s, 1), junctions[(i + 1) % junctions.length]!),
      ).toBe(true)
    })
    // Every endpoint the path data visits is a segment endpoint of the path.
    // Arcs split at quarter turns in the path and half turns in the data, so
    // the path may have extra junctions but never misses one.
    const visited = [
      ...Polygon2d.roundedPathData(p, 1.5).matchAll(/(-?[\d.e-]+),(-?[\d.e-]+)/g),
    ].map((m) => Vector2.make(Number(m[1]), Number(m[2])))
    expect(visited).toHaveLength(8)
    for (const v of visited) {
      expect(junctions.some((j) => Vector2.equals(j, v))).toBe(true)
    }
  })

  test('collinear vertices stay sharp', () => {
    const p = Polygon2d.fromTuples([
      [0, 0],
      [5, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ])
    expect(Polygon2d.roundedPathData(p, [0, 3, 0, 0, 0])).toBe(Polygon2d.toPathData(p))
  })
})
