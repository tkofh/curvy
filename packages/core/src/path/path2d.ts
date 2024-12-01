import type { Pipeable } from '../internal/pipeable'
import type { Path2dTypeId } from './path2d.internal'

export interface Path2d extends Pipeable {
  readonly [Path2dTypeId]: Path2dTypeId
}
