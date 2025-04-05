import type { ThreeDimensional } from '../dimensions'
import type { Pipeable } from '../pipe'
import * as internal from './vector3.internal'
import type { Vector3TypeId } from './vector3.internal'

/**
 * A 3D vector.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * @since 1.0.0
 */
export interface Vector3 extends Pipeable, ThreeDimensional<number> {
  readonly [Vector3TypeId]: Vector3TypeId
}

/**
 * Checks if a value is a `Vector3`.
 *
 * @param v - The value to check.
 * @returns `true` if the value is a `Vector3`, `false` otherwise.
 * @since 1.0.0
 */
export const isVector3: (v: unknown) => v is Vector3 = internal.isVector3

export const make: {
  /**
   * Creates a new `Vector3` instance.
   *
   * @param xyz - The x, y, and z components of the vector.
   * @returns A new `Vector3` instance.
   * @since 1.0.0
   */
  (xyz: number): Vector3
  /**
   * Creates a new `Vector3` instance.
   *
   * @param x - The x component of the vector.
   * @param yz - The y and z components of the vector.
   * @returns A new `Vector3` instance.
   * @since 1.0.0
   */
  (x: number, yz: number): Vector3
  /**
   * Creates a new `Vector3` instance.
   *
   * @param x - The x component of the vector.
   * @param y - The y component of the vector.
   * @param z - The z component of the vector.
   * @returns A new `Vector3` instance.
   * @since 1.0.0
   */
  (x: number, y: number, z: number): Vector3
} = internal.make

/**
 * Creates a new `Vector3` instance from spherical coordinates.
 *
 * @param r - The radius.
 * @param theta - The polar angle, in radians. Ranges from 0 to π
 * @param phi - The azimuthal angle, in radians. Ranges from 0 to 2π
 * @returns A new `Vector3` instance.
 * @since 1.0.0
 */
export const fromSpherical: (r: number, theta: number, phi: number) => Vector3 =
  internal.fromSpherical

/**
 * Calculates the magnitude of a `Vector3`.
 *
 * @param vector - The vector to calculate the magnitude of.
 * @returns The magnitude of the vector.
 * @since 1.0.0
 */
export const magnitude: (vector: Vector3) => number = internal.magnitude

/**
 * Calculates the length of a `Vector3`.
 *
 * @param vector - The vector to calculate the length of.
 * @returns The length of the vector.
 * @see {@link magnitude}
 * @since 1.0.0
 */
export const length: (vector: Vector3) => number = magnitude

/**
 * Normalizes a `Vector3`.
 *
 * @param vector - The vector to normalize.
 * @returns A new `Vector3` instance with the same direction as the input vector, but with a magnitude of 1.
 * @since 1.0.0
 */
export const normalize: (vector: Vector3) => Vector3 = internal.normalize

export const dot: {
  /**
   * Calculates the dot product of two `Vector3` instances.
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @returns The dot product of the two vectors.
   * @since 1.0.0
   */
  (a: Vector3, b: Vector3): number
  /**
   * Calculates the dot product of two `Vector3` instances.
   *
   * @param b - The second vector.
   * @returns A function that takes the first vector and returns the dot product.
   * @since 1.0.0
   */
  (b: Vector3): (a: Vector3) => number
} = internal.dot

export const cross: {
  /**
   * Calculates the cross product of two `Vector3` instances.
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @returns A new `Vector3` instance representing the cross product of the two vectors.
   * @since 1.0.0
   */
  (a: Vector3, b: Vector3): Vector3
  /**
   * Calculates the cross product of two `Vector3` instances.
   *
   * @param b - The second vector.
   * @returns A function that takes the first vector and returns the cross product.
   * @since 1.0.0
   */
  (b: Vector3): (a: Vector3) => Vector3
} = internal.cross

/**
 * Returns the components of a `Vector3` as an array.
 *
 * @param v - The vector to get the components of.
 * @returns An array containing the x, y, and z components of the vector.
 * @since 1.0.0
 */
export const components: (v: Vector3) => [number, number, number] = internal.components

