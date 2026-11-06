import { describe, expect, test } from 'vitest'
import * as Plane3d from '../src/plane/plane3d.ts'
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

describe('construction', () => {
  test('make example: normalizes the normal and scales the offset with it', () => {
    const p = Plane3d.make(Vector3.make(0, 2, 0), 6)
    expect(p.normal).toEqual(Vector3.unitY)
    expect(p.offset).toBe(3)
    expect(String(p)).toBe('Plane3d(normal (0, 1, 0), offset 3)')
  })

  test('fromPointNormal passes through the point', () => {
    const point = Vector3.make(1, 2, 3)
    const p = Plane3d.fromPointNormal(point, Vector3.make(1, 1, 1))
    expect(Plane3d.signedDistance(p, point)).toBeCloseTo(0, 14)
    expect(Vector3.magnitude(p.normal)).toBeCloseTo(1, 15)
  })

  test('through example: counterclockwise from the front', () => {
    const p = value(Plane3d.through(Vector3.zero, Vector3.unitX, Vector3.unitY))
    expect(p.normal).toEqual(Vector3.unitZ)
    expect(p.offset).toBe(0)
    const back = value(Plane3d.through(Vector3.zero, Vector3.unitY, Vector3.unitX))
    expect(back.normal).toBeCloseToValue(Vector3.make(0, 0, -1))
  })

  test('through rejects collinear points, also far from the origin', () => {
    expect(Plane3d.through(Vector3.zero, Vector3.unitX, Vector3.make(2, 0, 0))).toBe(Solution.none)
    const far = Vector3.make(1e9, 1e9, 1e9)
    const along = (t: number) => Vector3.add(far, Vector3.make(t, 2 * t, 3 * t))
    expect(Plane3d.through(along(0), along(1), along(2.5))).toBe(Solution.none)
    // A small but real triangle far out is still a plane.
    expect(
      Solution.isSome(
        Plane3d.through(far, Vector3.add(far, Vector3.unitX), Vector3.add(far, Vector3.unitY)),
      ),
    ).toBe(true)
  })

  test('invalid input throws', () => {
    expect(() => Plane3d.make(Vector3.zero, 1)).toThrow()
    expect(() => Plane3d.make(Vector3.unitX, Number.NaN)).toThrow()
    expect(() =>
      Plane3d.fromPointNormal(Vector3.make(Number.POSITIVE_INFINITY, 0, 0), Vector3.unitX),
    ).toThrow()
    expect(() =>
      Plane3d.through(Vector3.zero, Vector3.unitX, Vector3.make(0, Number.NaN, 0)),
    ).toThrow()
  })
})

describe('measures and moves', () => {
  const ground = Plane3d.make(Vector3.unitY, 2)

  test('signedDistance is positive in front, data-last too', () => {
    expect(Plane3d.signedDistance(ground, Vector3.make(5, 7, -1))).toBe(5)
    expect(Plane3d.signedDistance(ground, Vector3.make(0, 0, 0))).toBe(-2)
    expect(ground.pipe(Plane3d.signedDistance(Vector3.make(0, 3, 0)))).toBe(1)
  })

  test('closestPoint drops a point onto the plane', () => {
    expect(Plane3d.closestPoint(ground, Vector3.make(4, 9, -3))).toEqual(Vector3.make(4, 2, -3))
  })

  test('flip swaps sides without moving the plane', () => {
    const flipped = Plane3d.flip(ground)
    const p = Vector3.make(1, 5, 1)
    expect(Plane3d.signedDistance(flipped, p)).toBe(-Plane3d.signedDistance(ground, p))
    expect(Plane3d.equals(flipped, ground)).toBe(false)
    expect(Plane3d.equals(Plane3d.flip(flipped), ground)).toBe(true)
    expect(Object.is(Plane3d.flip(Plane3d.make(Vector3.unitY, 0)).normal.x, 0)).toBe(true)
  })

  test('shift moves along the normal', () => {
    expect(Plane3d.shift(ground, 1.5).offset).toBe(3.5)
    const faces = [ground, Plane3d.flip(ground)]
    expect(faces.map(Plane3d.shift(-0.5)).map((p) => p.offset)).toEqual([1.5, -2.5])
    expect(() => Plane3d.shift(ground, Number.NaN)).toThrow()
  })
})

