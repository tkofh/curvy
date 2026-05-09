import { expect } from 'vitest'
import * as Interval from '../src/interval'
import * as Matrix2x2 from '../src/matrix/matrix2x2'
import * as Matrix3x3 from '../src/matrix/matrix3x3'
import * as Matrix4x4 from '../src/matrix/matrix4x4'
import * as CubicPolynomial from '../src/polynomial/cubic'
import * as LinearPolynomial from '../src/polynomial/linear'
import * as QuadraticPolynomial from '../src/polynomial/quadratic'
import * as Vector2 from '../src/vector/vector2'
import * as Vector3 from '../src/vector/vector3'
import * as Vector4 from '../src/vector/vector4'

type Guard<T> = (v: unknown) => v is T
type Eq<T> = (a: T, b: T, eps?: number) => boolean

// biome-ignore lint/suspicious/noExplicitAny: heterogeneous dispatch table
const dispatchers: ReadonlyArray<readonly [Guard<any>, Eq<any>, string]> = [
  [Vector2.isVector2, Vector2.equals, 'Vector2'],
  [Vector3.isVector3, Vector3.equals, 'Vector3'],
  [Vector4.isVector4, Vector4.equals, 'Vector4'],
  [Matrix2x2.isMatrix2x2, Matrix2x2.equals, 'Matrix2x2'],
  [Matrix3x3.isMatrix3x3, Matrix3x3.equals, 'Matrix3x3'],
  [Matrix4x4.isMatrix4x4, Matrix4x4.equals, 'Matrix4x4'],
  [LinearPolynomial.isLinearPolynomial, LinearPolynomial.equals, 'LinearPolynomial'],
  [QuadraticPolynomial.isQuadraticPolynomial, QuadraticPolynomial.equals, 'QuadraticPolynomial'],
  [CubicPolynomial.isCubicPolynomial, CubicPolynomial.equals, 'CubicPolynomial'],
  [Interval.isInterval, Interval.equals, 'Interval'],
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
