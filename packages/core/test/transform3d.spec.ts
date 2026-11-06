import { describe, expect, expectTypeOf, test } from 'vitest'
import type { Invertible } from '../src/matrix/matrix3x3.ts'
import * as Matrix4x4 from '../src/matrix/matrix4x4.ts'
import * as Solution from '../src/solution/solution.ts'
import * as Affine2d from '../src/transform/affine2d.ts'
import * as Affine3d from '../src/transform/affine3d.ts'
import type { Decomposition } from '../src/transform/affine3d.ts'
import * as Frame3d from '../src/transform/frame3d.ts'
import * as Rotation3d from '../src/transform/rotation3d.ts'
import * as Vector2 from '../src/vector/vector2.ts'
import * as Vector3 from '../src/vector/vector3.ts'

let seed = 29
const random = () => {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}
const between = (lo: number, hi: number) => lo + (hi - lo) * random()
const randomVector = () => Vector3.make(between(-1, 1), between(-1, 1), between(-1, 1))
const randomRotation = () => Rotation3d.fromAxisAngle(randomVector(), between(-Math.PI, Math.PI))

const expectVector = (actual: Vector3.Vector3, expected: Vector3.Vector3, digits = 12) => {
  expect(actual.x).toBeCloseTo(expected.x, digits)
  expect(actual.y).toBeCloseTo(expected.y, digits)
  expect(actual.z).toBeCloseTo(expected.z, digits)
}

const randomTransform = () =>
  Affine3d.compose({
    translation: Vector3.scale(randomVector(), 10),
    rotation: randomRotation(),
    scale: Vector3.make(between(0.2, 3), between(0.2, 3), between(0.2, 3)),
    shear: { xy: between(-1, 1), xz: between(-1, 1), yz: between(-1, 1) },
  })

describe('Affine2d invertibility ignores translation', () => {
  test('a small scale far from the origin is invertible', () => {
    for (const t of [0, 1e3, 1e6, 1e9]) {
      const a = Affine2d.andThen(Affine2d.scale(1e-3), Affine2d.translate(t, -t))
      expect(Affine2d.isInvertible(a)).toBe(true)
      if (t > 1e6) {
        // Past here doubles can't hold the translated point finely enough to
        // undo a 1e-3 scale (PRECISION.md, extreme translation).
        continue
      }
      const inv = Affine2d.inverse(a)
      if (Solution.isNone(inv)) {
        throw new Error('expected an inverse')
      }
      const p = Vector2.make(0.3, -0.7)
      const back = Affine2d.apply(inv.value, Affine2d.apply(a, p))
      expect(back.x).toBeCloseTo(p.x, 6)
      expect(back.y).toBeCloseTo(p.y, 6)
    }
  })

  test('a flattening transform is still singular wherever it sits', () => {
    const a = Affine2d.andThen(Affine2d.scale(1, 0), Affine2d.translate(5, 5))
    expect(Affine2d.isInvertible(a)).toBe(false)
    expect(Affine2d.inverse(a)).toBe(Solution.none)
    expect(() => Affine2d.inverseUnsafe(a)).toThrow()
  })

  test('inverse matches the general matrix inverse when translation is small', () => {
    const a = Affine2d.andThen(
      Affine2d.andThen(Affine2d.shear(0.3, -0.2), Affine2d.rotate(0.7)),
      Affine2d.translate(2, 3),
    )
    const inv = Affine2d.inverseUnsafe(a)
    expect(Affine2d.equals(Affine2d.andThen(a, inv), Affine2d.identity)).toBe(true)
  })
})

describe('Affine2d directions and normals', () => {
  test('applyDirection ignores translation', () => {
    const a = Affine2d.andThen(Affine2d.scale(2, 3), Affine2d.translate(10, 10))
    const d = Affine2d.applyDirection(a, Vector2.make(1, 1))
    expect([d.x, d.y]).toEqual([2, 3])
  })

  test('applyNormal stays perpendicular under non-uniform scale and keeps its side', () => {
    const a = Affine2d.scale(1, 0.5)
    const edge = Vector2.make(1, -1)
    const normal = Vector2.make(1, 1)
    const n = Affine2d.applyNormal(a, normal)
    expect(Vector2.dot(n, Affine2d.applyDirection(a, edge))).toBeCloseTo(0, 15)
    expect(Vector2.magnitude(n)).toBeCloseTo(1, 15)
    // Under a reflection the normal follows the side its points move to.
    const flipped = Affine2d.applyNormal(Affine2d.reflectX, Vector2.make(0, 1))
    expect(flipped.y).toBeCloseTo(-1, 15)
    expect(() => Affine2d.applyNormal(Affine2d.scale(0, 1), normal)).toThrow()
  })
})

