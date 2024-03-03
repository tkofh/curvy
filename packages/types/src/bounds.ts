import type { BaseAxes } from './points'

export interface Range {
  min: number
  max: number
}

export type ReadonlyRange = Readonly<Range>

export type Bounds<Axis extends BaseAxes> = Record<Axis, Range>

export type ReadonlyBounds<Axis extends BaseAxes> = Readonly<
  Record<Axis, ReadonlyRange>
>
