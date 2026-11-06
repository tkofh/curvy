import { describe, expect, expectTypeOf, test } from 'vitest'
import * as Matrix3x3 from '../src/matrix/matrix3x3.ts'
import * as Quaternion from '../src/quaternion/quaternion.ts'
import type { Unit } from '../src/quaternion/quaternion.ts'
import * as Solution from '../src/solution/solution.ts'
import type { EulerOrder } from '../src/transform/rotation3d.ts'
import * as Rotation3d from '../src/transform/rotation3d.ts'
import * as Vector3 from '../src/vector/vector3.ts'

let seed = 11
const random = () => {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}
const randomVector = () => Vector3.make(random() * 2 - 1, random() * 2 - 1, random() * 2 - 1)
const randomRotation = () => Rotation3d.fromAxisAngle(randomVector(), (random() * 2 - 1) * Math.PI)
const samples = Array.from({ length: 50 }, randomRotation)

const ORDERS: ReadonlyArray<EulerOrder> = ['XYZ', 'XZY', 'YXZ', 'YZX', 'ZXY', 'ZYX']

const expectVector = (actual: Vector3.Vector3, expected: Vector3.Vector3, digits = 12) => {
  expect(actual.x).toBeCloseTo(expected.x, digits)
  expect(actual.y).toBeCloseTo(expected.y, digits)
  expect(actual.z).toBeCloseTo(expected.z, digits)
}

describe('Quaternion', () => {
  test('multiply follows Hamilton: i * j = k, j * i = -k', () => {
    const i = Quaternion.make(1, 0, 0, 0)
    const j = Quaternion.make(0, 1, 0, 0)
    expect(Quaternion.equals(Quaternion.multiply(i, j), Quaternion.make(0, 0, 1, 0))).toBe(true)
    expect(Quaternion.equals(Quaternion.multiply(j, i), Quaternion.make(0, 0, -1, 0))).toBe(true)
    expect(String(Quaternion.multiply(i, j))).toBe('Quaternion(0, 0, 1, 0)')
  })

  test('multiply keeps the Unit brand only when both factors carry it', () => {
    const u = Quaternion.identity
    expectTypeOf(Quaternion.multiply(u, u)).toEqualTypeOf<Quaternion.Quaternion<Unit>>()
    expectTypeOf(u.pipe(Quaternion.multiply(u))).toEqualTypeOf<Quaternion.Quaternion<Unit>>()
    expectTypeOf(
      Quaternion.multiply(Quaternion.make(1, 2, 3, 4), u),
    ).toEqualTypeOf<Quaternion.Quaternion>()
  })

  test('normalize example', () => {
    const q = Quaternion.normalize(Quaternion.make(0, 0, 2, 2))
    expect(Solution.isSome(q)).toBe(true)
    if (Solution.isNone(q)) {
      return
    }
    expect(q.value.z).toBe(0.7071067811865475)
    expect(q.value.w).toBe(0.7071067811865475)
    const { axis, angle } = Rotation3d.toAxisAngle(q.value)
    expectVector(axis, Vector3.unitZ)
    expect(angle).toBeCloseTo(Math.PI / 2, 15)
  })

  test('normalize and inverse reject zero', () => {
    expect(Quaternion.normalize(Quaternion.make(0, 0, 0, 0))).toBe(Solution.none)
    expect(Quaternion.inverse(Quaternion.make(0, 0, 0, 0))).toBe(Solution.none)
  })

  test('inverse undoes multiply, and is One for unit quaternions', () => {
    const q = Quaternion.make(1, -2, 0.5, 3)
    const inv = Quaternion.inverse(q)
    if (Solution.isNone(inv)) {
      throw new Error('expected an inverse')
    }
    expect(Quaternion.equals(Quaternion.multiply(q, inv.value), Quaternion.identity)).toBe(true)
    expectTypeOf(Quaternion.inverse(Quaternion.identity)).toEqualTypeOf<
      Solution.One<Quaternion.Quaternion<Unit>>
    >()
  })

  test('isUnit and asUnit', () => {
    expect(Quaternion.isUnit(Quaternion.make(0, 0, 0.6, 0.8))).toBe(true)
    expect(Quaternion.isUnit(Quaternion.make(0, 0, 0.6, 0.81))).toBe(false)
    expect(() => Quaternion.asUnit(Quaternion.make(1, 1, 0, 0))).toThrow()
    // Long chains of products stay inside the band.
    let p = Quaternion.identity
    for (let k = 0; k < 10_000; k++) {
      p = Quaternion.multiply(p, samples[k % samples.length]!.quaternion)
    }
    expect(Quaternion.isUnit(p)).toBe(true)
  })

  test('conjugate and dot', () => {
    const q = Quaternion.make(1, 2, 3, 4)
    expect(Quaternion.equals(Quaternion.conjugate(q), Quaternion.make(-1, -2, -3, 4))).toBe(true)
    expect(Quaternion.dot(q, q)).toBe(30)
    expect(Quaternion.magnitude(q)).toBeCloseTo(Math.sqrt(30), 15)
  })
})

