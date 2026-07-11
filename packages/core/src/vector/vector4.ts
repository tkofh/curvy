import type { FourDimensional } from '../dimensions.ts'
import type { Pipeable } from '../utils.ts'
import type { Vector4TypeId } from './vector4.internal.ts'
import * as internal from './vector4.internal.ts'

/**
 * A 4D vector.
 *
 * All fields are readonly. No operation mutates a vector. Operations
 * return new instances, except that identity operations (like scaling by
 * exactly `1`) may return the input itself.
 *
 * Construct via `make` or `fromTuple`.
 *
 * @since 1.0.0
 */
export interface Vector4 extends Pipeable, FourDimensional<number> {
  readonly [Vector4TypeId]: Vector4TypeId
}

/**
 * Checks if a value is a `Vector4`.
 *
 * True only for values built by this module's constructors, which carry
 * the brand. A structural `{ x, y, z, w }` object is not a `Vector4`.
 *
 * @param v - The value to check.
 * @returns `true` if the value is a `Vector4`, `false` otherwise.
 * @since 1.0.0
 */
export const isVector4: (v: unknown) => v is Vector4 = internal.isVector4

export const equals: {
  /**
   * Checks if two `Vector4` instances are approximately equal.
   *
   * Each pair of components is compared with `coincident` from
   * `curvy/number`, an absolute-plus-relative tolerance band. See
   * `PRECISION.md` for the mechanics.
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @returns `true` when each pair of components is within tolerance.
   * @since 2.0.0
   */
  (a: Vector4, b: Vector4): boolean
  /**
   * Checks if two `Vector4` instances are approximately equal.
   *
   * @param b - The second vector.
   * @returns A function that takes the first vector and returns the comparison result.
   * @since 2.0.0
   */
  (b: Vector4): (a: Vector4) => boolean
} = internal.equals

export const make: {
  /**
   * Creates a new `Vector4` with all four components set to `xyzw`.
   *
   * @param xyzw - The value of the x, y, z, and w components.
   * @returns A new `Vector4` instance.
   * @since 1.0.0
   */
  (xyzw: number): Vector4
  /**
   * Creates a new `Vector4` with the y, z, and w components all set to
   * `yzw`.
   *
   * @param x - The x component of the vector.
   * @param yzw - The value of the y, z, and w components.
   * @returns A new `Vector4` instance.
   * @since 1.0.0
   */
  (x: number, yzw: number): Vector4
  /**
   * Creates a new `Vector4` with the z and w components both set to `zw`.
   *
   * @param x - The x component of the vector.
   * @param y - The y component of the vector.
   * @param zw - The value of both the z and w components.
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
 * `components`.
 *
 * @param t - The `[x, y, z, w]` tuple.
 * @returns A new `Vector4` instance.
 * @since 2.0.0
 */
export const fromTuple: (t: readonly [number, number, number, number]) => Vector4 =
  internal.fromTuple

/**
 * Builds one `Vector4` per projected channel from four items: for each
 * output channel, takes the corresponding number from each projected item
 * and packs the four into a `Vector4`. The data-layout transformation
 * NumPy calls a transpose, FP calls `unzip`, and GPUs call a gather.
 *
 * The projection runs once per item and must return the same number of
 * channels for each. The return-tuple arity determines the number of
 * output vectors and is preserved in the return type.
 *
 * @param inputs - Exactly four items of any type.
 * @param project - Extracts a fixed-arity tuple of numbers, one per output channel.
 * @returns A tuple of `Vector4`s with the same arity as the projection's return tuple.
 * @example
 * ```ts
 * // Pack the x and y coordinates of four control points into two Vector4s.
 * const [xs, ys] = Vector4.transpose(
 *   [Vector2.make(1, 2), Vector2.make(3, 4), Vector2.make(5, 6), Vector2.make(7, 8)],
 *   Vector2.components,
 * )
 * // xs = (1, 3, 5, 7), ys = (2, 4, 6, 8)
 * ```
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
 * @returns The Euclidean length `√(x² + y² + z² + w²)`.
 * @since 1.0.0
 */
export const magnitude: (vector: Vector4) => number = internal.magnitude

/**
 * Normalizes a `Vector4` to magnitude `1`, preserving its direction.
 *
 * The zero vector has no direction: `normalize(zero)` is
 * `(NaN, NaN, NaN, NaN)`.
 *
 * @param vector - The vector to normalize.
 * @returns A new `Vector4` instance with the same direction and a magnitude of 1.
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
 * Returns the components of a `Vector4` as an `[x, y, z, w]` tuple.
 *
 * Inverse of `fromTuple`.
 *
 * @param v - The vector to read.
 * @returns The `[x, y, z, w]` tuple.
 * @since 1.0.0
 */
export const components: (v: Vector4) => [number, number, number, number] = internal.components

/**
 * Applies the softmax function to a `Vector4`: `(eˣ, eʸ, eᶻ, eʷ)` scaled
 * to sum to `1`.
 *
 * All result components are positive and sum to `1`. Equal inputs produce
 * `(¼, ¼, ¼, ¼)`. Large components do not overflow.
 *
 * @param v - The vector to transform.
 * @returns A new `Vector4` with positive components summing to `1`.
 * @since 1.0.0
 */
export const softmax: (v: Vector4) => Vector4 = internal.softmax

/**
 * The zero vector `(0, 0, 0, 0)`: the additive identity.
 *
 * @since 1.0.0
 */
export const zero = make(0)

/**
 * The all-ones vector `(1, 1, 1, 1)`: the `hadamard` identity.
 *
 * @since 1.0.0
 */
export const one = make(1)

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
   * Subtracts `b` from `a`, component-wise.
   *
   * @param a - The vector subtracted from.
   * @param b - The vector to subtract.
   * @returns A new `Vector4` representing `a - b`.
   * @since 1.0.0
   */
  (a: Vector4, b: Vector4): Vector4
  /**
   * Subtracts the given vector from another, component-wise.
   *
   * @param b - The vector to subtract.
   * @returns A function that takes a vector and subtracts `b` from it.
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
   * @param v - The vector to scale.
   * @param s - The scalar to scale the vector by.
   * @returns A new `Vector4` scaled by `s`, or the input instance itself when `s` is exactly `1`.
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
