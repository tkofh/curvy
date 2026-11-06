import { describe, expect, expectTypeOf, test } from 'vitest'
import * as Plane3d from '../src/plane/plane3d.ts'
import * as Polygon3d from '../src/polygon/polygon3d.ts'
import * as Solution from '../src/solution/solution.ts'
import * as Affine3d from '../src/transform/affine3d.ts'
import * as Rotation3d from '../src/transform/rotation3d.ts'
import * as Vector3 from '../src/vector/vector3.ts'

const value = <A>(s: Solution.AtMostOne<A>): A => {
  if (Solution.isNone(s)) {
    throw new Error('expected a value')
  }
  return s.value
}

const face = Polygon3d.fromTuples([
  [0, 0, 0],
  [1, 0, 0],
  [1, 1, 0],
  [0, 1, 0],
])

// A 4 x 4 square, tilted and moved off the axes.
const placement = Affine3d.rotate(Rotation3d.fromAxisAngle(Vector3.make(1, 2, 3), 0.9)).pipe(
  Affine3d.andThen(Affine3d.translate(5, -3, 2)),
)
const square = Polygon3d.fromTuples([
  [0, 0, 0],
  [4, 0, 0],
  [4, 4, 0],
  [0, 4, 0],
])
const tilted = Polygon3d.transform(square, placement)

describe('construction', () => {
  test('constructors agree, iterate, and print', () => {
    const made = Polygon3d.make(Vector3.zero, Vector3.unitX, Vector3.make(1, 1, 0), Vector3.unitY)
    expect(Polygon3d.equals(made, face)).toBe(true)
    expect([...face]).toHaveLength(4)
    expect(Polygon3d.isPolygon3d(face)).toBe(true)
    expect(
      String(
        Polygon3d.fromTuples([
          [0, 0, 0],
          [1, 0, 0],
          [0, 1, 0],
        ]),
      ),
    ).toBe('Polygon3d((0, 0, 0), (1, 0, 0), (0, 1, 0))')
  })

  test('invalid input throws', () => {
    expect(() => Polygon3d.fromArray([Vector3.zero, Vector3.unitX])).toThrow()
    expect(() =>
      Polygon3d.make(Vector3.zero, Vector3.unitX, Vector3.make(0, Number.NaN, 0)),
    ).toThrow()
  })

  test('fromArray copies its input', () => {
    const vs = [Vector3.zero, Vector3.unitX, Vector3.unitY]
    const p = Polygon3d.fromArray(vs)
    vs.push(Vector3.unitZ)
    expect(p.vertices).toHaveLength(3)
  })
})

