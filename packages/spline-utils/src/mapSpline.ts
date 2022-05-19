import { Bounds, Spline } from '@curvy/types'
import { remapSpline } from './remapSpline'

export const mapSpline = (spline: Spline, target: Bounds): Spline =>
  remapSpline(spline, spline.meta.bounds, target)
