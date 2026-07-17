import { describe, expect, test } from 'vitest'
import * as ArcIndex from '../src/arc/index.ts'
import * as Curve from '../src/curve/index.ts'
import * as Matrix from '../src/matrix/index.ts'
import * as Path from '../src/path/index.ts'
import * as Polynomial from '../src/polynomial/index.ts'
import * as Splines from '../src/splines/index.ts'
import * as Vector from '../src/vector/index.ts'

describe('per-domain index re-exports', () => {
  test('curve index exposes namespaces by type name', () => {
    expect(typeof Curve.LinearCurve2d.fromPolynomials).toBe('function')
    expect(typeof Curve.QuadraticCurve2d.fromPolynomials).toBe('function')
    expect(typeof Curve.CubicCurve2d.fromPolynomials).toBe('function')
  })
  test('arc index exposes the namespace', () => {
    expect(typeof ArcIndex.Arc.circular).toBe('function')
    expect(typeof ArcIndex.Arc.toPathData).toBe('function')
  })
  test('path index exposes namespaces by type name', () => {
    expect(typeof Path.LinearPath2d.make).toBe('function')
    expect(typeof Path.QuadraticPath2d.make).toBe('function')
    expect(typeof Path.CubicPath2d.make).toBe('function')
  })
  test('splines index exposes namespaces by type name', () => {
    expect(typeof Splines.Bezier2d.make).toBe('function')
    expect(typeof Splines.Cardinal2d.make).toBe('function')
    expect(typeof Splines.Hermite2d.make).toBe('function')
    expect(typeof Splines.Basis2d.make).toBe('function')
  })
  test('polynomial index exposes namespaces by type name', () => {
    expect(typeof Polynomial.LinearPolynomial.make).toBe('function')
    expect(typeof Polynomial.QuadraticPolynomial.make).toBe('function')
    expect(typeof Polynomial.CubicPolynomial.make).toBe('function')
  })
  test('matrix index exposes namespaces by type name', () => {
    expect(typeof Matrix.Matrix2x2.make).toBe('function')
    expect(typeof Matrix.Matrix3x3.make).toBe('function')
    expect(typeof Matrix.Matrix4x4.make).toBe('function')
  })
  test('vector index exposes namespaces by type name', () => {
    expect(typeof Vector.Vector2.make).toBe('function')
    expect(typeof Vector.Vector3.make).toBe('function')
    expect(typeof Vector.Vector4.make).toBe('function')
  })
  test('namespace round-trip: build a path through the Curve namespace', () => {
    const c = Curve.CubicCurve2d.fromBezierPoints(
      Vector.Vector2.make(0, 0),
      Vector.Vector2.make(1, 0),
      Vector.Vector2.make(1, 1),
      Vector.Vector2.make(0, 1),
    )
    const p = Path.CubicPath2d.make(c)
    expect(Path.CubicPath2d.toPathData(p)).toBe('M 0,0 C 1,0 1,1 0,1')
  })
})
