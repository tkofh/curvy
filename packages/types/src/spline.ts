import { PointObject } from './points'
import { Bounds } from './bounds'

export type Axis = 'X' | 'Y'

export type Monotonicity = 'positive' | 'negative' | 'none'

export interface LUTEntry extends PointObject {
  length: number
  t: number
}

export interface SplineMetadata {
  bounds: Readonly<Bounds>
  extrema: ReadonlyArray<PointObject>

  precisionX: number
  precisionY: number

  monotonicityX: Monotonicity
  monotonicityY: Monotonicity

  length: number

  lut: LUTEntry[]
}

export interface Spline {
  solveY: (x: number, minY?: number, maxY?: number) => number | undefined
  solveX: (y: number, minX?: number, maxX?: number) => number | undefined

  solveLength: (length: number) => Readonly<PointObject> | undefined
  solveT: (t: number) => Readonly<PointObject> | undefined

  meta: SplineMetadata
}
