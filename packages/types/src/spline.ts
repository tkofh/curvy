import { Points } from './points'
import { Rect } from './areas'

export interface Spline {
  solve: (x: number) => number | undefined
  solveInverse: (y: number, minX?: number, maxX?: number) => number | undefined
  boundingBox: Rect
  extrema: Points
  precision: number
}
