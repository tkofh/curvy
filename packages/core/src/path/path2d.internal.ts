// import type { Curve2d } from '../curve/curve2d'
import { Pipeable } from '../internal/pipeable'
// import type { Polynomial } from '../polynomial'
import type { Path2d } from './path2d'

export const Path2dTypeId: unique symbol = Symbol('Path2dTypeId')
export type Path2dTypeId = typeof Path2dTypeId

export class Path2dImpl extends Pipeable implements Path2d {
  readonly [Path2dTypeId]: Path2dTypeId = Path2dTypeId
}