describe('Rotation3d construction', () => {
  test('fromAxisAngle example', () => {
    const quarter = Rotation3d.fromAxisAngle(Vector3.unitZ, Math.PI / 2)
    expectVector(Rotation3d.apply(quarter, Vector3.unitX), Vector3.unitY, 15)
  })

  test('axis rotations follow the right-hand rule and match Affine2d in the plane', () => {
    expectVector(Rotation3d.apply(Rotation3d.aboutX(Math.PI / 2), Vector3.unitY), Vector3.unitZ, 15)
    expectVector(Rotation3d.apply(Rotation3d.aboutY(Math.PI / 2), Vector3.unitZ), Vector3.unitX, 15)
    expectVector(Rotation3d.apply(Rotation3d.aboutZ(Math.PI / 2), Vector3.unitX), Vector3.unitY, 15)
    for (const [axis, about] of [
      [Vector3.unitX, Rotation3d.aboutX],
      [Vector3.unitY, Rotation3d.aboutY],
      [Vector3.unitZ, Rotation3d.aboutZ],
    ] as const) {
      expect(Rotation3d.equals(about(0.7), Rotation3d.fromAxisAngle(axis, 0.7))).toBe(true)
    }
  })

  test('fromAxisAngle rejects a zero axis and a non-finite angle', () => {
    expect(() => Rotation3d.fromAxisAngle(Vector3.zero, 1)).toThrow()
    expect(() => Rotation3d.fromAxisAngle(Vector3.unitX, Number.NaN)).toThrow()
  })

  test('between example', () => {
    const r = Rotation3d.between(Vector3.unitX, Vector3.make(0, 3, 0))
    const { axis, angle } = Rotation3d.toAxisAngle(r)
    expectVector(axis, Vector3.unitZ)
    expect(angle).toBeCloseTo(Math.PI / 2, 15)
  })

  test('between turns from onto to, including opposite and equal directions', () => {
    for (let k = 0; k < 50; k++) {
      const u = randomVector()
      const v = randomVector()
      const turned = Rotation3d.apply(Rotation3d.between(u, v), Vector3.normalize(u))
      expectVector(turned, Vector3.normalize(v))
    }
    const u = Vector3.make(0.3, -0.4, 0.5)
    expectVector(
      Rotation3d.apply(Rotation3d.between(u, Vector3.scale(u, -2)), u),
      Vector3.scale(u, -1),
    )
    expect(Rotation3d.equals(Rotation3d.between(u, u), Rotation3d.identity)).toBe(true)
    expectVector(
      Rotation3d.apply(Rotation3d.between(Vector3.unitX, Vector3.make(-1, 0, 0)), Vector3.unitX),
      Vector3.make(-1, 0, 0),
    )
    expect(() => Rotation3d.between(Vector3.zero, u)).toThrow()
  })

  test('fromQuaternion wraps without copying, and operations accept the quaternion', () => {
    const q = Rotation3d.aboutY(0.4).quaternion
    expect(Rotation3d.fromQuaternion(q).quaternion).toBe(q)
    expect(Rotation3d.isRotation3d(q)).toBe(false)
    expectVector(
      Rotation3d.apply(q, Vector3.unitZ),
      Rotation3d.apply(Rotation3d.aboutY(0.4), Vector3.unitZ),
    )
    expect(Rotation3d.equals(q, Rotation3d.aboutY(0.4))).toBe(true)
  })

  test('prints its quaternion', () => {
    expect(String(Rotation3d.identity)).toBe('Rotation3d(0, 0, 0, 1)')
  })
})

