import type { ThreeDimensional } from '../dimensions.ts'
import type { Pipeable } from '../utils.ts'
import type { Vector3TypeId } from './vector3.internal.ts'
import * as internal from './vector3.internal.ts'

/**
 * A 3D vector.
 *
 * All fields are readonly. No operation mutates a vector. Operations
 * return new instances, except that identity operations (like scaling by
 * exactly `1`) may return the input itself.
 *
 * Construct via `make`, `fromTuple`, or `fromSpherical`.
 *
 * @since 1.0.0
 */
export interface Vector3 extends Pipeable, ThreeDimensional<number> {
  readonly [Vector3TypeId]: Vector3TypeId
}

/**
 * Checks if a value is a `Vector3`.
 *
 * True only for values built by this module's constructors, which carry
 * the brand. A structural `{ x, y, z }` object is not a `Vector3`.
 *
 * @param v - The value to check.
 * @returns `true` if the value is a `Vector3`, `false` otherwise.
 * @since 1.0.0
 */
export const isVector3: (v: unknown) => v is Vector3 = internal.isVector3

export const equals: {
  /**
   * Checks if two `Vector3` instances are approximately equal.
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
  (a: Vector3, b: Vector3): boolean
  /**
   * Checks if two `Vector3` instances are approximately equal.
   *
   * @param b - The second vector.
   * @returns A function that takes the first vector and returns the comparison result.
   * @since 2.0.0
   */
  (b: Vector3): (a: Vector3) => boolean
} = internal.equals