/**
 * Calculates the softmax of a `Vector3`.
 *
 * @param v - The vector to calculate the softmax of.
 * @returns A new `Vector3` instance representing the softmax of the input vector.
 * @since 1.0.0
 */
export const softmax: (v: Vector3) => Vector3 = internal.softmax

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
 * Creates a unit vector in the x direction.
 *
 * @since 1.0.0
 */
export const unitX = make(1, 0, 0)

/**
 * Creates a unit vector in the y direction.
 *
 * @since 1.0.0
 */
export const unitY = make(0, 1, 0)

/**
 * Creates a unit vector in the z direction.
 *
 * @since 1.0.0
 */
export const unitZ = make(0, 0, 1)

export const add: {
  /**
   * Adds two `Vector3` instances.
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @returns A new `Vector3` instance representing the sum of the two vectors.
   * @since 1.0.0
   */
  (a: Vector3, b: Vector3): Vector3
  /**
   * Adds two `Vector3` instances.
   *
   * @param b - The second vector.
   * @returns A function that takes the first vector and returns the sum.
   * @since 1.0.0
   */
  (b: Vector3): (a: Vector3) => Vector3
} = internal.add

export const subtract: {
  /**
   * Subtracts one `Vector3` instance from another.
   *
   * @param a - The vector to subtract from.
   * @param b - The vector to subtract.
   * @returns A new `Vector3` instance representing the difference of the two vectors.
   * @since 1.0.0
   */
  (a: Vector3, b: Vector3): Vector3
  /**
   * Subtracts one `Vector3` instance from another.
   *
   * @param b - The vector to subtract.
   * @returns A function that takes the first vector and returns the difference.
   * @since 1.0.0
   */
  (b: Vector3): (a: Vector3) => Vector3
} = internal.subtract

export const hadamard: {
  /**
   * Calculates the Hadamard product of two `Vector3` instances.
   *
   * The Hadamard product is an element-wise multiplication of two vectors.
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @returns A new `Vector3` instance representing the Hadamard product of the two vectors.
   * @since 1.0.0
   */
  (a: Vector3, b: Vector3): Vector3
  /**
   * Calculates the Hadamard product of two `Vector3` instances.
   *
   * The Hadamard product is an element-wise multiplication of two vectors.
   *
   * @param b - The second vector.
   * @returns A function that takes the first vector and returns the Hadamard product.
   * @since 1.0.0
   */
  (b: Vector3): (a: Vector3) => Vector3
} = internal.hadamard

export const scale: {
  /**
   * Scales a `Vector3` instance by a scalar value.
   *
   * @param s - The scalar value to scale by.
   * @return A function that takes a vector and returns the scaled vector.
   * @since 1.0.0
   */
  (s: number): (v: Vector3) => Vector3
  /**
   * Scales a `Vector3` instance by a scalar value.
   *
   * @param s - The scalar value to scale by.
   * @param v - The vector to scale.
   * @returns A new `Vector3` instance representing the scaled vector.
   * @since 1.0.0
   */
  (v: Vector3, s: number): Vector3
} = internal.scale

/**
 * Gets the x component of a `Vector3`.
 *
 * @param v - The vector to get the x component of.
 * @returns The x component of the vector.
 * @since 1.0.0
 */
export const getX: (v: Vector3) => number = internal.getX

export const setX: {
  /**
   * Sets the x component of a `Vector3`.
   *
   * @param v - The vector to set the x component of.
   * @param x - The new x component.
   * @returns A new `Vector3` instance with the updated x component.
   * @since 1.0.0
   */
  (v: Vector3, x: number): Vector3
  /**
   * Sets the x component of a `Vector3`.
   *
   * @param x - The new x component.
   * @returns A function that takes the vector and returns a new `Vector3` instance with the updated x component.
   * @since 1.0.0
   */
  (x: number): (v: Vector3) => Vector3
} = internal.setX

/**
 * Gets the y component of a `Vector3`.
 *
 * @param v - The vector of which to get the y component.
 * @returns The y component of the vector.
 * @since 1.0.0
 */