describe('Rotation3d matrices and axis-angle', () => {
  test('toMatrix3x3 agrees with apply', () => {
    for (const r of samples) {
      const v = randomVector()
      expectVector(
        Matrix3x3.vectorProductLeft(Rotation3d.toMatrix3x3(r), v),
        Rotation3d.apply(r, v),
      )
    }
  })

  test('fromMatrix3x3 round-trips through every Shepperd branch', () => {
    const cases = [
      ...samples,
      Rotation3d.aboutX(Math.PI),
      Rotation3d.aboutY(Math.PI),
      Rotation3d.aboutZ(Math.PI),
      Rotation3d.fromAxisAngle(Vector3.make(1, 1, 0), 3),
    ]
    for (const r of cases) {
      const back = Rotation3d.fromMatrix3x3(Rotation3d.toMatrix3x3(r))
      expect(Solution.isSome(back) && Rotation3d.equals(back.value, r)).toBe(true)
    }
  })

  test('fromMatrix3x3 rejects scale, shear, and reflection', () => {
    expect(Rotation3d.fromMatrix3x3(Matrix3x3.make(2, 0, 0, 0, 1, 0, 0, 0, 1))).toBe(Solution.none)
    expect(Rotation3d.fromMatrix3x3(Matrix3x3.make(1, 0.5, 0, 0, 1, 0, 0, 0, 1))).toBe(
      Solution.none,
    )
    expect(Rotation3d.fromMatrix3x3(Matrix3x3.make(-1, 0, 0, 0, 1, 0, 0, 0, 1))).toBe(Solution.none)
  })

  test('toAxisAngle gives angles in [0, pi] and round-trips', () => {
    const negative = Rotation3d.toAxisAngle(Rotation3d.aboutZ(-Math.PI / 2))
    expectVector(negative.axis, Vector3.make(0, 0, -1))
    expect(negative.angle).toBeCloseTo(Math.PI / 2, 15)
    for (const r of samples) {
      const { axis, angle } = Rotation3d.toAxisAngle(r)
      expect(angle).toBeGreaterThanOrEqual(0)
      expect(angle).toBeLessThanOrEqual(Math.PI)
      expect(Rotation3d.equals(Rotation3d.fromAxisAngle(axis, angle), r)).toBe(true)
    }
    expect(Rotation3d.toAxisAngle(Rotation3d.identity)).toEqual({ axis: Vector3.unitX, angle: 0 })
  })
})

