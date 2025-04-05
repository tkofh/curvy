import type { FourDimensional } from '../dimensions'
import type { Pipeable } from '../pipe'
import * as internal from './vector4.internal'
import type { Vector4TypeId } from './vector4.internal'

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
export const make: {
  (xyzw: number): Vector4
  (x: number, yzw: number): Vector4
  (x: number, y: number, zw: number): Vector4
  (x: number, y: number, z: number, w: number): Vector4
} = internal.make

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

/**
 * Computes the dot product of two `Vector4` instances.
 *
 * @param a - The first vector.
 * @param b - The second vector.
 * @returns The dot product of the two vectors.
 * @since 1.0.0
 */
export const dot: {
  (a: Vector4, b: Vector4): number
  (b: Vector4): (a: Vector4) => number
} = internal.dot

/**
 * Returns the components of a `Vector4` as an array.
 *
 * @param v - The vector to get the components of.
 * @returns An array containing the x, y, z, and w components of the vector.
 * @since 1.0.0
 */
export const components: (v: Vector4) => [number, number, number, number] =
  internal.components

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

/**
 * Adds two `Vector4` instances.
 *
 * @param a - The first vector.
 * @param b - The second vector.
 * @returns A new `Vector4` instance representing the sum of the two vectors.
 * @since 1.0.0
 */
export const add: {
  (a: Vector4, b: Vector4): Vector4
  (b: Vector4): (a: Vector4) => Vector4
} = internal.add

/**
 * Subtracts one `Vector4` instance from another.
 *
 * @param a - The first vector.
 * @param b - The second vector.
 * @returns A new `Vector4` instance representing the difference of the two vectors.
 * @since 1.0.0
 */
export const subtract: {
  (a: Vector4, b: Vector4): Vector4
  (b: Vector4): (a: Vector4) => Vector4
} = internal.subtract

/**
 * Computes the Hadamard product of two `Vector4` instances.
 *
 * @param a - The first vector.
 * @param b - The second vector.
 * @returns A new `Vector4` instance representing the Hadamard product of the two vectors.
 * @since 1.0.0
 */
export const hadamard: {
  (a: Vector4, b: Vector4): Vector4
  (b: Vector4): (a: Vector4) => Vector4
} = internal.hadamard

/**
 * Scales a `Vector4` by a scalar.
 *
 * @param s - The scalar to scale the vector by.
 * @param v - The vector to scale.
 * @returns A new `Vector4` instance representing the scaled vector.
 * @since 1.0.0
 */
export const scale: {
  (s: number): (v: Vector4) => Vector4
  (v: Vector4, s: number): Vector4
} = internal.scale
