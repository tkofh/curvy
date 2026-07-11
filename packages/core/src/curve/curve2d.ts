import type { Closed, Interval } from '../interval/interval.ts'
import type { Interval2d } from '../interval/interval2d.ts'
import type * as Solution from '../solution/solution.ts'
import type { Affine2d } from '../transform/affine2d.ts'
import type { Vector2 } from '../vector/vector2.ts'

/**
 * The minimal operation bundle a curve module must provide for the generic
 * `Path2d` to be built over it. Each polynomial curve module
 * (`LinearCurve2d`, `QuadraticCurve2d`, `CubicCurve2d`) exports an `Ops`
 * instance which the corresponding path module passes to
 * `Path2d.make(ops)` to derive its operation surface.
 *
 * The interface stays small. Anything that isn't shared structurally
 * across curve degrees stays on the per-degree module.
 *
 * @since 2.0.0
 */
export interface Curve2dOps<C> {
  /**
   * Evaluate the curve at parameter `t in [0, 1]`.
   */
  solve(c: C, t: number): Vector2

  /**
   * Closed-form value at `t = 0`.
   */
  startPoint(c: C): Vector2

  /**
   * Closed-form value at `t = 1`.
   */
  endPoint(c: C): Vector2

  /**
   * Arc length over an interval of the curve's domain.
   */
  length(c: C, interval: Interval): number

  /**
   * Axis-aligned bounding box over the unit interval `[0, 1]`.
   */
  boundingBox(c: C): Interval2d<Closed, Closed>

  /**
   * Inverse solve for x. Path-level callers enforce single-valuedness via
   * the path's `MonotonicX` brand, so the result is narrowed to `AtMostOne`.
   */
  solveAtX(c: C, x: number): Solution.AtMostOne<number>

  /**
   * y-axis analog of `solveAtX`.
   */
  solveAtY(c: C, y: number): Solution.AtMostOne<number>

  /**
   * SVG path-data drawing command for one segment (`L ...`, `Q ...`, `C ...`),
   * without a leading `M`. Move-insertion is decided by the path-level
   * `toPathData` based on continuity with the previous segment.
   */
  toPathDataSegment(c: C): string

  /**
   * Whether the curve's x is strictly increasing on `[0, 1]`.
   */
  isIncreasingX(c: C): boolean

  /**
   * Whether the curve's x is strictly decreasing on `[0, 1]`.
   */
  isDecreasingX(c: C): boolean

  /**
   * Whether the curve's y is strictly increasing on `[0, 1]`.
   */
  isIncreasingY(c: C): boolean

  /**
   * Whether the curve's y is strictly decreasing on `[0, 1]`.
   */
  isDecreasingY(c: C): boolean

  /**
   * Apply an affine transform to the curve, returning a new curve whose
   * geometric image is the affine image of the original.
   *
   * For non-rational coefficient-form curves this is per-coefficient. The
   * constant coefficient receives the full affine, and all higher-degree
   * coefficients receive only the linear part. For rational curves the
   * translation is folded into the numerator polynomials weighted by the
   * denominator. Path-level callers route through this op per curve.
   */
  transform(c: C, a: Affine2d): C
}
