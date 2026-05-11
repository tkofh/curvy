import * as Characteristic from '../characteristic'
import * as CubicCurve2d from '../curve/cubic2d'
import type * as Matrix4x4 from '../matrix/matrix4x4'
import type { Vector2 } from '../vector/vector2'
import * as Vector4 from '../vector/vector4'

export function* toPointQuads(points: Iterable<Vector2>, stride: 1 | 2 | 3) {
  let p0: Vector2 | undefined
  let p1: Vector2 | undefined
  let p2: Vector2 | undefined
  let p3: Vector2 | undefined

  for (const point of points) {
    if (p0 === undefined) {
      p0 = point
      continue
    }

    if (p1 === undefined) {
      p1 = point
      continue
    }

    if (p2 === undefined) {
      p2 = point
      continue
    }

    p3 = point

    yield [p0, p1, p2, p3] as const

    if (stride === 1) {
      p0 = p1
      p1 = p2
      p2 = p3
    } else if (stride === 2) {
      p0 = p2
      p1 = p3
      p2 = undefined
    } else if (stride === 3) {
      p0 = p3
      p1 = undefined
      p2 = undefined
    }
  }
}

export function* toCurves(
  points: Iterable<Vector2>,
  matrix: Matrix4x4.Matrix4x4,
  stride: 1 | 2 | 3,
) {
  for (const quad of toPointQuads(points, stride)) {
    const channels = Vector4.transpose(quad, (p) => [p.x, p.y])
    yield CubicCurve2d.fromPolynomials(...Characteristic.apply(matrix, ...channels))
  }
}