describe('measures', () => {
  test('normal example: right-hand rule, flipped by reverse', () => {
    expect(value(Polygon3d.normal(face))).toEqual(Vector3.unitZ)
    expect(value(Polygon3d.normal(Polygon3d.reverse(face)))).toBeCloseToValue(
      Vector3.make(0, 0, -1),
    )
  })

  test('normal, area, perimeter, and centroid survive a rigid placement', () => {
    expect(value(Polygon3d.normal(tilted))).toBeCloseToValue(
      Affine3d.applyNormal(placement, Vector3.unitZ),
    )
    expect(Polygon3d.area(tilted)).toBeCloseTo(16, 12)
    expect(Polygon3d.perimeter(tilted)).toBeCloseTo(16, 12)
    expect(value(Polygon3d.centroid(tilted))).toBeCloseToValue(
      Affine3d.apply(placement, Vector3.make(2, 2, 0)),
    )
  })

  test('centroid is the area centroid, not the vertex average', () => {
    // Extra vertices along one edge pull a vertex average but not the centroid.
    const crowded = Polygon3d.fromTuples([
      [0, 0, 0],
      [1, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
      [4, 0, 0],
      [4, 4, 0],
      [0, 4, 0],
    ])
    expect(value(Polygon3d.centroid(crowded))).toBeCloseToValue(Vector3.make(2, 2, 0))
  })

  test('Newell normal averages a slightly non-planar quad', () => {
    const warped = Polygon3d.fromTuples([
      [0, 0, 0.01],
      [1, 0, -0.01],
      [1, 1, 0.01],
      [0, 1, -0.01],
    ])
    expect(value(Polygon3d.normal(warped))).toBeCloseToValue(Vector3.unitZ)
    expect(Polygon3d.isConvex(warped)).toBe(false)
  })

  test('plane passes through the face and faces along the normal', () => {
    const pl = Polygon3d.plane(Polygon3d.asPlanar(tilted))
    for (const v of tilted) {
      expect(Plane3d.signedDistance(pl, v)).toBeCloseTo(0, 12)
    }
    expect(pl.normal).toBeCloseToValue(value(Polygon3d.normal(tilted)))
  })

  test('degenerate polygons have no normal, centroid, or plane', () => {
    const line = Polygon3d.fromTuples([
      [0, 0, 0],
      [1, 1, 1],
      [2, 2, 2],
      [3, 3, 3],
    ])
    expect(Polygon3d.normal(line)).toBe(Solution.none)
    expect(Polygon3d.centroid(line)).toBe(Solution.none)
    expect(Polygon3d.isPlanar(line)).toBe(false)
    expect(Polygon3d.area(line)).toBe(0)
  })
})

describe('planarity', () => {
  test('a flat face is planar whatever its shape, and a warped one is not', () => {
    const notch = Polygon3d.transform(
      Polygon3d.fromTuples([
        [0, 0, 0],
        [4, 0, 0],
        [4, 4, 0],
        [2, 1, 0],
        [0, 4, 0],
      ]),
      placement,
    )
    expect(Polygon3d.isPlanar(notch)).toBe(true)
    expect(Polygon3d.isConvex(notch)).toBe(false)

    const warped = Polygon3d.fromTuples([
      [0, 0, 0.01],
      [1, 0, -0.01],
      [1, 1, 0.01],
      [0, 1, -0.01],
    ])
    expect(Polygon3d.isPlanar(warped)).toBe(false)
    expect(() => Polygon3d.asPlanar(warped)).toThrow('polygon is not planar')
  })

  test('asPlanar returns the same instance, and plane fits it', () => {
    const lifted = Polygon3d.fromTuples([
      [0, 0, 2],
      [1, 0, 2],
      [1, 1, 2],
      [0, 1, 2],
    ])
    const planar = Polygon3d.asPlanar(lifted)
    expect(planar).toBe(lifted)
    const pl = Polygon3d.plane(planar)
    expect(Plane3d.equals(pl, Plane3d.make(Vector3.unitZ, 2))).toBe(true)
    expect(Plane3d.equals(Polygon3d.plane(Polygon3d.reverse(planar)), Plane3d.flip(pl))).toBe(true)
  })

  test('convexity checks and cuts grant Planar', () => {
    const convexFace = Polygon3d.asConvex(square)
    expectTypeOf(convexFace).toExtend<Polygon3d.Polygon3d<Polygon3d.Planar>>()
    const pl = Polygon3d.plane(convexFace)
    expect(pl.normal).toBeCloseToValue(value(Polygon3d.normal(square)))

    // Halve the square through its centroid, perpendicular to its face.
    const across = Plane3d.fromPointNormal(
      value(Polygon3d.centroid(square)),
      Vector3.cross(pl.normal, Vector3.unitX),
    )
    const { front, back } = Polygon3d.split(convexFace, across)
    for (const piece of [value(front), value(back)]) {
      expectTypeOf(piece).toExtend<Polygon3d.Polygon3d<Polygon3d.Planar>>()
      expect(Polygon3d.isPlanar(piece)).toBe(true)
      const own = Polygon3d.plane(piece)
      expect(own.normal).toBeCloseToValue(pl.normal)
      expect(own.offset).toBeCloseTo(pl.offset, 12)
    }
  })
})

describe('convexity', () => {
  test('planar convex outlines pass, collinear and repeated vertices included', () => {
    expect(Polygon3d.isConvex(tilted)).toBe(true)
    expect(
      Polygon3d.isConvex(
        Polygon3d.fromTuples([
          [0, 0, 0],
          [1, 0, 0],
          [2, 0, 0],
          [2, 0, 0],
          [2, 2, 0],
          [0, 2, 0],
        ]),
      ),
    ).toBe(true)
  })

  test('concave, non-planar, star, and spiked outlines fail', () => {
    const concave = Polygon3d.fromTuples([
      [0, 0, 0],
      [4, 0, 0],
      [4, 4, 0],
      [2, 1, 0],
      [0, 4, 0],
    ])
    const bent = Polygon3d.fromTuples([
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0.5],
      [0, 1, 0],
    ])
    const star = Polygon3d.fromArray(
      [0, 2, 4, 1, 3].map((k) => {
        const a = (k * 2 * Math.PI) / 5
        return Vector3.make(Math.cos(a), Math.sin(a), 0)
      }),
    )
    const spiked = Polygon3d.fromTuples([
      [0, 0, 0],
      [2, 0, 0],
      [3, 0, 0],
      [2, 0, 0],
      [2, 2, 0],
      [0, 2, 0],
    ])
    for (const p of [concave, bent, star, spiked]) {
      expect(Polygon3d.isConvex(p)).toBe(false)
    }
    expect(() => Polygon3d.asConvex(bent)).toThrow()
  })

  test('far from the origin, rounding does not break planarity', () => {
    const far = Affine3d.rotate(Rotation3d.fromAxisAngle(Vector3.make(3, -1, 2), 1.3)).pipe(
      Affine3d.andThen(Affine3d.translate(1e6, -2e6, 3e6)),
    )
    expect(Polygon3d.isConvex(Polygon3d.transform(square, far))).toBe(true)
  })
})

