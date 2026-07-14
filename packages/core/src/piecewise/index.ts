import * as PiecewiseNs from './piecewise.ts'

export type Piecewise<P, Trait = unknown> = PiecewiseNs.Piecewise<P, Trait>
export type Piece<P> = PiecewiseNs.Piece<P>
export { PiecewiseNs as Piecewise }