describe('Rotation3d Euler angles', () => {
  test('fromEuler example', () => {
    const r = Rotation3d.fromEuler(Vector3.make(Math.PI / 6, Math.PI / 4, 0), 'YXZ')
    expect(
      Rotation3d.equals(
        r,
        Rotation3d.andThen(Rotation3d.aboutX(Math.PI / 6), Rotation3d.aboutY(Math.PI / 4)),
      ),
    ).toBe(true)
  })

  test('the order names the matrix product left to right', () => {
    const angles = Vector3.make(0.3, -0.5, 1.1)
    const factor = {
      X: Rotation3d.aboutX(0.3),
      Y: Rotation3d.aboutY(-0.5),
      Z: Rotation3d.aboutZ(1.1),
    }
    for (const order of ORDERS) {
      const [a, b, c] = [...order] as unknown as readonly [
        'X' | 'Y' | 'Z',
        'X' | 'Y' | 'Z',
        'X' | 'Y' | 'Z',
      ]
      const product = Matrix3x3.multiply(
        Matrix3x3.multiply(Rotation3d.toMatrix3x3(factor[a]), Rotation3d.toMatrix3x3(factor[b])),
        Rotation3d.toMatrix3x3(factor[c]),
      )
      expect(
        Matrix3x3.equals(Rotation3d.toMatrix3x3(Rotation3d.fromEuler(angles, order)), product),
      ).toBe(true)
    }
  })

  test('defaults to XYZ', () => {
    const angles = Vector3.make(0.2, 0.4, 0.6)
    expect(
      Rotation3d.equals(Rotation3d.fromEuler(angles), Rotation3d.fromEuler(angles, 'XYZ')),
    ).toBe(true)
  })

  test('toEuler round-trips in every order', () => {
    for (const order of ORDERS) {
      for (const r of samples) {
        expect(
          Rotation3d.equals(Rotation3d.fromEuler(Rotation3d.toEuler(r, order), order), r),
        ).toBe(true)
      }
    }
  })

  test('toEuler recovers angles inside the principal ranges', () => {
    for (const order of ORDERS) {
      const angles = Vector3.make(0.3, -0.5, 1.1)
      expectVector(Rotation3d.toEuler(Rotation3d.fromEuler(angles, order), order), angles)
    }
  })

  test('toEuler at gimbal lock puts the whole turn in the first angle', () => {
    for (const order of ORDERS) {
      const middle = order[1] as 'X' | 'Y' | 'Z'
      for (const sign of [1, -1]) {
        const raw = { X: 0.4, Y: 0.4, Z: 0.4 }
        raw[middle] = (sign * Math.PI) / 2
        const r = Rotation3d.fromEuler(Vector3.make(raw.X, raw.Y, raw.Z), order)
        const angles = Rotation3d.toEuler(r, order)
        const last = order[2] as 'X' | 'Y' | 'Z'
        expect({ X: angles.x, Y: angles.y, Z: angles.z }[last]).toBe(0)
        expect(Rotation3d.equals(Rotation3d.fromEuler(angles, order), r)).toBe(true)
      }
    }
  })

  test('an unknown order throws', () => {
    expect(() => Rotation3d.fromEuler(Vector3.zero, 'XXY' as EulerOrder)).toThrow()
  })
})

describe('Rotation3d composition', () => {
  test('andThen example', () => {
    const r = Rotation3d.andThen(Rotation3d.aboutZ(Math.PI / 2), Rotation3d.aboutX(Math.PI / 2))
    expectVector(Rotation3d.apply(r, Vector3.unitX), Vector3.unitZ, 15)
  })

  test('andThen applies the first argument first, data-last too', () => {
    for (let k = 0; k < 20; k++) {
      const a = samples[k]!
      const b = samples[k + 1]!
      const v = randomVector()
      const expected = Rotation3d.apply(b, Rotation3d.apply(a, v))
      expectVector(Rotation3d.apply(Rotation3d.andThen(a, b), v), expected)
      expectVector(Rotation3d.apply(a.pipe(Rotation3d.andThen(b)), v), expected)
    }
  })

  test('inverse undoes the rotation', () => {
    for (const r of samples) {
      expect(
        Rotation3d.equals(Rotation3d.andThen(r, Rotation3d.inverse(r)), Rotation3d.identity),
      ).toBe(true)
    }
  })

  test('apply preserves length, and applyTo maps arrays', () => {
    const vs = [randomVector(), randomVector()]
    const r = samples[0]!
    const mapped = vs.map(Rotation3d.applyTo(r))
    mapped.forEach((v, k) => {
      expect(Vector3.magnitude(v)).toBeCloseTo(Vector3.magnitude(vs[k]!), 14)
      expectVector(v, Rotation3d.apply(r, vs[k]!))
    })
  })

  test('equals treats q and -q as the same rotation', () => {
    const q = Rotation3d.aboutX(1).quaternion
    const negated = Quaternion.asUnit(Quaternion.make(-q.x, -q.y, -q.z, -q.w))
    expect(Rotation3d.equals(q, negated)).toBe(true)
    expect(Quaternion.equals(q, negated)).toBe(false)
    expect(Rotation3d.equals(Rotation3d.aboutX(1), Rotation3d.aboutX(1.001))).toBe(false)
  })
})

