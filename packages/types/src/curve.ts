import type { Bounds, ReadonlyBounds } from './bounds'
import type { ReadonlyMatrix4x4 } from './matrix'
import type {
  BaseAxes,
  Point,
  ReadonlyCubicPoints,
  ReadonlyPoint,
} from './points'

export type AxisMonotonicity = 'positive' | 'negative' | 'none'

export type Monotonicity<Axis extends BaseAxes> = Record<Axis, AxisMonotonicity>

export type ReadonlyMonotonicity<Axis extends BaseAxes> = Readonly<
  Record<Axis, AxisMonotonicity>
>

export type NormalizedPrecision<Axis extends BaseAxes> = Record<Axis, number>

export type ReadonlyNormalizedPrecision<Axis extends BaseAxes> = Readonly<
  Record<Axis, number>
>

export type Precision<Axis extends BaseAxes> =
  | number
  | NormalizedPrecision<Axis>

export interface Extreme<Axis extends BaseAxes> {
  for: Set<Axis>
  value: Point<Axis>
  t: number
  length: number
}

export interface ReadonlyExtreme<Axis extends BaseAxes> {
  readonly for: ReadonlySet<Axis>
  readonly value: ReadonlyPoint<Axis>
  t: number
  length: number
}

export interface CubicCurve<Axis extends BaseAxes> {
  readonly solve: <TSolveAxis extends Axis>(
    axis: TSolveAxis,
    input: number,
    constraints?: Partial<Bounds<Exclude<Axis, TSolveAxis>>>,
  ) => ReadonlyPoint<Axis>
  readonly trySolve: <TSolveAxis extends Axis>(
    axis: TSolveAxis,
    input: number,
    constraints?: Partial<Bounds<Exclude<Axis, TSolveAxis>>>,
  ) => ReadonlyPoint<Axis> | undefined
  readonly solveLength: (length: number) => ReadonlyPoint<Axis>
  readonly trySolveLength: (length: number) => ReadonlyPoint<Axis> | undefined
  readonly solveT: (t: number) => ReadonlyPoint<Axis>
  readonly trySolveT: (t: number) => ReadonlyPoint<Axis> | undefined

  readonly bounds: ReadonlyBounds<Axis>
  readonly extrema: ReadonlyArray<ReadonlyExtreme<Axis>>

  readonly precision: ReadonlyNormalizedPrecision<Axis>

  readonly monotonicity: ReadonlyMonotonicity<Axis>

  readonly length: number

  readonly points: ReadonlyCubicPoints<Axis>

  readonly identityMatrix: ReadonlyMatrix4x4

  readonly axes: ReadonlySet<Axis>
}