describe('transform', () => {
  const tilted = Plane3d.fromPointNormal(Vector3.make(1, 2, 3), Vector3.make(1, -2, 0.5))
  const onPlane = [Vector3.make(1, 2, 3), Plane3d.closestPoint(tilted, Vector3.make(-4, 0, 7))]
  const front = Vector3.add(Vector3.make(1, 2, 3), tilted.normal)

  test.each([
    [
      'rigid',
      Affine3d.rotate(Rotation3d.fromAxisAngle(Vector3.make(1, 1, 0), 0.7)).pipe(
        Affine3d.andThen(Affine3d.translate(3, -1, 2)),
      ),
    ],
    [
      'non-uniform scale and shear',
      Affine3d.compose({
        scale: Vector3.make(2, 0.5, 3),
        shear: { xy: 0.4 },
        translation: Vector3.make(1, 1, 1),
      }),
    ],
    ['mirror', Affine3d.scale(-1, 1, 1).pipe(Affine3d.andThen(Affine3d.translate(0, 5, 0)))],
  ])('%s: points stay on the plane and the front stays in front', (_, a) => {
    const image = Plane3d.transform(tilted, a)
    for (const p of onPlane) {
      expect(Plane3d.signedDistance(image, Affine3d.apply(a, p))).toBeCloseTo(0, 12)
    }
    expect(Plane3d.signedDistance(image, Affine3d.apply(a, front))).toBeGreaterThan(0)
    expect(Vector3.magnitude(image.normal)).toBeCloseTo(1, 15)
  })

  test('a singular transform throws', () => {
    expect(() => Plane3d.transform(tilted, Affine3d.scale(1, 0, 1))).toThrow()
  })
})

describe('intersections', () => {
  test('intersection example: three axis planes', () => {
    const corner = Plane3d.intersection(
      Plane3d.make(Vector3.unitX, 1),
      Plane3d.make(Vector3.unitY, 2),
      Plane3d.make(Vector3.unitZ, 3),
    )
    expect(value(corner)).toEqual(Vector3.make(1, 2, 3))
  })

  test('intersection of tilted planes lies on all three', () => {
    const planes = [
      Plane3d.make(Vector3.make(1, 1, 0), 2),
      Plane3d.make(Vector3.make(0, 1, 1), -1),
      Plane3d.make(Vector3.make(1, -0.5, 2), 4),
    ] as const
    const p = value(Plane3d.intersection(...planes))
    for (const plane of planes) {
      expect(Plane3d.signedDistance(plane, p)).toBeCloseTo(0, 12)
    }
  })

  test('parallel planes or a shared line meet in no single point', () => {
    const x0 = Plane3d.make(Vector3.unitX, 0)
    const x1 = Plane3d.make(Vector3.unitX, 1)
    expect(Plane3d.intersection(x0, x1, Plane3d.make(Vector3.unitY, 0))).toBe(Solution.none)
    // Three planes through the z axis.
    expect(
      Plane3d.intersection(
        x0,
        Plane3d.make(Vector3.unitY, 0),
        Plane3d.make(Vector3.make(1, 1, 0), 0),
      ),
    ).toBe(Solution.none)
  })

  test('intersectRay example, and rays that miss', () => {
    const ground = Plane3d.make(Vector3.unitY, 0)
    const hit = Plane3d.intersectRay(ground, Vector3.make(0, 5, 0), Vector3.make(1, -1, 0))
    expect(value(hit)).toBeCloseToValue(Vector3.make(5, 0, 0))
    expect(Plane3d.intersectRay(ground, Vector3.make(0, 5, 0), Vector3.unitY)).toBe(Solution.none)
    expect(Plane3d.intersectRay(ground, Vector3.make(0, 5, 0), Vector3.unitX)).toBe(Solution.none)
    // From below, pointing up, hits from the back.
    expect(value(Plane3d.intersectRay(ground, Vector3.make(1, -2, 0), Vector3.unitY))).toEqual(
      Vector3.make(1, 0, 0),
    )
  })

  test('a ray starting on the plane meets it at its origin, either way it points', () => {
    const ground = Plane3d.make(Vector3.unitY, 0)
    const start = Vector3.make(3, 1e-13, 4)
    expect(value(Plane3d.intersectRay(ground, start, Vector3.unitY))).toBe(start)
    expect(value(ground.pipe(Plane3d.intersectRay(start, Vector3.unitX)))).toBe(start)
    expect(() => Plane3d.intersectRay(ground, start, Vector3.zero)).toThrow()
  })
})