export const make: {
  /**
   * Creates a new `Vector3` with all three components set to `xyz`.
   *
   * @param xyz - The value of the x, y, and z components.
   * @returns A new `Vector3` instance.
   * @since 1.0.0
   */
  (xyz: number): Vector3
  /**
   * Creates a new `Vector3` with the y and z components both set to `yz`.
   *
   * @param x - The x component of the vector.
   * @param yz - The value of both the y and z components.
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
 * Creates a new `Vector3` instance from a `[x, y, z]` tuple. Inverse of
 * `components`.
 *
 * @param t - The `[x, y, z]` tuple.
 * @returns A new `Vector3` instance.
 * @since 2.0.0
 */
export const fromTuple: (t: readonly [number, number, number]) => Vector3 = internal.fromTuple

/**
 * Builds one `Vector3` per projected channel from a triple of items:
 * vector `k` holds channel `k` of each input, in input order.
 *
 * The projection runs once per item and must return the same number of
 * channels for each. The result holds one vector per channel, in channel
 * order.
 *
 * @param inputs - Exactly three items of any type.
 * @param project - Extracts a fixed-arity tuple of numbers, one per output channel.
 * @returns A tuple of `Vector3`s with the same arity as the projection's return tuple.
 * @example
 * ```ts
 * const [xs, ys, zs] = Vector3.transpose(
 *   [Vector3.make(1, 2, 3), Vector3.make(4, 5, 6), Vector3.make(7, 8, 9)],
 *   Vector3.components,
 * )
 * // xs = (1, 4, 7), ys = (2, 5, 8), zs = (3, 6, 9)
 * ```
 * @since 2.0.0
 */
export const transpose: <T, const Channels extends ReadonlyArray<number>>(
  inputs: readonly [T, T, T],
  project: (item: T) => Channels,
) => { readonly [K in keyof Channels]: Vector3 } = internal.transpose

/**
 * Creates a new `Vector3` instance from spherical coordinates
 * (physics convention: `theta` is inclination, `phi` is azimuth).
 *
 * No range is enforced. The formula is total. Values outside the
 * conventional ranges land where the trigonometry sends them.
 *
 * @param r - The radius. A negative radius reflects through the origin.
 * @param theta - The inclination from the positive z-axis, in radians. Conventionally `[0, π]`.
 * @param phi - The azimuth from the positive x-axis in the xy-plane, in radians.
 * @returns The vector `(r·sin(theta)·cos(phi), r·sin(theta)·sin(phi), r·cos(theta))`.
 * @since 1.0.0
 */
export const fromSpherical: (r: number, theta: number, phi: number) => Vector3 =
  internal.fromSpherical

/**
 * Calculates the magnitude of a `Vector3`.
 *
 * @param vector - The vector to calculate the magnitude of.
 * @returns The Euclidean length `√(x² + y² + z²)`.
 * @since 1.0.0
 */
export const magnitude: (vector: Vector3) => number = internal.magnitude

/**
 * Calculates the length of a `Vector3`. Alias of `magnitude`.
 *
 * @param vector - The vector to calculate the length of.
 * @returns The Euclidean length `√(x² + y² + z²)`.
 * @since 1.0.0
 */
export const length: (vector: Vector3) => number = magnitude

/**
 * Normalizes a `Vector3` to magnitude `1`, preserving its direction.
 *
 * The zero vector has no direction, so `normalize(zero)` is
 * `(NaN, NaN, NaN)`.
 *
 * @param vector - The vector to normalize.
 * @returns A new `Vector3` instance with the same direction and a magnitude of 1.
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
   * The result is perpendicular to both inputs, right-handed:
   * `cross(unitX, unitY)` is `unitZ`. Its magnitude is the area of the
   * parallelogram the inputs span, so parallel or zero inputs give the
   * zero vector. Anticommutative. `cross(b, a)` is `-cross(a, b)`.
   *
   * @param a - The first vector.
   * @param b - The second vector.
   * @returns A new `Vector3` perpendicular to both inputs.
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
 * Returns the components of a `Vector3` as an `[x, y, z]` tuple.
 *
 * Inverse of `fromTuple`.
 *
 * @param v - The vector to read.
 * @returns The `[x, y, z]` tuple.
 * @since 1.0.0
 */
export const components: (v: Vector3) => [number, number, number] = internal.components

/**
 * Applies the softmax function to a `Vector3`: `(eˣ, eʸ, eᶻ)` scaled to
 * sum to `1`.
 *
 * All result components are positive and sum to `1`. Equal inputs produce
 * `(⅓, ⅓, ⅓)`. Large components do not overflow.
 *
 * @param v - The vector to transform.
 * @returns A new `Vector3` with positive components summing to `1`.
 * @since 1.0.0
 */
export const softmax: (v: Vector3) => Vector3 = internal.softmax

/**
 * The zero vector `(0, 0, 0)`, the additive identity.
 *
 * @since 1.0.0
 */
export const zero = make(0)

/**
 * The all-ones vector `(1, 1, 1)`, the `hadamard` identity.
 *
 * @since 1.0.0
 */
export const one = make(1)

/**
 * The unit vector `(1, 0, 0)` along the x-axis.
 *
 * @since 1.0.0
 */
export const unitX = make(1, 0, 0)

/**
 * The unit vector `(0, 1, 0)` along the y-axis.
 *
 * @since 1.0.0
 */
export const unitY = make(0, 1, 0)

/**
 * The unit vector `(0, 0, 1)` along the z-axis.
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
   * Subtracts `b` from `a`, component-wise.
   *
   * @param a - The vector subtracted from.
   * @param b - The vector to subtract.
   * @returns A new `Vector3` representing `a - b`.
   * @since 1.0.0
   */
  (a: Vector3, b: Vector3): Vector3
  /**
   * Subtracts the given vector from another, component-wise.
   *
   * @param b - The vector to subtract.
   * @returns A function that takes a vector and subtracts `b` from it.
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
   * @returns A function that takes a vector and returns the scaled vector.
   * @since 1.0.0
   */
  (s: number): (v: Vector3) => Vector3
  /**
   * Scales a `Vector3` instance by a scalar value.
   *
   * @param v - The vector to scale.
   * @param s - The scalar value to scale by.
   * @returns A new `Vector3` scaled by `s`, or the input instance itself when `s` is exactly `1`.
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

export const mapX: {
  /**
   * Returns a new `Vector3` with the x component replaced by `f(v.x)`.
   *
   * @param v - The vector to update.
   * @param f - The function to apply to the x component.
   * @returns A new `Vector3` with the updated x.
   * @since 2.0.0
   */
  (v: Vector3, f: (x: number) => number): Vector3
  /**
   * Returns a new `Vector3` with the x component replaced by `f(v.x)`.
   *
   * @param f - The function to apply to the x component.
   * @returns A function that takes a vector and returns the updated vector.
   * @since 2.0.0
   */
  (f: (x: number) => number): (v: Vector3) => Vector3
} = internal.mapX

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

export const mapY: {
  /**
   * Returns a new `Vector3` with the y component replaced by `f(v.y)`.
   *
   * @param v - The vector to update.
   * @param f - The function to apply to the y component.
   * @returns A new `Vector3` with the updated y.
   * @since 2.0.0
   */
  (v: Vector3, f: (y: number) => number): Vector3
  /**
   * Returns a new `Vector3` with the y component replaced by `f(v.y)`.
   *
   * @param f - The function to apply to the y component.
   * @returns A function that takes a vector and returns the updated vector.
   * @since 2.0.0
   */
  (f: (y: number) => number): (v: Vector3) => Vector3
} = internal.mapY

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

export const mapZ: {
  /**
   * Returns a new `Vector3` with the z component replaced by `f(v.z)`.
   *
   * @param v - The vector to update.
   * @param f - The function to apply to the z component.
   * @returns A new `Vector3` with the updated z.
   * @since 2.0.0
   */
  (v: Vector3, f: (z: number) => number): Vector3
  /**
   * Returns a new `Vector3` with the z component replaced by `f(v.z)`.
   *
   * @param f - The function to apply to the z component.
   * @returns A function that takes a vector and returns the updated vector.
   * @since 2.0.0
   */
  (f: (z: number) => number): (v: Vector3) => Vector3
} = internal.mapZ

/**
 * Gets the spherical radius of a `Vector3`.
 *
 * @param v - The vector of which to get the radius.
 * @returns The radius (the vector's magnitude).
 * @since 1.0.0
 */