describe('Rotation3d interpolation', () => {
  test('slerp example', () => {
    const halfway = Rotation3d.slerp(Rotation3d.identity, Rotation3d.aboutZ(Math.PI / 2), 0.5)
    expect(Rotation3d.equals(halfway, Rotation3d.aboutZ(Math.PI / 4))).toBe(true)
  })

  test('slerp hits its endpoints and moves at constant angular speed', () => {
    for (let k = 0; k < 20; k++) {
      const a = samples[k]!
      const b = samples[k + 20]!
      const total = Rotation3d.angleBetween(a, b)
      expect(Rotation3d.equals(Rotation3d.slerp(a, b, 0), a)).toBe(true)
      expect(Rotation3d.equals(Rotation3d.slerp(a, b, 1), b)).toBe(true)
      for (const t of [0.25, 0.5, 0.9]) {
        const at = Rotation3d.slerp(a, b, t)
        expect(Rotation3d.angleBetween(a, at)).toBeCloseTo(t * total, 12)
        expect(Rotation3d.angleBetween(at, b)).toBeCloseTo((1 - t) * total, 12)
      }
    }
  })

  test('slerp takes the short way when the quaternions are in opposite hemispheres', () => {
    const a = Rotation3d.aboutZ(0.1)
    const q = Rotation3d.aboutZ(0.3).quaternion
    const far = Quaternion.asUnit(Quaternion.make(-q.x, -q.y, -q.z, -q.w))
    expect(Rotation3d.equals(Rotation3d.slerp(a, far, 0.5), Rotation3d.aboutZ(0.2))).toBe(true)
    expect(Rotation3d.equals(Rotation3d.nlerp(a, far, 0.5), Rotation3d.aboutZ(0.2))).toBe(true)
  })

  test('slerp between equal rotations returns the rotation', () => {
    const r = samples[3]!
    expect(Rotation3d.slerp(r, r, 0.4)).toBe(r)
  })

  test('nlerp shares endpoints and midpoint with slerp', () => {
    const a = samples[1]!
    const b = samples[2]!
    for (const t of [0, 0.5, 1]) {
      expect(Rotation3d.equals(Rotation3d.nlerp(a, b, t), Rotation3d.slerp(a, b, t))).toBe(true)
    }
    expect(Rotation3d.equals(a.pipe(Rotation3d.nlerp(b, 0.5)), Rotation3d.nlerp(a, b, 0.5))).toBe(
      true,
    )
  })

  test('angleBetween is the angle of the relative rotation', () => {
    expect(Rotation3d.angleBetween(Rotation3d.aboutY(0.2), Rotation3d.aboutY(-0.5))).toBeCloseTo(
      0.7,
      14,
    )
    expect(
      Rotation3d.angleBetween(Rotation3d.identity, Rotation3d.aboutX(1.9 * Math.PI)),
    ).toBeCloseTo(0.1 * Math.PI, 12)
  })
})

describe('Rotation3d swing-twist', () => {
  test('swingTwist example', () => {
    const spin = Rotation3d.aboutZ(0.3)
    const tilt = Rotation3d.aboutX(-0.2)
    const { swing, twist } = Rotation3d.swingTwist(Rotation3d.andThen(spin, tilt), Vector3.unitZ)
    expect(Rotation3d.equals(twist, spin)).toBe(true)
    expect(Rotation3d.equals(swing, tilt)).toBe(true)
  })

  test('twist is about the axis, swing is perpendicular, and they recompose', () => {
    for (const r of samples) {
      const axis = randomVector()
      const n = Vector3.normalize(axis)
      const { swing, twist } = Rotation3d.swingTwist(r, axis)
      expect(Rotation3d.equals(Rotation3d.andThen(twist, swing), r)).toBe(true)
      const t = twist.quaternion
      expect(Vector3.magnitude(Vector3.cross(Vector3.make(t.x, t.y, t.z), n))).toBeLessThan(1e-12)
      const s = swing.quaternion
      expect(Math.abs(Vector3.dot(Vector3.make(s.x, s.y, s.z), n))).toBeLessThan(1e-12)
      // The swing alone carries the axis where the whole rotation does.
      expectVector(Rotation3d.apply(swing, n), Rotation3d.apply(r, n))
    }
  })

  test('a half turn perpendicular to the axis has no twist', () => {
    const r = Rotation3d.aboutX(Math.PI)
    const { swing, twist } = Rotation3d.swingTwist(r, Vector3.unitZ)
    expect(twist).toBe(Rotation3d.identity)
    expect(Rotation3d.equals(swing, r)).toBe(true)
    expect(() => Rotation3d.swingTwist(r, Vector3.zero)).toThrow()
  })
})
