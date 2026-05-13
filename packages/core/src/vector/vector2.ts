import type { TwoDimensional } from '../dimensions'
import type { Pipeable } from '../utils'
import type { Vector2TypeId, WeightedVector2TypeId } from './vector2.internal'
import * as internal from './vector2.internal'

/**
 * A 2D vector.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * @since 1.0.0
 */
export interface Vector2 extends Pipeable, TwoDimensional<number> {
  readonly [Vector2TypeId]: Vector2TypeId
}

/**
 * A 2D point with an associated positive scalar weight.
 *
 * Used by rational primitives (e.g. `RationalBezier2d`) where each control
 * point carries an influence weight. The interface is structurally distinct
 * from `Vector2` — its brand prevents accidental use with vector arithmetic
 * (`add`, `subtract`, `scale`, etc.) where weighted operations are not
 * well-defined.
 *
 * Construct via {@link makeWeighted} (from raw components) or
 * {@link withWeight} (from an existing `Vector2`).
 *
 * @since 2.1.0
 */
export interface Weighted extends Pipeable {
  readonly [WeightedVector2TypeId]: WeightedVector2TypeId
  readonly x: number
  readonly y: number
  readonly weight: number
}

/**
 * Checks if a value is a `Vector2`.
 *
 * @param v - The value to check.
 * @returns `true` if the value is a `Vector2`, `false` otherwise.
 * @since 1.0.0
 */
export const isVector2: (v: unknown) => v is Vector2 = internal.isVector2

/**
 * Checks if a value is a `Vector2.Weighted`.
 *
 * @param v - The value to check.
 * @returns `true` if the value is a `Vector2.Weighted`, `false` otherwise.
 * @since 2.1.0
 */
export const isWeighted: (v: unknown) => v is Weighted = internal.isWeighted

/**
 * Creates a new `Vector2.Weighted` from raw components. The weight must be
 * finite and positive.
 *
 * @param x - The x component.
 * @param y - The y component.
 * @param weight - The positive scalar weight.
 * @returns A new `Vector2.Weighted` instance.
 * @since 2.1.0
 */
export const makeWeighted: (x: number, y: number, weight: number) => Weighted =
  internal.makeWeighted

export const withWeight: {
  /**
   * Promotes a `Vector2` to a `Vector2.Weighted` by attaching the given
   * positive scalar weight.
   *
   * @param v - The point to weight.
   * @param weight - The positive scalar weight.
   * @returns A new `Vector2.Weighted` instance.
   * @since 2.1.0
   */
  (v: Vector2, weight: number): Weighted
  /**
   * Promotes a `Vector2` to a `Vector2.Weighted` by attaching the given
   * positive scalar weight.
   *
   * @param weight - The positive scalar weight.
   * @returns A function that takes a `Vector2` and returns a weighted point.
   * @since 2.1.0
   */
  (weight: number): (v: Vector2) => Weighted
} = internal.withWeight

/**
 * Strips the weight from a `Vector2.Weighted`, returning the underlying point.
 *
 * @param w - The weighted point.
 * @returns A new `Vector2` instance with the same x and y components.
 * @since 2.1.0
 */
export const unweighted: (w: Weighted) => Vector2 = internal.unweighted

export const weightedEquals: {
  /**
   * Checks if two `Vector2.Weighted` instances are approximately equal —
   * point components and weight all within the default absolute tolerance.
   *
   * @param a - The first weighted point.
   * @param b - The second weighted point.
   * @returns `true` when components and weight are within tolerance.
   * @since 2.1.0
   */
  (a: Weighted, b: Weighted): boolean
  /**
   * Checks if two `Vector2.Weighted` instances are approximately equal.
   *
   * @param b - The second weighted point.
   * @returns A function that takes the first weighted point and returns the comparison result.
   * @since 2.1.0
   */
  (b: Weighted): (a: Weighted) => boolean
} = internal.weightedEquals

export const equals: {
  /**
   * Checks if two `Vector2` instances are approximately equal within the
   * default absolute tolerance ({@link EPSILON}).
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @returns `true` when each pair of components is within tolerance.
   * @since 1.1.0
   */
  (a: Vector2, b: Vector2): boolean
  /**
   * Checks if two `Vector2` instances are approximately equal within the
   * default absolute tolerance ({@link EPSILON}).
   *
   * @param b - The second vector.
   * @returns A function that takes the first vector and returns the comparison result.
   * @since 1.1.0
   */
  (b: Vector2): (a: Vector2) => boolean
} = internal.equals

