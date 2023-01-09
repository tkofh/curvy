import { BaseAxes, Point } from '@curvy/types'

export interface LUTEntry<TAxis extends BaseAxes> {
  length: number
  t: number
  value: Point<TAxis>
}

export interface LUTRange<TAxis extends BaseAxes> {
  start: LUTEntry<TAxis>
  end: LUTEntry<TAxis>

  max: Point<TAxis>

  min: Point<TAxis>
}

export type CubicScalars = [number, number, number, number]
export type QuadraticScalars = [number, number, number]
