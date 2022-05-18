import { PointObject } from './points'
import { Bounds } from './bounds'

export type Axis = 'X' | 'Y'

export type Monotonicity = 'positive' | 'negative' | 'none'

export interface SplineMetadata {
  readonly bounds: Readonly<Bounds>
  readonly extrema: ReadonlyArray<PointObject>

  readonly precisionX: number
  readonly precisionY: number

  readonly monotonicityX: Monotonicity
  readonly monotonicityY: Monotonicity

  readonly length: number
}

export interface Spline {
  readonly solveY: (x: number, minY?: number, maxY?: number) => number | undefined
  readonly solveX: (y: number, minX?: number, maxX?: number) => number | undefined

  readonly solveLength: (length: number) => Readonly<PointObject> | undefined
  readonly solveT: (t: number) => Readonly<PointObject> | undefined

  readonly meta: SplineMetadata
}
