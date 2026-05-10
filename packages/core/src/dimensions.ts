import { invariant } from './utils'

export type TwoDimensionalIndex = 0 | 1
export type TwoDimensionalComponent = 'x' | 'y'

export interface TwoDimensional<out T1, out T2 = T1> {
  readonly x: T1
  readonly y: T2

  readonly 0: T1
  readonly 1: T2
}

export type ThreeDimensionalIndex = TwoDimensionalIndex | 2
export type ThreeDimensionalComponent = TwoDimensionalComponent | 'z'

export interface ThreeDimensional<out T1, out T2 = T1, out T3 = T2> extends TwoDimensional<T1, T2> {
  readonly z: T3
  readonly 2: T3
}

export type FourDimensionalIndex = ThreeDimensionalIndex | 3
export type FourDimensionalComponent = ThreeDimensionalComponent | 'w'

export interface FourDimensional<
  out T1,
  out T2 = T1,
  out T3 = T2,
  out T4 = T3,
> extends ThreeDimensional<T1, T2, T3> {
  readonly w: T4
  readonly 3: T4
}

function toIndex(input: string | number): number {
  if (typeof input === 'number') {
    invariant(input >= 0 && input <= 3, 'Index out of bounds')

    return input
  }

  if (input === 'x') {
    return 0
  }

  if (input === 'y') {
    return 1
  }

  if (input === 'z') {
    return 2
  }

  if (input === 'w') {
    return 3
  }

  invariant(false, 'Invalid component')
}

export const toTwoDimensionalIndex = toIndex as (
  input: TwoDimensionalIndex | TwoDimensionalComponent,
) => TwoDimensionalIndex
export const toThreeDimensionalIndex = toIndex as (
  input: ThreeDimensionalIndex | ThreeDimensionalComponent,
) => ThreeDimensionalIndex
export const toFourDimensionalIndex = toIndex as (
  input: FourDimensionalIndex | FourDimensionalComponent,
) => FourDimensionalIndex
