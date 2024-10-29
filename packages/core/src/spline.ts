import type { Pipeable } from './internal/pipeable'
import type { Matrix4x4 } from './matrix/matrix4x4'

export interface Spline extends Pipeable {
  readonly matrix: Matrix4x4
}
