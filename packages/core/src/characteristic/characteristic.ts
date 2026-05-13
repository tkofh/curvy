import * as Matrix4x4 from '../matrix/matrix4x4'
import * as CubicPolynomial from '../polynomial/cubic'
import { roundDown } from '../number'
import type * as Vector4 from '../vector/vector4'

/**
 * The cubic Bézier characteristic matrix.
 *
 * Maps Bernstein-basis control points `(P₀, P₁, P₂, P₃)` to monomial cubic
 * coefficients `(c₀, c₁, c₂, c₃)` for `c₀ + c₁·t + c₂·t² + c₃·t³`. The matrix
 * IS the Bézier spline family — combined with control points (via {@link apply}),
 * it produces the cubic polynomial that parameterizes the curve.
 *
 * @since 2.0.0
 */
export const cubicBezier: Matrix4x4.Matrix4x4 = Matrix4x4.make(
  1,
  0,
  0,
  0,
  -3,
  3,
  0,
  0,
  3,
  -6,
  3,
  0,
  -1,
  3,
  -3,
  1,
)

/**
 * The cubic Hermite characteristic matrix.
 *
 * Maps Hermite control data `(P₀, V₀, P₁, V₁)` — two endpoints and two
 * tangent vectors — to monomial cubic coefficients.
 *
 * @since 2.0.0
 */
export const cubicHermite: Matrix4x4.Matrix4x4 = Matrix4x4.make(
  1,
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  -3,
  -2,
  3,
  -1,
  2,
  1,
  -2,
  1,
)

/**
 * The uniform cubic B-spline (basis spline) characteristic matrix.
 *
 * Maps a window of four control points to the monomial cubic coefficients
 * of one segment of the corresponding uniform cubic B-spline. Stride-1
 * application produces a C² piecewise spline; the curve does not generally
 * pass through the control points.
 *
 * @since 2.0.0
 */
export const cubicBasisSpline: Matrix4x4.Matrix4x4 = Matrix4x4.make(
  1 / 6,
  4 / 6,
  roundDown(1 / 6),
  0,
  -0.5,
  0,
  0.5,
  0,
  0.5,
  -1,
  0.5,
  0,
  -1 / 6,
  0.5,
  -0.5,
  1 / 6,
)

const cardinalCache = new Map<number, Matrix4x4.Matrix4x4>()

/**
 * The cubic Cardinal spline characteristic matrix, parameterized by tension.
 *
 * Maps four control points to the monomial cubic coefficients of one
 * Cardinal segment. The tension `s` controls how tightly the curve hugs
 * the control points: `s = 0` produces straight-line segments between
 * adjacent points, `s = 0.5` is the Catmull-Rom variant (see
 * {@link cubicCatmullRom}), and higher values produce looser, more curved
 * shapes.
 *
 * Cached per tension value — repeated calls with the same tension return
 * the same matrix instance.
 *
 * @param tension - The tension parameter.
 * @returns The characteristic matrix for that tension.
 * @since 2.0.0
 */
export const cubicCardinal = (tension: number): Matrix4x4.Matrix4x4 => {
  let m = cardinalCache.get(tension)
  if (m === undefined) {
    m = Matrix4x4.make(
      0,
      1,
      0,
      0,
      -tension,
      0,
      tension,
      0,
      2 * tension,
      tension - 3,
      3 - 2 * tension,
      -tension,
      -tension,
      2 - tension,
      tension - 2,
      tension,
    )
    cardinalCache.set(tension, m)
  }
  return m
}

/**
 * The cubic Catmull-Rom characteristic matrix — Cardinal with tension `0.5`.
 * The most common Cardinal-family variant; reused widely enough to deserve
 * a constant.
 *
 * @since 2.0.0
 */
export const cubicCatmullRom: Matrix4x4.Matrix4x4 = cubicCardinal(0.5)

/**
 * Applies a characteristic matrix to N channels of control values, producing
 * N cubic polynomials in monomial form.
 *
 * Each channel is a `Vector4` packing one axis's values across the four
 * control points: `(v₀, v₁, v₂, v₃)`. The result tuple has the same arity
 * as the input.
 *
 * The polynomial 2D spline pipeline applies this with two channels (x, y);
 * the rational 2D pipeline uses three (x, y, w) where `w` is the projective
 * denominator. Higher channel counts generalize to 3D, rational 3D, and
 * beyond — the characteristic matrix doesn't care about the geometric
 * domain, only about how to combine four samples per channel.
 *
 * @param matrix - The characteristic matrix of the spline family.
 * @param channels - One `Vector4` per output polynomial, packing the four control values for that channel.
 * @returns A tuple of cubic polynomials, one per input channel.
 * @since 2.0.0
 */
export const apply = <const Channels extends ReadonlyArray<Vector4.Vector4>>(
  matrix: Matrix4x4.Matrix4x4,
  ...channels: Channels
): { readonly [K in keyof Channels]: CubicPolynomial.CubicPolynomial } => {
  const result = channels.map((c) =>
    CubicPolynomial.fromVector(Matrix4x4.vectorProductLeft(matrix, c)),
  )
  return result as { readonly [K in keyof Channels]: CubicPolynomial.CubicPolynomial }
}