describe('Affine3d constructors', () => {
  test('translate, scale, and identity', () => {
    const p = Vector3.make(1, 2, 3)
    expect(Affine3d.apply(Affine3d.identity, p)).toEqual(p)
    expect(Affine3d.apply(Affine3d.translate(1, -1, 2), p)).toEqual(Vector3.make(2, 1, 5))
    expect(Affine3d.apply(Affine3d.translate(Vector3.one), p)).toEqual(Vector3.make(2, 3, 4))
    expect(Affine3d.apply(Affine3d.scale(2), p)).toEqual(Vector3.make(2, 4, 6))
    expect(Affine3d.apply(Affine3d.scale(1, 2, 3), p)).toEqual(Vector3.make(1, 4, 9))
  })

  test('translate and scale take vectors as well as components', () => {
    const o = Vector3.make(1, 2, 3)
    expect(Affine3d.equals(Affine3d.translate(o), Affine3d.translate(1, 2, 3))).toBe(true)
    expect(Affine3d.equals(Affine3d.scale(Vector3.make(2, 3, 4)), Affine3d.scale(2, 3, 4))).toBe(
      true,
    )
    expect(
      Affine3d.equals(Affine3d.scale(Vector3.make(2, 3, 4), o), Affine3d.scale(2, 3, 4, o)),
    ).toBe(true)
  })

  test('scale tells a uniform factor with an origin from three factors', () => {
    const o = Vector3.make(1, 1, 1)
    const uniform = Affine3d.scale(2, o)
    expect(Affine3d.apply(uniform, o)).toEqual(o)
    expect(Affine3d.apply(uniform, Vector3.make(2, 2, 2))).toEqual(Vector3.make(3, 3, 3))
    expect(Affine3d.equals(Affine3d.scale(Vector3.make(2, 2, 2), o), uniform)).toBe(true)
  })

  test('scale with an origin keeps it fixed', () => {
    const o = Vector3.make(1, 1, 1)
    const a = Affine3d.scale(2, 3, 4, o)
    expect(Affine3d.apply(a, o)).toEqual(o)
    expect(Affine3d.apply(a, Vector3.make(2, 2, 2))).toEqual(Vector3.make(3, 4, 5))
  })

  test('rotate matches Rotation3d.apply', () => {
    const r = randomRotation()
    const p = randomVector()
    expectVector(Affine3d.apply(Affine3d.rotate(r), p), Rotation3d.apply(r, p))
    expectVector(Affine3d.apply(Affine3d.rotate(r.quaternion), p), Rotation3d.apply(r, p))
  })

  test('rotate with an origin example', () => {
    const center = Vector3.make(5, 0, 0)
    const spin = Affine3d.rotate(Rotation3d.aboutZ(Math.PI / 2), center)
    expectVector(Affine3d.apply(spin, center), center, 15)
    expectVector(Affine3d.apply(spin, Vector3.make(6, 0, 0)), Vector3.make(5, 1, 0), 15)
  })

  test('shear adds each named coordinate into the other', () => {
    const a = Affine3d.shear({ xy: 2, zx: -1 })
    expect(Affine3d.apply(a, Vector3.make(1, 1, 1))).toEqual(Vector3.make(3, 1, 0))
  })

  test('shear with an origin keeps it fixed and measures from it', () => {
    const o = Vector3.make(1, 2, 3)
    const a = Affine3d.shear({ xy: 2, zx: -1, yz: 0.5 }, o)
    expect(Affine3d.apply(a, o)).toEqual(o)
    // x gains 2 * (y - 2), y gains 0.5 * (z - 3), z gains -1 * (x - 1).
    expect(Affine3d.apply(a, Vector3.make(2, 3, 5))).toEqual(Vector3.make(4, 4, 4))
    expect(
      Affine3d.equals(Affine3d.shear({ xy: 2 }, Vector3.zero), Affine3d.shear({ xy: 2 })),
    ).toBe(true)
  })

  test('fromMatrix checks the bottom row', () => {
    const m = Affine3d.translate(1, 2, 3).matrix
    expect(Affine3d.equals(Affine3d.fromMatrix(m), Affine3d.translate(1, 2, 3))).toBe(true)
    expect(() =>
      Affine3d.fromMatrix(Matrix4x4.make(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0.5, 1)),
    ).toThrow()
  })

  test('prints its rows', () => {
    expect(String(Affine3d.translate(1, 2, 3))).toBe(
      'Affine3d([1, 0, 0, 1], [0, 1, 0, 2], [0, 0, 1, 3])',
    )
  })
})

