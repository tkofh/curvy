import { describe, expect, expectTypeOf, test } from 'vitest'
import * as Plane3d from '../src/plane/plane3d.ts'
import * as Polygon3d from '../src/polygon/polygon3d.ts'
import * as ConvexPolyhedron from '../src/polyhedron/convexPolyhedron.ts'
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

const outward = (x: number, y: number, z: number, offset: number) =>
  Plane3d.make(Vector3.make(x, y, z), offset)

// The box [0, 1] x [0, 2] x [0, 3].
const boxPlanes = [
  outward(1, 0, 0, 1),
  outward(-1, 0, 0, 0),
  outward(0, 1, 0, 2),
  outward(0, -1, 0, 0),
  outward(0, 0, 1, 3),
  outward(0, 0, -1, 0),
]

// Every face of a closed solid: winds outward, lies on its plane, and every
// edge is shared with exactly one other face running the other way.
const expectClosed = (p: ConvexPolyhedron.ConvexPolyhedron) => {
  const edges = new Map<string, number>()
  for (const face of p.faces) {
    const vs = face.indices.map((i) => p.vertices[i]!)
    const normal = value(Polygon3d.normal(Polygon3d.fromArray(vs)))
    expect(normal).toBeCloseToValue(face.plane.normal, 1e-9)
    for (const v of vs) {
      expect(Plane3d.signedDistance(face.plane, v)).toBeCloseTo(0, 9)
    }
    for (let i = 0; i < face.indices.length; i++) {
      const key = `${face.indices[i]},${face.indices[(i + 1) % face.indices.length]}`
      edges.set(key, (edges.get(key) ?? 0) + 1)
    }
  }
  for (const [key, n] of edges) {
    expect(n).toBe(1)
    const [a, b] = key.split(',')
    expect(edges.get(`${b},${a}`)).toBe(1)
  }
  // Euler's formula for a convex solid.
  expect(p.vertices.length - edges.size / 2 + p.faces.length).toBe(2)
}

describe('fromHalfSpaces', () => {
  test('a box has 8 shared corners and 6 outward quads labeled by index', () => {
    const box = value(ConvexPolyhedron.fromHalfSpaces(boxPlanes))
    expect(box.vertices).toHaveLength(8)
    expect(box.faces.map((f) => f.label)).toEqual([0, 1, 2, 3, 4, 5])
    expect(box.faces.every((f) => f.indices.length === 4)).toBe(true)
    for (const v of box.vertices) {
      expect([v.x, v.y, v.z]).toEqual([v.x === 0 ? 0 : 1, v.y === 0 ? 0 : 2, v.z === 0 ? 0 : 3])
    }
    box.faces.forEach((f, i) => expect(f.plane).toBe(boxPlanes[i]))
    expectClosed(box)
    expect(String(box)).toBe('ConvexPolyhedron(8 vertices, 6 faces)')
    expect(ConvexPolyhedron.isConvexPolyhedron(box)).toBe(true)
    expect(ConvexPolyhedron.isConvexPolyhedron(boxPlanes[0])).toBe(false)
  })

  test('labels pass through to their faces', () => {
    const wedge = value(
      ConvexPolyhedron.fromHalfSpaces([
        { plane: outward(0, 0, -1, 0), label: 'floor' },
        { plane: outward(-1, 0, 0, 0), label: 'back' },
        { plane: outward(0, -1, 0, 0), label: 'left' },
        { plane: outward(0, 1, 0, 1), label: 'right' },
        { plane: outward(1, 0, 1, 1), label: 'roof' },
      ]),
    )
    expectTypeOf(wedge).toEqualTypeOf<ConvexPolyhedron.ConvexPolyhedron<string>>()
    expect(wedge.faces.map((f) => f.label)).toEqual(['floor', 'back', 'left', 'right', 'roof'])
    expect(wedge.vertices).toHaveLength(6)
    expect(wedge.faces.map((f) => f.indices.length)).toEqual([4, 4, 3, 3, 4])
    expectClosed(wedge)
  })

  test('four planes through one apex weld into a single corner', () => {
    // A square pyramid with its apex at (0, 0, 1).
    const pyramid = value(
      ConvexPolyhedron.fromHalfSpaces([
        outward(0, 0, -1, 0),
        outward(1, 0, 1, 1),
        outward(-1, 0, 1, 1),
        outward(0, 1, 1, 1),
        outward(0, -1, 1, 1),
      ]),
    )
    expect(pyramid.vertices).toHaveLength(5)
    expect(pyramid.faces.map((f) => f.indices.length)).toEqual([4, 3, 3, 3, 3])
    expect(pyramid.vertices.some((v) => Vector3.equals(v, Vector3.unitZ))).toBe(true)
    expectClosed(pyramid)
  })

  test('a many-sided tilted prism stays closed', () => {
    const placement = Affine3d.rotate(Rotation3d.fromAxisAngle(Vector3.make(1, 2, 3), 0.7)).pipe(
      Affine3d.andThen(Affine3d.translate(40, -12, 7)),
    )
    const sides = 24
    const planes = [outward(0, 0, 1, 1), outward(0, 0, -1, 1)]
    for (let i = 0; i < sides; i++) {
      const a = (2 * Math.PI * i) / sides
      planes.push(outward(Math.cos(a), Math.sin(a), 0, 2))
    }
    const prism = value(ConvexPolyhedron.fromHalfSpaces(planes.map(Plane3d.transform(placement))))
    expect(prism.vertices).toHaveLength(2 * sides)
    expect(prism.faces).toHaveLength(sides + 2)
    expectClosed(prism)
  })

  test('redundant, touching, and repeated planes make no face', () => {
    const extra = [
      outward(1, 1, 1, 100), // misses
      outward(1, 1, 0, 3), // touches the edge x = 1, y = 2
      outward(1, 1, 1, 6), // touches the corner (1, 2, 3)
      Plane3d.make(Vector3.make(2, 0, 0), 2), // repeats x <= 1
    ]
    const box = value(ConvexPolyhedron.fromHalfSpaces([...boxPlanes, ...extra]))
    expect(box.vertices).toHaveLength(8)
    expect(box.faces.map((f) => f.label)).toEqual([0, 1, 2, 3, 4, 5])
    expectClosed(box)
  })

  test('a cutting plane adds a face and moves corners', () => {
    const cut = value(ConvexPolyhedron.fromHalfSpaces([...boxPlanes, outward(1, 1, 1, 5)]))
    expect(cut.faces).toHaveLength(7)
    expect(cut.faces.at(-1)!.label).toBe(6)
    expectClosed(cut)
    for (const v of cut.vertices) {
      expect(v.x + v.y + v.z).toBeLessThanOrEqual(5 + 1e-12)
    }
  })

  test('empty, flat, and unbounded regions are none', () => {
    // Fewer than four planes can't close a solid.
    expect(ConvexPolyhedron.fromHalfSpaces(boxPlanes.slice(0, 3))).toBe(Solution.none)
    // The box without its top is open upward.
    expect(ConvexPolyhedron.fromHalfSpaces(boxPlanes.slice(0, 5))).toBe(Solution.none)
    expect(ConvexPolyhedron.fromHalfSpaces([...boxPlanes.slice(0, 4), outward(0, 0, -1, 0)])).toBe(
      Solution.none,
    )
    // x >= 2 contradicts x <= 1.
    expect(ConvexPolyhedron.fromHalfSpaces([...boxPlanes, outward(-1, 0, 0, -2)])).toBe(
      Solution.none,
    )
    // x <= 0 squashes the box flat.
    expect(ConvexPolyhedron.fromHalfSpaces([...boxPlanes, outward(1, 0, 0, 0)])).toBe(Solution.none)
    // A slab of parallel planes is unbounded sideways.
    expect(
      ConvexPolyhedron.fromHalfSpaces([
        outward(0, 0, 1, 1),
        outward(0, 0, -1, 0),
        outward(0, 0, 1, 2),
        outward(0, 0, -1, 1),
      ]),
    ).toBe(Solution.none)
  })
})

