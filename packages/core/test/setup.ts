import { expect } from 'vitest'
import * as Interval from '../src/interval'
import * as Matrix2x2 from '../src/matrix/matrix2x2'
import * as Matrix3x3 from '../src/matrix/matrix3x3'
import * as Matrix4x4 from '../src/matrix/matrix4x4'
import * as CubicPolynomial from '../src/polynomial/cubic'
import { epsEquals } from '../src/utils'
import * as LinearPolynomial from '../src/polynomial/linear'
import * as QuadraticPolynomial from '../src/polynomial/quadratic'
import * as Vector2 from '../src/vector/vector2'
import * as Vector3 from '../src/vector/vector3'
import * as Vector4 from '../src/vector/vector4'

type Guard<T> = (v: unknown) => v is T
type Eq<T> = (a: T, b: T, eps?: number) => boolean

const fieldsEq =
  <T>(fields: ReadonlyArray<keyof T>): Eq<T> =>
  (a, b, eps) =>
    fields.every((f) => epsEquals(a[f] as number, b[f] as number, eps))

const intervalEq: Eq<Interval.Interval> = (a, b, eps) =>
  a.kind === b.kind && epsEquals(a.start, b.start, eps) && epsEquals(a.end, b.end, eps)

// biome-ignore lint/suspicious/noExplicitAny: heterogeneous dispatch table
const dispatchers: ReadonlyArray<readonly [Guard<any>, Eq<any>, string]> = [
  [Vector2.isVector2, fieldsEq<Vector2.Vector2>(['x', 'y']), 'Vector2'],
  [Vector3.isVector3, fieldsEq<Vector3.Vector3>(['x', 'y', 'z']), 'Vector3'],
  [Vector4.isVector4, fieldsEq<Vector4.Vector4>(['x', 'y', 'z', 'w']), 'Vector4'],
  [Matrix2x2.isMatrix2x2, fieldsEq<Matrix2x2.Matrix2x2>(['m00', 'm01', 'm10', 'm11']), 'Matrix2x2'],
  [
    Matrix3x3.isMatrix3x3,
    fieldsEq<Matrix3x3.Matrix3x3>(['m00', 'm01', 'm02', 'm10', 'm11', 'm12', 'm20', 'm21', 'm22']),
    'Matrix3x3',
  ],
  [
    Matrix4x4.isMatrix4x4,
    fieldsEq<Matrix4x4.Matrix4x4>([
      'm00',
      'm01',
      'm02',
      'm03',
      'm10',
      'm11',
      'm12',
      'm13',
      'm20',
      'm21',
      'm22',
      'm23',
      'm30',
      'm31',
      'm32',
      'm33',
    ]),
    'Matrix4x4',
  ],
  [
    LinearPolynomial.isLinearPolynomial,
    fieldsEq<LinearPolynomial.LinearPolynomial>(['c0', 'c1']),
    'LinearPolynomial',
  ],
  [
    QuadraticPolynomial.isQuadraticPolynomial,
    fieldsEq<QuadraticPolynomial.QuadraticPolynomial>(['c0', 'c1', 'c2']),
    'QuadraticPolynomial',
  ],
  [
    CubicPolynomial.isCubicPolynomial,
    fieldsEq<CubicPolynomial.CubicPolynomial>(['c0', 'c1', 'c2', 'c3']),
    'CubicPolynomial',
  ],
  [Interval.isInterval, intervalEq, 'Interval'],
]

expect.extend({
  toBeCloseToValue(received: unknown, expected: unknown, eps?: number) {
    for (const [guard, equals, name] of dispatchers) {
      if (guard(received)) {
        if (!guard(expected)) {
          return {
            pass: false,
            message: () => `expected ${name} but received ${typeof expected}`,
          }
        }
        const pass = equals(received, expected, eps)
        return {
          pass,
          message: () =>
            pass
              ? `expected ${received} not to be close to ${expected}`
              : `expected ${received} to be close to ${expected}${eps !== undefined ? ` (eps=${eps})` : ''}`,
        }
      }
    }
    return {
      pass: false,
      message: () => `toBeCloseToValue: unsupported type for received value`,
    }
  },
})

interface CloseToValueMatchers<R = unknown> {
  toBeCloseToValue(expected: unknown, eps?: number): R
}

declare module 'vitest' {
  // biome-ignore lint/suspicious/noExplicitAny: vitest convention for matcher augmentation
  interface Assertion<T = any> extends CloseToValueMatchers<T> {}
  interface AsymmetricMatchersContaining extends CloseToValueMatchers {}
}