describe('Affine3d composition and inversion', () => {
  test('andThen applies the first transform first, data-last too', () => {
    const a = Affine3d.translate(1, 0, 0)
    const b = Affine3d.scale(2)
    const p = Vector3.make(1, 1, 1)
    expect(Affine3d.apply(Affine3d.andThen(a, b), p)).toEqual(Vector3.make(4, 2, 2))
    expect(Affine3d.apply(a.pipe(Affine3d.andThen(b)), p)).toEqual(Vector3.make(4, 2, 2))
  })

  test('inverse undoes the transform', () => {
    for (let k = 0; k < 20; k++) {
      const a = randomTransform()
      const inv = Affine3d.inverse(a)
      if (Solution.isNone(inv)) {
        throw new Error('expected an inverse')
      }
      const p = randomVector()
      expectVector(Affine3d.apply(inv.value, Affine3d.apply(a, p)), p, 10)
    }
  })

  test('invertibility ignores translation, and the brand tightens inverse', () => {
    const far = Affine3d.andThen(Affine3d.scale(1e-3), Affine3d.translate(1e9, 0, 0))
    expect(Affine3d.isInvertible(far)).toBe(true)
    const flat = Affine3d.scale(1, 0, 1)
    expect(Affine3d.isInvertible(flat)).toBe(false)
    expect(Affine3d.inverse(flat)).toBe(Solution.none)
    expect(() => Affine3d.inverseUnsafe(flat)).toThrow()
    expect(() => Affine3d.asInvertible(flat)).toThrow(/not invertible/)
    const branded = Affine3d.asInvertible(Affine3d.scale(2))
    expectTypeOf(Affine3d.inverse(branded)).toEqualTypeOf<
      Solution.One<Affine3d.Affine3d<unknown & Invertible>>
    >()
  })
})

describe('Affine3d directions and normals', () => {
  test('applyDirection ignores translation', () => {
    const a = Affine3d.andThen(Affine3d.scale(1, 2, 3), Affine3d.translate(5, 5, 5))
    expect(Affine3d.applyDirection(a, Vector3.one)).toEqual(Vector3.make(1, 2, 3))
    expect(Affine3d.translation(a)).toEqual(Vector3.make(5, 5, 5))
    expect(Affine3d.apply(Affine3d.linearPart(a), Vector3.one)).toEqual(Vector3.make(1, 2, 3))
    expect(Affine3d.linear(a).m22).toBe(3)
  })

  test('applyNormal example', () => {
    const squash = Affine3d.scale(1, 0.5, 1)
    const normal = Vector3.make(1, 1, 0)
    expectVector(
      Affine3d.applyNormal(squash, normal),
      Vector3.make(1 / Math.sqrt(5), 2 / Math.sqrt(5), 0),
      15,
    )
    expect(Affine3d.applyDirection(squash, normal)).toEqual(Vector3.make(1, 0.5, 0))
  })

  test('applyNormal stays perpendicular to mapped tangents and keeps its side', () => {
    for (let k = 0; k < 20; k++) {
      const a = randomTransform()
      const t1 = randomVector()
      const t2 = randomVector()
      const n = Vector3.cross(t1, t2)
      const mapped = Affine3d.applyNormal(a, n)
      expect(Vector3.dot(mapped, Affine3d.applyDirection(a, t1))).toBeCloseTo(0, 10)
      expect(Vector3.dot(mapped, Affine3d.applyDirection(a, t2))).toBeCloseTo(0, 10)
      expect(Vector3.dot(mapped, Affine3d.applyDirection(a, n))).toBeGreaterThan(0)
    }
    const mirrored = Affine3d.applyNormal(Affine3d.scale(1, 1, -1), Vector3.unitZ)
    expectVector(mirrored, Vector3.make(0, 0, -1), 15)
    expect(() => Affine3d.applyNormal(Affine3d.scale(1, 0, 1), Vector3.unitZ)).toThrow()
  })

  test('applyTo maps arrays', () => {
    const a = Affine3d.translate(0, 1, 0)
    expect([Vector3.zero, Vector3.one].map(Affine3d.applyTo(a))).toEqual([
      Vector3.make(0, 1, 0),
      Vector3.make(1, 2, 1),
    ])
  })
})