export const make: {
  /**
   * Creates a new `Vector2` instance.
   *
   * @param xy - The x and y components of the vector.
   * @returns A new `Vector2` instance.
   * @since 1.0.0
   */
  (xy: number): Vector2
  /**
   * Creates a new `Vector2` instance.
   *
   * @param x - The x component of the vector.
   * @param y - The y component of the vector.
   * @returns A new `Vector2` instance.
   * @since 1.0.0
   */
  (x: number, y: number): Vector2
} = internal.make

/**
 * Transposes a 2-tuple of items into one or more `Vector2`s, one per channel
 * extracted by the projection function. See {@link Vector4.transpose} for the
 * full operation description; this is the 2-component analog.
 *
 * @param inputs - Exactly two items of any type.
 * @param project - A function returning a fixed-arity tuple of numbers — one per output channel.
 * @returns A tuple of `Vector2`s with the same arity as the projection's return tuple.
 * @since 2.1.0
 */
export const transpose: <T, const Channels extends ReadonlyArray<number>>(
  inputs: readonly [T, T],
  project: (item: T) => Channels,
) => { readonly [K in keyof Channels]: Vector2 } = internal.transpose

/**
 * Creates a new `Vector2` instance from polar coordinates.
 *
 * @param r - The radius.
 * @param theta - The angle, in radians.
 * @returns A new `Vector2` instance.
 * @since 1.0.0
 */
export const fromPolar: (r: number, theta: number) => Vector2 = internal.fromPolar

/**
 * Calculates the magnitude of a `Vector2`.
 *
 * @param vector - The vector to calculate the magnitude of.
 * @returns The magnitude of the vector.
 * @since 1.0.0
 */
export const magnitude: (vector: Vector2) => number = internal.magnitude

/**
 * Normalizes a `Vector2`.
 *
 * @param vector - The vector to normalize.
 * @returns A new `Vector2` instance with the same direction and a magnitude of 1.
 * @since 1.0.0
 */
export const normalize: (vector: Vector2) => Vector2 = internal.normalize

export const dot: {
  /**
   * Calculates the dot product of two `Vector2` instances.
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @returns The dot product of the two vectors.
   * @since 1.0.0
   */
  (a: Vector2, b: Vector2): number
  /**
   * Calculates the dot product of two `Vector2` instances.
   *
   * @param b - The second vector.
   * @returns A function that takes the first vector and returns the dot product.
   * @since 1.0.0
   */
  (b: Vector2): (a: Vector2) => number
} = internal.dot

export const cross: {
  /**
   * Calculates the cross product of two `Vector2` instances.
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @returns The cross product of the two vectors.
   * @since 1.0.0
   */
  (a: Vector2, b: Vector2): number
  /**
   * Calculates the cross product of two `Vector2` instances.
   *
   * @param b - The second vector.
   * @returns A function that takes the first vector and returns the cross product.
   * @since 1.0.0
   */
  (b: Vector2): (a: Vector2) => number
} = internal.cross

/**
 * Returns the components of a `Vector2` as an array.
 *
 * @param r - The radius.
 * @param theta - The angle, in radians.
 * @returns A new `Vector2` instance.
 * @since 1.0.0
 */
export const components: (v: Vector2) => [number, number] = internal.components

/**
 * Applies the softmax function to a `Vector2`.
 *
 * @param v - The vector to apply the softmax function to.
 * @returns A new `Vector2` instance with the softmax applied.
 * @since 1.0.0
 */
export const softmax: (v: Vector2) => Vector2 = internal.softmax

/**
 * Creates a zero vector.
 *
 * @returns A new `Vector2` instance with both components set to 0.
 * @since 1.0.0
 */
export const zero = make(0)

/**
 * Creates a unit vector.
 *
 * @returns A new `Vector2` instance with both components set to 1.
 * @since 1.0.0
 */
export const unit = make(1)

export const add: {
  /**
   * Adds two `Vector2` instances together.
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @returns A new `Vector2` instance representing the sum of the two vectors.
   * @since 1.0.0
   */
  (a: Vector2, b: Vector2): Vector2
  /**
   * Adds two `Vector2` instances together.
   *
   * @param b - The second vector.
   * @returns A function that takes the first vector and returns the sum.
   * @since 1.0.0
   */
  (b: Vector2): (a: Vector2) => Vector2
} = internal.add

export const subtract: {
  /**
   * Subtracts one `Vector2` instance from another.
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @returns A new `Vector2` instance representing the difference of the two vectors.
   * @since 1.0.0
   */
  (a: Vector2, b: Vector2): Vector2
  /**
   * Subtracts one `Vector2` instance from another.
   *
   * @param b - The second vector.
   * @returns A function that takes the first vector and returns the difference.
   * @since 1.0.0
   */
  (b: Vector2): (a: Vector2) => Vector2
} = internal.subtract

