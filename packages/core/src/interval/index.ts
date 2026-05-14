import * as IntervalNs from './interval.ts'
import * as Interval2dNs from './interval2d.ts'

export type Interval = IntervalNs.Interval
export { IntervalNs as Interval }

export type Interval2d<
  X extends IntervalNs.Interval = IntervalNs.Interval,
  Y extends IntervalNs.Interval = IntervalNs.Interval,
> = Interval2dNs.Interval2d<X, Y>
export { Interval2dNs as Interval2d }