export const getR: (v: Vector3) => number = magnitude

export const setR: {
  /**
   * Sets the spherical radius of a `Vector3`, preserving its direction.
   *
   * A negative `r` reflects through the origin. The zero vector has no
   * direction to preserve, so `setR(zero, r)` is `(NaN, NaN, NaN)`.
   *
   * @param v - The vector of which to set the radius.
   * @param r - The new radius.
   * @returns A new `Vector3` instance with the updated radius.
   * @since 1.0.0
   */
  (v: Vector3, r: number): Vector3
  /**
   * Sets the spherical radius of a `Vector3`, preserving its direction.
   *
   * @param r - The new radius.
   * @returns A function that takes the vector and returns the updated vector.
   * @since 1.0.0
   */
  (r: number): (v: Vector3) => Vector3
} = internal.setR

export const mapR: {
  /**
   * Returns a new `Vector3` with the radius replaced by `f(magnitude(v))`,
   * preserving direction.
   *
   * For the zero vector the result is `(NaN, NaN, NaN)`, since it has no
   * direction to preserve.
   *
   * @param v - The vector to update.
   * @param f - The function to apply to the radius.
   * @returns A new `Vector3` with the updated radius.
   * @since 2.0.0
   */
  (v: Vector3, f: (r: number) => number): Vector3
  /**
   * Returns a new `Vector3` with the radius replaced by `f(magnitude(v))`,
   * preserving direction.
   *
   * @param f - The function to apply to the radius.
   * @returns A function that takes a vector and returns the updated vector.
   * @since 2.0.0
   */
  (f: (r: number) => number): (v: Vector3) => Vector3
} = internal.mapR

/**
 * Gets the polar angle (theta) of a `Vector3`, measured as inclination
 * from the positive z-axis.
 *
 * Unlike `Vector2.getTheta` (an azimuth), this is the physics-convention
 * inclination. The in-plane angle here is `getPhi`.
 *
 * @param v - The vector of which to get the polar angle.
 * @returns The inclination `acos(z / magnitude(v))`, in radians, in `[0, π]`. `NaN` for the zero vector.
 * @since 1.0.0
 */
export const getTheta: (v: Vector3) => number = internal.getTheta

export const setTheta: {
  /**
   * Sets the polar angle (theta) of a `Vector3`, preserving its magnitude
   * and azimuth (phi).
   *
   * The zero vector stays zero, since it has magnitude `0` at every angle.
   *
   * @param v - The vector of which to set the polar angle.
   * @param theta - The new inclination from the positive z-axis, in radians.
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

export const mapTheta: {
  /**
   * Returns a new `Vector3` with the polar angle replaced by
   * `f(getTheta(v))`.
   *
   * @param v - The vector to update.
   * @param f - The function to apply to the polar angle (in radians).
   * @returns A new `Vector3` with the updated polar angle.
   * @since 2.0.0
   */
  (v: Vector3, f: (theta: number) => number): Vector3
  /**
   * Returns a new `Vector3` with the polar angle replaced by
   * `f(getTheta(v))`.
   *
   * @param f - The function to apply to the polar angle (in radians).
   * @returns A function that takes a vector and returns the updated vector.
   * @since 2.0.0
   */
  (f: (theta: number) => number): (v: Vector3) => Vector3
} = internal.mapTheta

/**
 * Gets the azimuthal angle (phi) of a `Vector3`, measured from the
 * positive x-axis within the xy-plane.
 *
 * @param v - The vector of which to get the azimuthal angle.
 * @returns The azimuth `atan2(y, x)`, in radians, in `[-π, π]`. `0` for any vector on the z-axis.
 * @since 1.0.0
 */
export const getPhi: (v: Vector3) => number = internal.getPhi

export const setPhi: {
  /**
   * Sets the azimuthal angle (phi) of a `Vector3`, preserving its
   * magnitude and inclination (theta).
   *
   * The zero vector stays zero, since it has magnitude `0` at every angle.
   *
   * @param v - The vector of which to set the azimuthal angle.
   * @param phi - The new azimuth from the positive x-axis in the xy-plane, in radians.
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

export const mapPhi: {
  /**
   * Returns a new `Vector3` with the azimuthal angle replaced by
   * `f(getPhi(v))`.
   *
   * @param v - The vector to update.
   * @param f - The function to apply to the azimuthal angle (in radians).
   * @returns A new `Vector3` with the updated azimuthal angle.
   * @since 2.0.0
   */
  (v: Vector3, f: (phi: number) => number): Vector3
  /**
   * Returns a new `Vector3` with the azimuthal angle replaced by
   * `f(getPhi(v))`.
   *
   * @param f - The function to apply to the azimuthal angle (in radians).
   * @returns A function that takes a vector and returns the updated vector.
   * @since 2.0.0
   */
  (f: (phi: number) => number): (v: Vector3) => Vector3
} = internal.mapPhi