export const hadamard: {
  /**
   * Performs the Hadamard product of two `Vector2` instances.
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @returns A new `Vector2` instance representing the Hadamard product of the two vectors.
   * @since 1.0.0
   */
  (a: Vector2, b: Vector2): Vector2
  /**
   * Performs the Hadamard product of two `Vector2` instances.
   *
   * @param b - The second vector.
   * @returns A function that takes the first vector and returns the Hadamard product.
   * @since 1.0.0
   */
  (b: Vector2): (a: Vector2) => Vector2
} = internal.hadamard

export const scale: {
  /**
   * Scales a `Vector2` by a scalar value.
   *
   * @param s - The scalar value to scale by.
   * @returns A function that takes a vector and returns the scaled vector.
   * @since 1.0.0
   */
  (s: number): (v: Vector2) => Vector2
  /**
   * Scales a `Vector2` by a scalar value.
   *
   * @param v - The vector to scale.
   * @param s - The scalar value to scale by.
   * @returns A new `Vector2` instance representing the scaled vector.
   * @since 1.0.0
   */
  (v: Vector2, s: number): Vector2
} = internal.scale

/**
 * Gets the x component of a `Vector2`.
 *
 * @param v - The vector to get the x component from.
 * @returns The x component of the vector.
 * @since 1.0.0
 */
export const getX: (v: Vector2) => number = internal.getX

export const setX: {
  /**
   * Sets the x component of a `Vector2`.
   *
   * @param v - The vector to set the x component of.
   * @param x - The new x component.
   * @returns A new `Vector2` instance with the updated x component.
   * @since 1.0.0
   */
  (v: Vector2, x: number): Vector2
  /**
   * Sets the x component of a `Vector2`.
   *
   * @param x - The new x component.
   * @returns A function that takes a vector and returns the updated vector.
   * @since 1.0.0
   */
  (x: number): (v: Vector2) => Vector2
} = internal.setX

/**
 * Gets the y component of a `Vector2`.
 *
 * @param v - The vector to get the y component from.
 * @returns The y component of the vector.
 * @since 1.0.0
 */
export const getY: (v: Vector2) => number = internal.getY

export const setY: {
  /**
   * Sets the y component of a `Vector2`.
   *
   * @param v - The vector to set the y component of.
   * @param y - The new y component.
   * @returns A new `Vector2` instance with the updated y component.
   * @since 1.0.0
   */
  (v: Vector2, y: number): Vector2
  /**
   * Sets the y component of a `Vector2`.
   *
   * @param y - The new y component.
   * @returns A function that takes a vector and returns the updated vector.
   * @since 1.0.0
   */
  (y: number): (v: Vector2) => Vector2
} = internal.setY

/**
 * Gets the radius of a `Vector2`.
 *
 * @param v - The vector to get the radius from.
 * @returns The radius of the vector.
 * @since 1.0.0
 */
export const getR: (v: Vector2) => number = magnitude

export const setR: {
  /**
   * Sets the radius of a `Vector2`.
   *
   * @param v - The vector to set the radius of.
   * @param r - The new radius.
   * @returns A new `Vector2` instance with the updated radius.
   * @since 1.0.0
   */
  (v: Vector2, r: number): Vector2
  /**
   * Sets the radius of a `Vector2`.
   *
   * @param r - The new radius.
   * @returns A function that takes a vector and returns the updated vector.
   * @since 1.0.0
   */
  (r: number): (v: Vector2) => Vector2
} = internal.setR

/**
 * Gets the angle of a `Vector2`.
 *
 * @param v - The vector to get the angle from.
 * @returns The angle of the vector in radians.
 * @since 1.0.0
 */
export const getTheta: (v: Vector2) => number = internal.getTheta

export const setTheta: {
  /**
   * Sets the angle of a `Vector2`.
   *
   * @param v - The vector to set the angle of.
   * @param theta - The new angle, in radians.
   * @returns A new `Vector2` instance with the updated angle.
   * @since 1.0.0
   */
  (v: Vector2, theta: number): Vector2
  /**
   * Sets the angle of a `Vector2`.
   *
   * @param theta - The new angle, in radians.
   * @returns A function that takes a vector and returns the updated vector.
   * @since 1.0.0
   */
  (theta: number): (v: Vector2) => Vector2
} = internal.setTheta
