import type { TwoDimensional } from '../dimensions'
import type { Pipeable } from '../pipe'
import * as internal from './vector2.internal'
import type { Vector2TypeId } from './vector2.internal'

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
 * Checks if a value is a `Vector2`.
 *
 * @param v - The value to check.
 * @returns `true` if the value is a `Vector2`, `false` otherwise.
 * @since 1.0.0
 */
export const isVector2: (v: unknown) => v is Vector2 = internal.isVector2

/**
 * Creates a new `Vector2` instance.
 *
 * @param x - The x component of the vector.
 * @param y - The y component of the vector.
 * @returns A new `Vector2` instance.
 * @since 1.0.0
 */
export const make: {
  (xy: number): Vector2
  (x: number, y: number): Vector2
} = internal.make

/**
 * Creates a new `Vector2` instance from polar coordinates.
 *
 * @param r - The radius.
 * @param theta - The angle, in radians.
 * @returns A new `Vector2` instance.
 * @since 1.0.0
 */
export const fromPolar: (r: number, theta: number) => Vector2 =
  internal.fromPolar

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

/**
 * Calculates the angle of a `Vector2`.
 *
 * @param vector - The vector to calculate the angle of.
 * @returns The angle of the vector in radians.
 * @since 1.0.0
 */
export const dot: {
  (a: Vector2, b: Vector2): number
  (b: Vector2): (a: Vector2) => number
} = internal.dot

/**
 * Calculates the cross product of two `Vector2` instances.
 *
 * @param a - The first vector.
 * @param b - The second vector.
 * @returns The cross product of the two vectors.
 * @since 1.0.0
 */
export const cross: {
  (a: Vector2, b: Vector2): number
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

/**
 * Adds two `Vector2` instances together.
 *
 * @param a - The first vector.
 * @param b - The second vector.
 * @returns A new `Vector2` instance representing the sum of the two vectors.
 * @since 1.0.0
 */
export const add: {
  (a: Vector2, b: Vector2): Vector2
  (b: Vector2): (a: Vector2) => Vector2
} = internal.add

/**
 * Subtracts one `Vector2` instance from another.
 *
 * @param a - The vector to subtract from.
 * @param b - The vector to subtract.
 * @returns A new `Vector2` instance representing the difference of the two vectors.
 * @since 1.0.0
 */
export const subtract: {
  (a: Vector2, b: Vector2): Vector2
  (b: Vector2): (a: Vector2) => Vector2
} = internal.subtract

/**
 * Performs the Hadamard product of two `Vector2` instances.
 *
 * @param a - The first vector.
 * @param b - The second vector.
 * @returns A new `Vector2` instance representing the Hadamard product of the two vectors.
 * @since 1.0.0
 */
export const hadamard: {
  (a: Vector2, b: Vector2): Vector2
  (b: Vector2): (a: Vector2) => Vector2
} = internal.hadamard

/**
 * Scales a `Vector2` by a scalar value.
 *
 * @param v - The vector to scale.
 * @param s - The scalar value to scale by.
 * @returns A new `Vector2` instance representing the scaled vector.
 * @since 1.0.0
 */
export const scale: {
  (s: number): (v: Vector2) => Vector2
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

/**
 * Sets the x component of a `Vector2`.
 *
 * @param v - The vector to set the x component of.
 * @param x - The new x component.
 * @returns A new `Vector2` instance with the updated x component.
 * @since 1.0.0
 */
export const setX: {
  (v: Vector2, x: number): Vector2
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

/**
 * Sets the y component of a `Vector2`.
 *
 * @param v - The vector to set the y component of.
 * @param y - The new y component.
 * @returns A new `Vector2` instance with the updated y component.
 * @since 1.0.0
 */
export const setY: {
  (v: Vector2, y: number): Vector2
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

/**
 * Sets the radius of a `Vector2`.
 *
 * @param v - The vector to set the radius of.
 * @param r - The new radius.
 * @returns A new `Vector2` instance with the updated radius.
 * @since 1.0.0
 */
export const setR: {
  (v: Vector2, r: number): Vector2
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

/**
 * Sets the angle of a `Vector2`.
 *
 * @param v - The vector to set the angle of.
 * @param theta - The new angle, in radians.
 * @returns A new `Vector2` instance with the updated angle.
 * @since 1.0.0
 */
export const setTheta: {
  (v: Vector2, theta: number): Vector2
  (theta: number): (v: Vector2) => Vector2
} = internal.setTheta
