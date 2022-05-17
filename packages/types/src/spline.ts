import { ReadonlyPoint, ReadonlyPoints } from './points'
import { ReadonlyRect } from './areas'

export type Axis = 'X' | 'Y'

export type Monotonicity = 'positive' | 'negative' | 'none'

export interface Spline {
  readonly boundingBox: ReadonlyRect
  readonly extrema: ReadonlyPoints

  readonly solveY: (x: number, minY?: number, maxY?: number) => number | undefined
  readonly solveX: (y: number, minX?: number, maxX?: number) => number | undefined

  readonly precisionX: number
  readonly precisionY: number

  readonly monotonicityX: Monotonicity
  readonly monotonicityY: Monotonicity

  readonly length: number
  readonly solvePointAtLength: (length: number) => ReadonlyPoint | undefined
}
