import type { FourDimensional } from '../dimensions'
import type { Pipeable } from '../pipe'
import type { Vector4TypeId } from './vector4.internal'
import * as internal from './vector4.internal'

/**
 * A 4D vector.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * @since 1.0.0
 */
export interface Vector4 extends Pipeable, FourDimensional<number> {
  readonly [Vector4TypeId]: Vector4TypeId
}

/**
 * Checks if a value is a `Vector4`.
 *
 * @param v - The value to check.
 * @returns `true` if the value is a `Vector4`, `false` otherwise.
 * @since 1.0.0
 */
export const isVector4: (v: unknown) => v is Vector4 = internal.isVector4

export const equals: {
  /**
   * Checks if two `Vector4` instances are approximately equal within the
   * default absolute tolerance ({@link EPSILON}).
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @returns `true` when each pair of components is within tolerance.
   * @since 1.1.0
   */
  (a: Vector4, b: Vector4): boolean
  /**
   * Checks if two `Vector4` instances are approximately equal within the
   * default absolute tolerance ({@link EPSILON}).
   *
   * @param b - The second vector.
   * @returns A function that takes the first vector and returns the comparison result.
   * @since 1.1.0
   */
  (b: Vector4): (a: Vector4) => boolean
} = internal.equals

export const make: {
  /**
   * Creates a new `Vector4` instance.
   *
   * @param xyzw - The x, y, z, and w components of the vector.
   * @returns A new `Vector4` instance.
   * @since 1.0.0
   */
  (xyzw: number): Vector4
  /**
   * Creates a new `Vector4` instance.
   *
   * @param x - The x component of the vector.
   * @param yzw - The y, z, and w components of the vector.
   * @returns A new `Vector4` instance.
   * @since 1.0.0
   */
  (x: number, yzw: number): Vector4
  /**
   * Creates a new `Vector4` instance.
   *
   * @param x - The x component of the vector.
   * @param y - The y component of the vector.
   * @param zw - The z and w components of the vector.
   * @returns A new `Vector4` instance.
   * @since 1.0.0
   */
  (x: number, y: number, zw: number): Vector4
  /**
   * Creates a new `Vector4` instance.
   *
   * @param x - The x component of the vector.
   * @param y - The y component of the vector.
   * @param z - The z component of the vector.
   * @param w - The w component of the vector.
   * @returns A new `Vector4` instance.
   * @since 1.0.0
   */
  (x: number, y: number, z: number, w: number): Vector4
} = internal.make

/**
 * Transposes a 4-tuple of items into one or more `Vector4`s, one per channel
 * extracted by the projection function.
 *
 * For each output channel, takes the corresponding number from each of the
 * four projected items and packs them into a `Vector4` — the data-layout
 * transformation NumPy calls a transpose, FP calls `unzip`, GPUs call a
 * gather, and DSP people inexplicably call deinterleaving.
 *
 * The projection's return-tuple arity determines the number of output
 * vectors, and that arity is preserved in the return type.
 *
 * @example
 * ```ts
 * // Pack the x and y coordinates of four control points into two Vector4s.
 * const [xs, ys] = Vector4.transpose(
 *   [p0, p1, p2, p3],
 *   (p) => [p.x, p.y],
 * )
 * ```
 *
 * @param inputs - Exactly four items of any type.
 * @param project - A function returning a fixed-arity tuple of numbers — one per output channel.
 * @returns A tuple of `Vector4`s with the same arity as the projection's return tuple.
 * @since 2.1.0
 */
export const transpose: <T, const Channels extends ReadonlyArray<number>>(
  inputs: readonly [T, T, T, T],
  project: (item: T) => Channels,
) => { readonly [K in keyof Channels]: Vector4 } = internal.transpose

/**
 * Gets the magnitude of a `Vector4`.
 *
 * @param vector - The vector to calculate the magnitude of.
 * @returns The magnitude of the vector.
 * @since 1.0.0
 */
export const magnitude: (vector: Vector4) => number = internal.magnitude

/**
 * Normalizes a `Vector4`.
 *
 * @param vector - The vector to normalize.
 * @returns A new `Vector4` instance with the same direction as the input vector but with a magnitude of 1.
 * @since 1.0.0
 */
export const normalize: (vector: Vector4) => Vector4 = internal.normalize

export const dot: {
  /**
   * Computes the dot product of two `Vector4` instances.
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @returns The dot product of the two vectors.
   * @since 1.0.0
   */
  (a: Vector4, b: Vector4): number
  /**
   * Computes the dot product of a `Vector4` instance and another vector.
   *
   * @param b - The second vector.
   * @returns A function that takes the first vector and returns the dot product.
   * @since 1.0.0
   */
  (b: Vector4): (a: Vector4) => number
} = internal.dot

/**
 * Returns the components of a `Vector4` as an array.
 *
 * @param v - The vector to get the components of.
 * @returns An array containing the x, y, z, and w components of the vector.
 * @since 1.0.0
 */
export const components: (v: Vector4) => [number, number, number, number] = internal.components

/**
 * Applies the softmax function to a `Vector4`.
 *
 * @param v - The vector to calculate the softmax of.
 * @returns A new `Vector4` instance representing the softmax of the input vector.
 */
export const softmax: (v: Vector4) => Vector4 = internal.softmax

/**
 * Creates a zero vector.
 *
 * @since 1.0.0
 */
export const zero = make(0)

/**
 * Creates a unit vector.
 *
 * @since 1.0.0
 */
export const unit = make(1)

export const add: {
  /**
   * Adds two `Vector4` instances.
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @returns A new `Vector4` instance representing the sum of the two vectors.
   * @since 1.0.0
   */
  (a: Vector4, b: Vector4): Vector4

  /**
   * Adds a `Vector4` instance to another vector.
   *
   * @param b - The second vector.
   * @returns A function that takes the first vector and returns the sum.
   * @since 1.0.0
   */
  (b: Vector4): (a: Vector4) => Vector4
} = internal.add

export const subtract: {
  /**
   * Subtracts one `Vector4` instance from another.
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @returns A new `Vector4` instance representing the difference of the two vectors.
   * @since 1.0.0
   */
  (a: Vector4, b: Vector4): Vector4
  /**
   * Subtracts a `Vector4` instance from another vector.
   *
   * @param b - The second vector.
   * @returns A function that takes the first vector and returns the difference.
   * @since 1.0.0
   */
  (b: Vector4): (a: Vector4) => Vector4
} = internal.subtract

export const hadamard: {
  /**
   * Computes the Hadamard product of two `Vector4` instances.
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @returns A new `Vector4` instance representing the Hadamard product of the two vectors.
   * @since 1.0.0
   */
  (a: Vector4, b: Vector4): Vector4
  /**
   * Computes the Hadamard product of a `Vector4` instance and another vector.
   *
   * @param b - The second vector.
   * @returns A function that takes the first vector and returns the Hadamard product.
   * @since 1.0.0
   */
  (b: Vector4): (a: Vector4) => Vector4
} = internal.hadamard

export const scale: {
  /**
   * Scales a `Vector4` by a scalar.
   *
   * @param s - The scalar to scale the vector by.
   * @returns A function that takes the vector and returns the scaled vector.
   * @since 1.0.0
   */
  (s: number): (v: Vector4) => Vector4
  /**
   * Scales a `Vector4` by a scalar.
   *
   * @param s - The scalar to scale the vector by.
   * @param v - The vector to scale.
   * @returns A new `Vector4` instance representing the scaled vector.
   * @since 1.0.0
   */
  (v: Vector4, s: number): Vector4
} = internal.scale