describe('Affine3d compose and decompose', () => {
  const expectParts = (actual: Decomposition, expected: Decomposition) => {
    expectVector(actual.translation, expected.translation, 10)
    expect(Rotation3d.equals(actual.rotation, expected.rotation)).toBe(true)
    expectVector(actual.scale, expected.scale, 10)
    for (const key of ['xy', 'xz', 'yz', 'yx', 'zx', 'zy'] as const) {
      expect(actual.shear[key]).toBeCloseTo(expected.shear[key], 10)
    }
  }

  test('decompose example', () => {
    const parts = Affine3d.decompose(
      Affine3d.compose({ rotation: Rotation3d.aboutY(1), scale: Vector3.make(2, 3, 4) }),
    )
    if (Solution.isNone(parts)) {
      throw new Error('expected parts')
    }
    expectVector(parts.value.scale, Vector3.make(2, 3, 4), 14)
    expect(parts.value.shear.xy).toBeCloseTo(0, 14)
  })

  test('compose example', () => {
    const joint = Affine3d.compose({
      translation: Vector3.make(0, 2, 0),
      rotation: Rotation3d.aboutX(0.3),
      scale: 0.5,
    })
    const expected = Affine3d.andThen(
      Affine3d.andThen(Affine3d.scale(0.5), Affine3d.rotate(Rotation3d.aboutX(0.3))),
      Affine3d.translate(0, 2, 0),
    )
    expect(Affine3d.equals(joint, expected)).toBe(true)
  })

  test('decompose recovers the parts compose was given', () => {
    for (let k = 0; k < 30; k++) {
      const parts: Decomposition = {
        translation: Vector3.scale(randomVector(), 10),
        rotation: randomRotation(),
        scale: Vector3.make(between(0.2, 3), between(0.2, 3), between(0.2, 3)),
        shear: { xy: between(-1, 1), xz: between(-1, 1), yz: between(-1, 1), yx: 0, zx: 0, zy: 0 },
      }
      const back = Affine3d.decompose(Affine3d.compose(parts))
      if (Solution.isNone(back)) {
        throw new Error('expected parts')
      }
      expectParts(back.value, parts)
    }
  })

  test('compose rebuilds what decompose split, shear included', () => {
    for (let k = 0; k < 30; k++) {
      // A child rotated inside a non-uniformly scaled parent carries shear.
      const a = Affine3d.andThen(
        Affine3d.andThen(Affine3d.rotate(randomRotation()), Affine3d.scale(1, 3, 0.5)),
        Affine3d.translate(1, 2, 3),
      )
      const parts = Affine3d.decompose(a)
      if (Solution.isNone(parts)) {
        throw new Error('expected parts')
      }
      expect(Affine3d.equals(Affine3d.compose(parts.value), a)).toBe(true)
    }
  })

  test('a mirroring transform gets a negative x scale', () => {
    const a = Affine3d.andThen(Affine3d.scale(1, 1, -2), Affine3d.rotate(Rotation3d.aboutY(0.4)))
    const parts = Affine3d.decompose(a)
    if (Solution.isNone(parts)) {
      throw new Error('expected parts')
    }
    expect(parts.value.scale.x).toBeLessThan(0)
    expect(parts.value.scale.y).toBeGreaterThan(0)
    expect(parts.value.scale.z).toBeGreaterThan(0)
    expect(Affine3d.equals(Affine3d.compose(parts.value), a)).toBe(true)
  })

  test('rigid transforms decompose with unit scale and no shear', () => {
    const r = randomRotation()
    const parts = Affine3d.decompose(
      Affine3d.andThen(Affine3d.rotate(r), Affine3d.translate(3, 4, 5)),
    )
    if (Solution.isNone(parts)) {
      throw new Error('expected parts')
    }
    expectParts(parts.value, {
      translation: Vector3.make(3, 4, 5),
      rotation: r,
      scale: Vector3.one,
      shear: { xy: 0, xz: 0, yz: 0, yx: 0, zx: 0, zy: 0 },
    })
  })

  test('a singular transform has no decomposition, and the brand tightens the type', () => {
    expect(Affine3d.decompose(Affine3d.scale(1, 1, 0))).toBe(Solution.none)
    expectTypeOf(Affine3d.decompose(Affine3d.asInvertible(Affine3d.identity))).toEqualTypeOf<
      Solution.One<Decomposition>
    >()
  })
})

