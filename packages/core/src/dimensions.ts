import { invariant } from './util'

export type TwoDimensionalIndex = 0 | 1
export type TwoDimensionalComponent = 'x' | 'y'

export interface TwoDimensional<T> {
  readonly x: T
  readonly y: T

  readonly 0: T
  readonly 1: T
}

export type ThreeDimensionalIndex = TwoDimensionalIndex | 2
export type ThreeDimensionalComponent = TwoDimensionalComponent | 'z'

export interface ThreeDimensional<T> extends TwoDimensional<T> {
  readonly z: T
  readonly 2: T
}

export type FourDimensionalIndex = ThreeDimensionalIndex | 3
export type FourDimensionalComponent = ThreeDimensionalComponent | 'w'

export interface FourDimensional<T> extends ThreeDimensional<T> {
  readonly w: T
  readonly 3: T
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
