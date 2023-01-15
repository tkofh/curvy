import type { BaseAxes } from './points'

export interface Range {
  min: number
  max: number
}

export type ReadonlyRange = Readonly<Range>

export type Bounds<TAxis extends BaseAxes> = Record<TAxis, Range>

export type ReadonlyBounds<TAxis extends BaseAxes> = Readonly<Record<TAxis, ReadonlyRange>>
