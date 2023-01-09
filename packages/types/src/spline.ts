import { BaseAxes, ReadonlyCubicPoints } from './points'
import { CubicCurve } from './curve'

export interface CubicSpline<TAxis extends BaseAxes> extends Omit<CubicCurve<TAxis>, 'points'> {
  readonly points: ReadonlyArray<ReadonlyCubicPoints<TAxis>>
  readonly curves: ReadonlyArray<CubicCurve<TAxis>>
}
