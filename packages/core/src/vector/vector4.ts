import type { FourDimensional } from '../dimensions.ts'
import type { Pipeable } from '../utils.ts'
import type { Vector4TypeId } from './vector4.internal.ts'
import * as internal from './vector4.internal.ts'

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
 * Creates a new `Vector4` instance from a `[x, y, z, w]` tuple. Inverse of
 * {@link components}.
 *
 * @param t - The `[x, y, z, w]` tuple.
 * @returns A new `Vector4` instance.
 * @since 2.0.0
 */
export const fromTuple: (t: readonly [number, number, number, number]) => Vector4 =
  internal.fromTuple

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
 * @since 2.0.0
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

/**
 * Gets the x component of a `Vector4`.
 *
 * @param v - The vector to get the x component of.
 * @returns The x component of the vector.
 * @since 2.0.0
 */
export const getX: (v: Vector4) => number = internal.getX

export const setX: {
  /**
   * Sets the x component of a `Vector4`.
   *
   * @param v - The vector to set the x component of.
   * @param x - The new x component.
   * @returns A new `Vector4` instance with the updated x component.
   * @since 2.0.0
   */
  (v: Vector4, x: number): Vector4
  /**
   * Sets the x component of a `Vector4`.
   *
   * @param x - The new x component.
   * @returns A function that takes a vector and returns the updated vector.
   * @since 2.0.0
   */
  (x: number): (v: Vector4) => Vector4
} = internal.setX

export const mapX: {
  /**
   * Returns a new `Vector4` with the x component replaced by `f(v.x)`.
   *
   * @param v - The vector to update.
   * @param f - The function to apply to the x component.
   * @returns A new `Vector4` with the updated x.
   * @since 2.0.0
   */
  (v: Vector4, f: (x: number) => number): Vector4
  /**
   * Returns a new `Vector4` with the x component replaced by `f(v.x)`.
   *
   * @param f - The function to apply to the x component.
   * @returns A function that takes a vector and returns the updated vector.
   * @since 2.0.0
   */
  (f: (x: number) => number): (v: Vector4) => Vector4
} = internal.mapX

/**
 * Gets the y component of a `Vector4`.
 *
 * @param v - The vector to get the y component of.
 * @returns The y component of the vector.
 * @since 2.0.0
 */
export const getY: (v: Vector4) => number = internal.getY

export const setY: {
  /**
   * Sets the y component of a `Vector4`.
   *
   * @param v - The vector to set the y component of.
   * @param y - The new y component.
   * @returns A new `Vector4` instance with the updated y component.
   * @since 2.0.0
   */
  (v: Vector4, y: number): Vector4
  /**
   * Sets the y component of a `Vector4`.
   *
   * @param y - The new y component.
   * @returns A function that takes a vector and returns the updated vector.
   * @since 2.0.0
   */
  (y: number): (v: Vector4) => Vector4
} = internal.setY

export const mapY: {
  /**
   * Returns a new `Vector4` with the y component replaced by `f(v.y)`.
   *
   * @param v - The vector to update.
   * @param f - The function to apply to the y component.
   * @returns A new `Vector4` with the updated y.
   * @since 2.0.0
   */
  (v: Vector4, f: (y: number) => number): Vector4
  /**
   * Returns a new `Vector4` with the y component replaced by `f(v.y)`.
   *
   * @param f - The function to apply to the y component.
   * @returns A function that takes a vector and returns the updated vector.
   * @since 2.0.0
   */
  (f: (y: number) => number): (v: Vector4) => Vector4
} = internal.mapY

/**
 * Gets the z component of a `Vector4`.
 *
 * @param v - The vector to get the z component of.
 * @returns The z component of the vector.
 * @since 2.0.0
 */
export const getZ: (v: Vector4) => number = internal.getZ

export const setZ: {
  /**
   * Sets the z component of a `Vector4`.
   *
   * @param v - The vector to set the z component of.
   * @param z - The new z component.
   * @returns A new `Vector4` instance with the updated z component.
   * @since 2.0.0
   */
  (v: Vector4, z: number): Vector4
  /**
   * Sets the z component of a `Vector4`.
   *
   * @param z - The new z component.
   * @returns A function that takes a vector and returns the updated vector.
   * @since 2.0.0
   */
  (z: number): (v: Vector4) => Vector4
} = internal.setZ

export const mapZ: {
  /**
   * Returns a new `Vector4` with the z component replaced by `f(v.z)`.
   *
   * @param v - The vector to update.
   * @param f - The function to apply to the z component.
   * @returns A new `Vector4` with the updated z.
   * @since 2.0.0
   */
  (v: Vector4, f: (z: number) => number): Vector4
  /**
   * Returns a new `Vector4` with the z component replaced by `f(v.z)`.
   *
   * @param f - The function to apply to the z component.
   * @returns A function that takes a vector and returns the updated vector.
   * @since 2.0.0
   */
  (f: (z: number) => number): (v: Vector4) => Vector4
} = internal.mapZ

/**
 * Gets the w component of a `Vector4`.
 *
 * @param v - The vector to get the w component of.
 * @returns The w component of the vector.
 * @since 2.0.0
 */
export const getW: (v: Vector4) => number = internal.getW

export const setW: {
  /**
   * Sets the w component of a `Vector4`.
   *
   * @param v - The vector to set the w component of.
   * @param w - The new w component.
   * @returns A new `Vector4` instance with the updated w component.
   * @since 2.0.0
   */
  (v: Vector4, w: number): Vector4
  /**
   * Sets the w component of a `Vector4`.
   *
   * @param w - The new w component.
   * @returns A function that takes a vector and returns the updated vector.
   * @since 2.0.0
   */
  (w: number): (v: Vector4) => Vector4
} = internal.setW

export const mapW: {
  /**
   * Returns a new `Vector4` with the w component replaced by `f(v.w)`.
   *
   * @param v - The vector to update.
   * @param f - The function to apply to the w component.
   * @returns A new `Vector4` with the updated w.
   * @since 2.0.0
   */
  (v: Vector4, f: (w: number) => number): Vector4
  /**
   * Returns a new `Vector4` with the w component replaced by `f(v.w)`.
   *
   * @param f - The function to apply to the w component.
   * @returns A function that takes a vector and returns the updated vector.
   * @since 2.0.0
   */
  (f: (w: number) => number): (v: Vector4) => Vector4
} = internal.mapW
