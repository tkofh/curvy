import type { BaseAxes, Point } from '@curvy/types'

export interface LUTEntry<Axis extends BaseAxes> {
  length: number
  t: number
  value: Point<Axis>
}

export interface LUTRange<Axis extends BaseAxes> {
  start: LUTEntry<Axis>
  end: LUTEntry<Axis>

  max: Point<Axis>

  min: Point<Axis>
}

export type CubicScalars = [number, number, number, number]
export type QuadraticScalars = [number, number, number]