describe('Frame3d', () => {
  const body = Frame3d.make({ up: Vector3.unitY, forward: Vector3.unitZ })
  const camera = Frame3d.make({ up: Vector3.unitY, forward: Vector3.make(0, 0, -1) })

  test('make example: right is cross(forward, up)', () => {
    expectVector(body.right, Vector3.make(-1, 0, 0), 15)
    expectVector(camera.right, Vector3.make(1, 0, 0), 15)
  })

  test('make normalizes, and rejects zero or non-perpendicular directions', () => {
    const f = Frame3d.make({ up: Vector3.make(0, 3, 0), forward: Vector3.make(0, 0, 2) })
    expect(Frame3d.equals(f, body)).toBe(true)
    expect(() => Frame3d.make({ up: Vector3.zero, forward: Vector3.unitZ })).toThrow()
    expect(() => Frame3d.make({ up: Vector3.unitY, forward: Vector3.make(0, 1, 1) })).toThrow()
    expect(Frame3d.isFrame3d(body)).toBe(true)
    expect(String(body)).toBe('Frame3d(up (0, 1, 0), forward (0, 0, 1))')
  })

  test('fromYawPitchRoll example', () => {
    const turned = Frame3d.fromYawPitchRoll(body, { yaw: Math.PI / 2 })
    expectVector(Rotation3d.apply(turned, body.forward), Vector3.make(-1, 0, 0), 15)
  })

  test('each angle turns the named direction toward the other, in any frame', () => {
    const tilted = Frame3d.make({ up: Vector3.make(1, 1, 0), forward: Vector3.make(1, -1, 1) })
    for (const f of [body, camera, tilted]) {
      const quarter = Math.PI / 2
      const yaw = Frame3d.fromYawPitchRoll(f, { yaw: quarter })
      expectVector(Rotation3d.apply(yaw, f.forward), f.right)
      const pitch = Frame3d.fromYawPitchRoll(f, { pitch: quarter })
      expectVector(Rotation3d.apply(pitch, f.forward), f.up)
      const roll = Frame3d.fromYawPitchRoll(f, { roll: quarter })
      expectVector(Rotation3d.apply(roll, f.up), f.right)
    }
  })

  test('the angles apply yaw, then pitch about the moved axes, then roll', () => {
    const angles = { yaw: 0.4, pitch: -0.3, roll: 1.1 }
    const r = Frame3d.fromYawPitchRoll(camera, angles)
    const yaw = Frame3d.fromYawPitchRoll(camera, { yaw: 0.4 })
    // Pitch about the yawed right, roll about the yawed and pitched forward.
    const yawedRight = Rotation3d.apply(yaw, camera.right)
    const pitched = Rotation3d.andThen(yaw, Rotation3d.fromAxisAngle(yawedRight, -0.3))
    const movedForward = Rotation3d.apply(pitched, camera.forward)
    const expected = Rotation3d.andThen(pitched, Rotation3d.fromAxisAngle(movedForward, 1.1))
    expect(Rotation3d.equals(r, expected)).toBe(true)
  })

  test('toYawPitchRoll round-trips, and data-last forms agree', () => {
    for (let k = 0; k < 30; k++) {
      const angles = { yaw: between(-3, 3), pitch: between(-1.5, 1.5), roll: between(-3, 3) }
      for (const f of [body, camera]) {
        const back = Frame3d.toYawPitchRoll(f, Frame3d.fromYawPitchRoll(f, angles))
        expect(back.yaw).toBeCloseTo(angles.yaw, 10)
        expect(back.pitch).toBeCloseTo(angles.pitch, 10)
        expect(back.roll).toBeCloseTo(angles.roll, 10)
      }
    }
    const r = body.pipe(Frame3d.fromYawPitchRoll({ pitch: 0.2 }))
    const back = body.pipe(Frame3d.toYawPitchRoll(r))
    expect(back.yaw).toBe(0)
    expect(back.pitch).toBeCloseTo(0.2, 15)
    expect(back.roll).toBe(0)
  })

  test('looking straight up puts the whole turn in the yaw', () => {
    const r = Frame3d.fromYawPitchRoll(body, { yaw: 0.3, pitch: Math.PI / 2, roll: 0.5 })
    const angles = Frame3d.toYawPitchRoll(body, r)
    expect(angles.roll).toBe(0)
    expect(Rotation3d.equals(Frame3d.fromYawPitchRoll(body, angles), r)).toBe(true)
  })

  test('lookRotation example', () => {
    const r = Frame3d.lookRotation(camera, Vector3.make(1, 0, 0))
    expectVector(Rotation3d.apply(r, camera.forward), Vector3.unitX, 15)
    expectVector(Rotation3d.apply(r, camera.up), Vector3.unitY, 15)
  })

  test('lookRotation faces the direction, keeps up nearest the hint, never rolls', () => {
    for (let k = 0; k < 30; k++) {
      const direction = randomVector()
      const hint = randomVector()
      for (const f of [body, camera]) {
        const r = Frame3d.lookRotation(f, direction, hint)
        expectVector(Rotation3d.apply(r, f.forward), Vector3.normalize(direction))
        const up = Rotation3d.apply(r, f.up)
        // The new up lies in the plane of the hint and the direction, on the hint's side.
        expect(Vector3.dot(up, Vector3.cross(direction, hint))).toBeCloseTo(0, 12)
        expect(Vector3.dot(up, hint)).toBeGreaterThan(0)
      }
    }
  })

  test('lookRotation straight along the hint falls back to the shortest turn', () => {
    const r = Frame3d.lookRotation(camera, Vector3.unitY)
    expect(Rotation3d.equals(r, Rotation3d.between(camera.forward, Vector3.unitY))).toBe(true)
    expect(() => Frame3d.lookRotation(camera, Vector3.zero)).toThrow()
  })
})