export const getY: (v: Vector3) => number = internal.getY

export const setY: {
  /**
   * Sets the y component of a `Vector3`.
   *
   * @param v - The vector of which to set the y component.
   * @param y - The new y component.
   * @returns A new `Vector3` instance with the updated y component.
   * @since 1.0.0
   */
  (v: Vector3, y: number): Vector3
  /**
   * Sets the y component of a `Vector3`.
   *
   * @param y - The new y component.
   * @returns A function that takes the vector and returns a new `Vector3` instance with the updated y component.
   * @since 1.0.0
   */
  (y: number): (v: Vector3) => Vector3
} = internal.setY

/**
 * Gets the z component of a `Vector3`.
 *
 * @param v - The vector of which to get the z component.
 * @returns The z component of the vector.
 * @since 1.0.0
 */
export const getZ: (v: Vector3) => number = internal.getZ

export const setZ: {
  /**
   * Sets the z component of a `Vector3`.
   *
   * @param v - The vector of which to set the z component.
   * @param z - The new z component.
   * @returns A new `Vector3` instance with the updated z component.
   * @since 1.0.0
   */
  (v: Vector3, z: number): Vector3
  /**
   * Sets the z component of a `Vector3`.
   *
   * @param z - The new z component.
   * @returns A function that takes the vector and returns a new `Vector3` instance with the updated z component.
   * @since 1.0.0
   */
  (z: number): (v: Vector3) => Vector3
} = internal.setZ

/**
 * Gets the radius of a `Vector3`.
 *
 * @param v - The vector of which to get the radius.
 * @returns The radius of the vector.
 * @since 1.0.0
 */
export const getR: (v: Vector3) => number = magnitude

export const setR: {
  /**
   * Sets the radius of a `Vector3`.
   *
   * @param v - The vector of which to set the radius.
   * @param r - The new radius.
   * @returns A new `Vector3` instance with the updated radius.
   * @since 1.0.0
   */
  (v: Vector3, r: number): Vector3
  /**
   * Sets the radius of a `Vector3`.
   *
   * @param r - The new radius.
   * @returns A function that takes the vector and returns the updated vector.
   * @since 1.0.0
   */
  (r: number): (v: Vector3) => Vector3
} = internal.setR

/**
 * Gets the polar angle (theta) of a `Vector3`.
 *
 * @param v - The vector of which to get the polar angle.
 * @returns The polar angle of the vector.
 * @since 1.0.0
 */
export const getTheta: (v: Vector3) => number = internal.getTheta

export const setTheta: {
  /**
   * Sets the polar angle (theta) of a `Vector3`.
   *
   * @param v - The vector of which to set the polar angle.
   * @param theta - The new polar angle.
   * @returns A new `Vector3` instance with the updated polar angle.
   * @since 1.0.0
   */
  (v: Vector3, theta: number): Vector3
  /**
   * Sets the polar angle (theta) of a `Vector3`.
   *
   * @param theta - The new polar angle.
   * @returns A function that takes the vector and returns the updated vector.
   * @since 1.0.0
   */
  (theta: number): (v: Vector3) => Vector3
} = internal.setTheta

/**
 * Gets the azimuthal angle (phi) of a `Vector3`.
 *
 * @param v - The vector of which to get the azimuthal angle.
 * @returns The azimuthal angle of the vector.
 * @since 1.0.0
 */
export const getPhi: (v: Vector3) => number = internal.getPhi

export const setPhi: {
  /**
   * Sets the azimuthal angle (phi) of a `Vector3`.
   *
   * @param v - The vector of which to set the azimuthal angle.
   * @param phi - The new azimuthal angle.
   * @returns A new `Vector3` instance with the updated azimuthal angle.
   * @since 1.0.0
   */
  (v: Vector3, phi: number): Vector3
  /**
   * Sets the azimuthal angle (phi) of a `Vector3`.
   *
   * @param phi - The new azimuthal angle.
   * @returns A function that takes the vector and returns the updated vector.
   * @since 1.0.0
   */
  (phi: number): (v: Vector3) => Vector3
} = internal.setPhi
