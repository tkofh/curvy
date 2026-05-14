import * as LinearCurve2dNs from './linear2d.ts'
import * as QuadraticCurve2dNs from './quadratic2d.ts'
import * as CubicCurve2dNs from './cubic2d.ts'
import * as RationalCubicCurve2dNs from './rationalCubic2d.ts'

export type LinearCurve2d<XTraits = unknown, YTraits = unknown> = LinearCurve2dNs.LinearCurve2d<
  XTraits,
  YTraits
>
export { LinearCurve2dNs as LinearCurve2d }

export type QuadraticCurve2d<
  XTraits = unknown,
  YTraits = unknown,
> = QuadraticCurve2dNs.QuadraticCurve2d<XTraits, YTraits>
export { QuadraticCurve2dNs as QuadraticCurve2d }

export type CubicCurve2d<XTraits = unknown, YTraits = unknown> = CubicCurve2dNs.CubicCurve2d<
  XTraits,
  YTraits
>
export { CubicCurve2dNs as CubicCurve2d }

export type RationalCubicCurve2d<
  XTraits = unknown,
  YTraits = unknown,
> = RationalCubicCurve2dNs.RationalCubicCurve2d<XTraits, YTraits>
export { RationalCubicCurve2dNs as RationalCubicCurve2d }