describe('isMirror', () => {
  test('odd numbers of reflections mirror, rotations and singular maps do not', () => {
    expect(Affine3d.isMirror(Affine3d.scale(-1, 1, 1))).toBe(true)
    expect(Affine3d.isMirror(Affine3d.scale(-1, -1, -1))).toBe(true)
    expect(Affine3d.isMirror(Affine3d.scale(-1, -1, 1))).toBe(false)
    expect(Affine3d.isMirror(Affine3d.identity)).toBe(false)
    expect(Affine3d.isMirror(Affine3d.scale(-1, 0, 1))).toBe(false)
    const turn = Affine3d.rotate(Rotation3d.fromAxisAngle(Vector3.make(1, 2, 3), 0.8))
    expect(Affine3d.isMirror(turn)).toBe(false)
    // Translation doesn't matter.
    expect(
      Affine3d.isMirror(
        Affine3d.scale(1, 1, -2).pipe(Affine3d.andThen(Affine3d.translate(5, 0, 0))),
      ),
    ).toBe(true)

    expect(Affine2d.isMirror(Affine2d.scale(-1, 1))).toBe(true)
    expect(Affine2d.isMirror(Affine2d.scale(-1, -1))).toBe(false)
    expect(Affine2d.isMirror(Affine2d.scale(0, -1))).toBe(false)
  })

  test('a mirror flips cross products', () => {
    const m = Affine3d.scale(1, -3, 2)
    const c = Vector3.cross(
      Affine3d.applyDirection(m, Vector3.unitX),
      Affine3d.applyDirection(m, Vector3.unitY),
    )
    expect(Affine3d.isMirror(m)).toBe(true)
    expect(Vector3.dot(c, Affine3d.applyDirection(m, Vector3.unitZ))).toBeLessThan(0)
  })
})
