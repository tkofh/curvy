import * as LinearPolynomialNs from './linear.ts'
import * as QuadraticPolynomialNs from './quadratic.ts'
import * as CubicPolynomialNs from './cubic.ts'

export type LinearPolynomial<Traits = unknown> = LinearPolynomialNs.LinearPolynomial<Traits>
export { LinearPolynomialNs as LinearPolynomial }

export type QuadraticPolynomial<Traits = unknown> =
  QuadraticPolynomialNs.QuadraticPolynomial<Traits>
export { QuadraticPolynomialNs as QuadraticPolynomial }

export type CubicPolynomial<Traits = unknown> = CubicPolynomialNs.CubicPolynomial<Traits>
export { CubicPolynomialNs as CubicPolynomial }