describe('cutting', () => {
  const convexFace = Polygon3d.asConvex(square)

  test('clip example: keep x <= 1', () => {
    const kept = value(Polygon3d.clip(convexFace, Plane3d.make(Vector3.make(-1, 0, 0), -1)))
    expect(
      Polygon3d.equals(
        kept,
        Polygon3d.fromTuples([
          [0, 0, 0],
          [1, 0, 0],
          [1, 4, 0],
          [0, 4, 0],
        ]),
      ),
    ).toBe(true)
    expect(value(Polygon3d.normal(kept))).toEqual(Vector3.unitZ)
  })

  test('clip keeps a face wholly in front, and drops one wholly behind', () => {
    const below = Plane3d.make(Vector3.unitZ, -1)
    expect(value(Polygon3d.clip(convexFace, below))).toBe(convexFace)
    expect(Polygon3d.clip(convexFace, Plane3d.flip(below))).toBe(Solution.none)
    // A face lying in the plane is on its closed front side, whichever way
    // the plane faces, and split puts it on both sides.
    const inPlane = Plane3d.make(Vector3.unitZ, 0)
    expect(value(Polygon3d.clip(convexFace, inPlane))).toBe(convexFace)
    expect(value(Polygon3d.clip(convexFace, Plane3d.flip(inPlane)))).toBe(convexFace)
    const both = Polygon3d.split(convexFace, inPlane)
    expect(value(both.front)).toBe(convexFace)
    expect(value(both.back)).toBe(convexFace)
  })

  test('split pieces share the cut and add up to the whole', () => {
    const face3 = Polygon3d.asConvex(tilted)
    const cutter = Plane3d.fromPointNormal(
      value(Polygon3d.centroid(tilted)),
      Vector3.make(0.3, 1, -0.2),
    )
    const { front, back } = Polygon3d.split(face3, cutter)
    const f = value(front)
    const b = value(back)
    expect(Polygon3d.area(f) + Polygon3d.area(b)).toBeCloseTo(16, 10)
    for (const v of f) {
      expect(Plane3d.signedDistance(cutter, v)).toBeGreaterThan(-1e-12)
    }
    for (const v of b) {
      expect(Plane3d.signedDistance(cutter, v)).toBeLessThan(1e-12)
    }
    expect(Polygon3d.isConvex(f) && Polygon3d.isConvex(b)).toBe(true)
    expect(face3.pipe(Polygon3d.split(cutter))).toEqual({ front, back })
  })

  test('split by a plane that misses keeps the face on one side', () => {
    const { front, back } = Polygon3d.split(convexFace, Plane3d.make(Vector3.unitX, 10))
    expect(front).toBe(Solution.none)
    expect(value(back)).toBe(convexFace)
  })

  test('a cut through a corner only leaves no sliver', () => {
    const corner = Plane3d.make(Vector3.make(-1, -1, 0), -0)
    expect(Polygon3d.clip(convexFace, corner)).toBe(Solution.none)
  })
})

describe('transform', () => {
  test('a mirror turns the face inside out until reversed', () => {
    const mirror = Affine3d.scale(-1, 1, 1)
    const image = Polygon3d.transform(face, mirror)
    const expected = Affine3d.applyNormal(mirror, Vector3.unitZ)
    expect(value(Polygon3d.normal(image))).toBeCloseToValue(Vector3.scale(expected, -1))
    expect(value(Polygon3d.normal(Polygon3d.reverse(image)))).toBeCloseToValue(expected)
    expect(face.pipe(Polygon3d.transform(mirror))).toEqual(image)
  })
})
