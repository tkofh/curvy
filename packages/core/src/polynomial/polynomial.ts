import type { Closed } from '../interval/interval.ts'

/**
 * The per-degree operation bundle a polynomial module provides for the generic
 * `Piecewise` to be built over it — the polynomial-degree analog of
 * `Curve2dOps` in `curve/curve2d.ts`. Each polynomial module
 * (`LinearPolynomial`, `QuadraticPolynomial`, `CubicPolynomial`) exports an
 * `Ops` instance; a `Piecewise` resolves the one matching its pieces' degree
 * once at construction, so evaluation carries no per-call dispatch.
 *
 * Every operation reads the polynomial in the piece-local normalized coordinate
 * `u in [0, 1]` — the coordinate each `Piecewise` piece lives in — so the
 * classifiers and the range are taken over the unit interval, not over the
 * polynomial's whole real domain.
 *
 * `D` is the degree the derivative lowers to: a `CubicPolynomial` differentiates
 * to a `QuadraticPolynomial`, a quadratic to a linear, and a linear to a
 * constant carried as a zero-slope `LinearPolynomial`.
 *
 * @since 2.0.0
 */
export interface PolynomialOps<P, D = unknown> {
  /**
   * Evaluate the polynomial at the piece-local coordinate `u in [0, 1]`.
   */
  solve(p: P, u: number): number

  /**
   * Exact value range over the unit interval `[0, 1]`, interior extrema
   * included.
   */
  unitRange(p: P): Closed

  /**
   * Whether the polynomial is strictly increasing over `[0, 1]`.
   */
  isIncreasing(p: P): boolean

  /**
   * Whether the polynomial is strictly decreasing over `[0, 1]`.
   */
  isDecreasing(p: P): boolean

  /**
   * Derivative with respect to x, one degree lower. The polynomial is a
   * function of the piece-local coordinate `u = (x - start) / width`, so the
   * chain rule scales its u-derivative by `dudx = du/dx = 1 / width`; the caller
   * passes that factor and receives `df/dx` directly, expressed in the same
   * local coordinate.
   */
  derivative(p: P, dudx: number): D
}
