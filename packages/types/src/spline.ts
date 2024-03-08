import type { CubicCurve } from './curve'
import type { BaseAxes, ReadonlyCubicPoints } from './points'

export interface CubicSpline<Axis extends BaseAxes>
  extends Omit<CubicCurve<Axis>, 'points'> {
  readonly points: ReadonlyArray<ReadonlyCubicPoints<Axis>>
  readonly curves: ReadonlyArray<CubicCurve<Axis>>
}
