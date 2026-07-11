import { invariant } from './utils.ts'

export type TwoDimensionalIndex = 0 | 1
export type TwoDimensionalComponent = 'x' | 'y'

/**
 * A value with two components, addressable by name (`x`, `y`) and by
 * position (`0`, `1`).
 *
 * @since 2.0.0
 */
export interface TwoDimensional<out T1, out T2 = T1> {
  /**
   * The first component.
   */
  readonly x: T1
  /**
   * The second component.
   */
  readonly y: T2

  /**
   * Positional alias for `x`.
   */
  readonly 0: T1
  /**
   * Positional alias for `y`.
   */
  readonly 1: T2
}

export type ThreeDimensionalIndex = TwoDimensionalIndex | 2
export type ThreeDimensionalComponent = TwoDimensionalComponent | 'z'

/**
 * A value with three components, adding `z` (position `2`) to
 * `TwoDimensional`.
 *
 * @since 2.0.0
 */
export interface ThreeDimensional<out T1, out T2 = T1, out T3 = T2> extends TwoDimensional<T1, T2> {
  /**
   * The third component.
   */
  readonly z: T3
  /**
   * Positional alias for `z`.
   */
  readonly 2: T3
}

export type FourDimensionalIndex = ThreeDimensionalIndex | 3
export type FourDimensionalComponent = ThreeDimensionalComponent | 'w'

/**
 * A value with four components, adding `w` (position `3`) to
 * `ThreeDimensional`.
 *
 * @since 2.0.0
 */
export interface FourDimensional<
  out T1,
  out T2 = T1,
  out T3 = T2,
  out T4 = T3,
> extends ThreeDimensional<T1, T2, T3> {
  /**
   * The fourth component.
   */
  readonly w: T4
  /**
   * Positional alias for `w`.
   */
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
