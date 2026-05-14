import * as LinearPath2dNs from './linear2d.ts'
import * as QuadraticPath2dNs from './quadratic2d.ts'
import * as CubicPath2dNs from './cubic2d.ts'
import * as RationalCubicPath2dNs from './rationalCubic2d.ts'

export type LinearPath2d<Trait = unknown> = LinearPath2dNs.LinearPath2d<Trait>
export { LinearPath2dNs as LinearPath2d }

export type QuadraticPath2d<Trait = unknown> = QuadraticPath2dNs.QuadraticPath2d<Trait>
export { QuadraticPath2dNs as QuadraticPath2d }

export type CubicPath2d<Trait = unknown> = CubicPath2dNs.CubicPath2d<Trait>
export { CubicPath2dNs as CubicPath2d }

export type RationalCubicPath2d = RationalCubicPath2dNs.RationalCubicPath2d
export { RationalCubicPath2dNs as RationalCubicPath2d }