describe('queries', () => {
  const box = value(ConvexPolyhedron.fromHalfSpaces(boxPlanes))

  test('contains includes the boundary', () => {
    expect(ConvexPolyhedron.contains(box, Vector3.make(0.5, 1, 1.5))).toBe(true)
    expect(ConvexPolyhedron.contains(box, Vector3.make(1, 2, 3))).toBe(true)
    expect(ConvexPolyhedron.contains(box, Vector3.make(1.001, 1, 1))).toBe(false)
    expect(box.pipe(ConvexPolyhedron.contains(Vector3.make(0, 0, 0)))).toBe(true)
  })

  test('polygons gives branded outward faces', () => {
    const faces = ConvexPolyhedron.polygons(box)
    expect(faces).toHaveLength(6)
    faces.forEach((face, i) => {
      expect(Polygon3d.plane(face).normal).toBeCloseToValue(box.faces[i]!.plane.normal)
      expect(Polygon3d.isConvex(face)).toBe(true)
    })
  })
})

describe('transform', () => {
  const box = value(
    ConvexPolyhedron.fromHalfSpaces(boxPlanes.map((plane, i) => ({ plane, label: `f${i}` }))),
  )

  test('a rigid motion moves vertices and planes together', () => {
    const motion = Affine3d.rotate(Rotation3d.fromAxisAngle(Vector3.unitY, 1.2)).pipe(
      Affine3d.andThen(Affine3d.translate(3, 4, 5)),
    )
    const moved = ConvexPolyhedron.transform(box, motion)
    expect(moved.faces.map((f) => f.label)).toEqual(box.faces.map((f) => f.label))
    moved.faces.forEach((f, i) => expect(f.indices).toBe(box.faces[i]!.indices))
    expectClosed(moved)
  })

  test('a mirror keeps faces wound outward', () => {
    const mirrored = box.pipe(ConvexPolyhedron.transform(Affine3d.scale(-1, 1, 1)))
    expect(mirrored.faces[0]!.indices).toEqual(box.faces[0]!.indices.toReversed())
    expect(mirrored.faces[0]!.plane.normal).toBeCloseToValue(Vector3.make(-1, 0, 0))
    expectClosed(mirrored)
  })

  test('a singular transform throws', () => {
    expect(() => ConvexPolyhedron.transform(box, Affine3d.scale(1, 1, 0))).toThrow()
  })
})
