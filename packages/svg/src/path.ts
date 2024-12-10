import type { Pipeable } from 'curvy/pipe'
import type { Bezier2d } from 'curvy/splines/bezier2d'
import type { PathTypeId } from './path.internal'
import * as internal from './path.internal'

export interface Path extends Pipeable {
  readonly [PathTypeId]: PathTypeId
}

export const fromBezier2d: (bezier: Bezier2d) => Path = internal.fromBezier2d

export const render: (path: Path) => string = internal.render
