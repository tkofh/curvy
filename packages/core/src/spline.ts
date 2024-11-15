import type { Pipeable } from './internal/pipeable'
import type { Matrix4x4 } from './matrix/matrix4x4'
import type { SplineTypeId } from './spline.internal'

export interface Spline extends Pipeable {
  readonly [SplineTypeId]: SplineTypeId

  readonly matrix: Matrix4x4
}
