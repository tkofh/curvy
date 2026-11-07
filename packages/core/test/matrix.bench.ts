import { bench, describe } from 'vitest'
import * as Matrix2x2 from '../src/matrix/matrix2x2.ts'
import * as Matrix3x3 from '../src/matrix/matrix3x3.ts'
import * as Matrix4x4 from '../src/matrix/matrix4x4.ts'
import * as Plane3d from '../src/plane/plane3d.ts'
import * as Affine3d from '../src/transform/affine3d.ts'
import * as Vector2 from '../src/vector/vector2.ts'
import * as Vector3 from '../src/vector/vector3.ts'
import * as Vector4 from '../src/vector/vector4.ts'

// Module-scoped sink, as in curve.bench.ts, so V8 can't elide the results.
let _sink: unknown

// Transforming a frame of vertices, the workload ghost-studio measured:
// 184 vertices through a rotation and a translation.
const vertices = Array.from({ length: 184 }, (_, i) =>
  Vector3.make(Math.cos(i), Math.sin(i * 0.7), i / 184),
)
const m3 = Matrix3x3.make(0.36, 0.48, -0.8, -0.8, 0.6, 0, 0.48, 0.64, 0.6)
const t = Vector3.make(1, 2, 3)
const affine = Affine3d.fromMatrix(
  Matrix4x4.make(0.36, 0.48, -0.8, 1, -0.8, 0.6, 0, 2, 0.48, 0.64, 0.6, 3, 0, 0, 0, 1),
)

describe('transform 184 vertices', () => {
  bench('Matrix3x3.vectorProductLeft + Vector3.add', () => {
    let last: Vector3.Vector3 | undefined
    for (const v of vertices) {
      last = Vector3.add(Matrix3x3.vectorProductLeft(m3, v), t)
    }
    _sink = last
  })

  bench('Affine3d.apply', () => {
    let last: Vector3.Vector3 | undefined
    for (const v of vertices) {
      last = Affine3d.apply(affine, v)
    }
    _sink = last
  })
})

describe('matrix-vector products x1k', () => {
  const m2 = Matrix2x2.make(1, 2, 3, 4)
  const v2 = Vector2.make(0.5, -1)
  const m4 = Matrix4x4.identity
  const v4 = Vector4.make(1, 2, 3, 4)

  bench('Matrix2x2.vectorProductLeft', () => {
    let r = v2
    for (let i = 0; i < 1000; i++) {
      r = Matrix2x2.vectorProductLeft(m2, r)
    }
    _sink = r
  })
  bench('Matrix3x3.vectorProductLeft', () => {
    let r = t
    for (let i = 0; i < 1000; i++) {
      r = Matrix3x3.vectorProductLeft(m3, r)
    }
    _sink = r
  })
  bench('Matrix3x3.vectorProductRight', () => {
    let r = t
    for (let i = 0; i < 1000; i++) {
      r = Matrix3x3.vectorProductRight(m3, r)
    }
    _sink = r
  })
  bench('Matrix4x4.vectorProductLeft', () => {
    let r = v4
    for (let i = 0; i < 1000; i++) {
      r = Matrix4x4.vectorProductLeft(m4, r)
    }
    _sink = r
  })
})

describe('determinants and inverses', () => {
  const m4 = affine.matrix
  const normal = Vector3.make(0, 0, 1)
  const plane = Plane3d.make(Vector3.make(1, 1, 1), 2)

  bench('Matrix3x3.determinant', () => {
    _sink = Matrix3x3.determinant(m3)
  })
  bench('Matrix3x3.inverse', () => {
    _sink = Matrix3x3.inverse(m3)
  })
  bench('Matrix4x4.determinant', () => {
    _sink = Matrix4x4.determinant(m4)
  })
  bench('Matrix4x4.inverse', () => {
    _sink = Matrix4x4.inverse(m4)
  })
  bench('Affine3d.inverse', () => {
    _sink = Affine3d.inverse(affine)
  })
  bench('Affine3d.applyNormal', () => {
    _sink = Affine3d.applyNormal(affine, normal)
  })
  bench('Plane3d.transform', () => {
    _sink = Plane3d.transform(plane, affine)
  })
})
