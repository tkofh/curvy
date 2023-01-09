import { BaseAxes, Point, ReadonlyCubicPoints, ReadonlyPoint } from './points'
import { Bounds, ReadonlyBounds } from './bounds'
import { ReadonlyMatrix4x4 } from './matrix'

export type AxisMonotonicity = 'positive' | 'negative' | 'none'

export type Monotonicity<TAxis extends BaseAxes> = Record<TAxis, AxisMonotonicity>

export type ReadonlyMonotonicity<TAxis extends BaseAxes> = Readonly<Record<TAxis, AxisMonotonicity>>

export type NormalizedPrecision<TAxis extends BaseAxes> = Record<TAxis, number>

export type ReadonlyNormalizedPrecision<TAxis extends BaseAxes> = Readonly<Record<TAxis, number>>

export type Precision<TAxis extends BaseAxes> = number | NormalizedPrecision<TAxis>

export interface Extreme<TAxis extends BaseAxes> {
  for: Set<TAxis>
  value: Point<TAxis>
  t: number
  length: number
}

export interface ReadonlyExtreme<TAxis extends BaseAxes> {
  readonly for: ReadonlySet<TAxis>
  readonly value: ReadonlyPoint<TAxis>
  t: number
  length: number
}

export interface CubicCurve<TAxis extends BaseAxes> {
  readonly solve: <TSolveAxis extends TAxis>(
    axis: TSolveAxis,
    input: number,
    constraints?: Partial<Bounds<Exclude<TAxis, TSolveAxis>>>
  ) => ReadonlyPoint<TAxis>
  readonly trySolve: <TSolveAxis extends TAxis>(
    axis: TSolveAxis,
    input: number,
    constraints?: Partial<Bounds<Exclude<TAxis, TSolveAxis>>>
  ) => ReadonlyPoint<TAxis> | undefined
  readonly solveLength: (length: number) => ReadonlyPoint<TAxis>
  readonly trySolveLength: (length: number) => ReadonlyPoint<TAxis> | undefined
  readonly solveT: (t: number) => ReadonlyPoint<TAxis>
  readonly trySolveT: (t: number) => ReadonlyPoint<TAxis> | undefined

  readonly bounds: ReadonlyBounds<TAxis>
  readonly extrema: ReadonlyArray<ReadonlyExtreme<TAxis>>

  readonly precision: ReadonlyNormalizedPrecision<TAxis>

  readonly monotonicity: ReadonlyMonotonicity<TAxis>

  readonly length: number

  readonly points: ReadonlyCubicPoints<TAxis>

  readonly identityMatrix: ReadonlyMatrix4x4

  readonly axes: ReadonlySet<TAxis>
}
