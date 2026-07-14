import type * as QuadraticCurve2d from '../curve/quadratic2d.ts'
import * as quadraticCurveInternal from '../curve/quadratic2d.internal.ts'
import type { Closed } from '../interval/interval.ts'
import type { Interval2d } from '../interval/interval2d.ts'
import { invariant } from '../utils.ts'
import * as Path2d from './path2d.ts'
import type { QuadraticPath2d } from './quadratic2d.ts'
import {
  type Continuous,
  type DecreasingX,
  type DecreasingY,
  type IncreasingX,
  type IncreasingY,
  type MonotonicX,
  type MonotonicY,
} from './traits.ts'

export const QuadraticPath2dTypeId: unique symbol = Symbol('curvy/path/quadratic2d')
export type QuadraticPath2dTypeId = typeof QuadraticPath2dTypeId

// Generic operation surface, built once for QuadraticCurve2d's Ops.
const methods = Path2d.makeMethods(QuadraticPath2dTypeId, quadraticCurveInternal.Ops)

/** @internal */
export const isQuadraticPath2d = (p: unknown): p is QuadraticPath2d =>
  typeof p === 'object' && p !== null && QuadraticPath2dTypeId in p

/** @internal */
export const make = methods.make as (
  ...curves: ReadonlyArray<QuadraticCurve2d.QuadraticCurve2d>
) => QuadraticPath2d

/** @internal */
export const fromArray = methods.fromArray as (
  curves: ReadonlyArray<QuadraticCurve2d.QuadraticCurve2d>,
) => QuadraticPath2d

/** @internal */
export const append = methods.append as never

/** @internal */
export const appendContinuous = methods.appendContinuous as never

/** @internal */
export const length = methods.length as (p: QuadraticPath2d) => number

/** @internal */
export const solve = methods.solve as never

/** @internal */
export const toPathData = methods.toPathData as (p: QuadraticPath2d) => string

/** @internal */
export const isContinuous = methods.isContinuous as unknown as <T>(
  p: QuadraticPath2d<T>,
) => p is QuadraticPath2d<T & Continuous>

/** @internal */
export const asContinuous = <T>(p: QuadraticPath2d<T>): QuadraticPath2d<T & Continuous> => {
  invariant(isContinuous(p), 'quadratic path is not continuous')
  return p
}

/** @internal */
export const isIncreasingX = methods.isIncreasingX as unknown as <T>(
  p: QuadraticPath2d<T>,
) => p is QuadraticPath2d<T & IncreasingX>

/** @internal */
export const isDecreasingX = methods.isDecreasingX as unknown as <T>(
  p: QuadraticPath2d<T>,
) => p is QuadraticPath2d<T & DecreasingX>

/** @internal */
export const isMonotonicX = methods.isMonotonicX as unknown as <T>(
  p: QuadraticPath2d<T>,
) => p is QuadraticPath2d<T & MonotonicX>

/** @internal */
export const isIncreasingY = methods.isIncreasingY as unknown as <T>(
  p: QuadraticPath2d<T>,
) => p is QuadraticPath2d<T & IncreasingY>

/** @internal */
export const isDecreasingY = methods.isDecreasingY as unknown as <T>(
  p: QuadraticPath2d<T>,
) => p is QuadraticPath2d<T & DecreasingY>

/** @internal */
export const isMonotonicY = methods.isMonotonicY as unknown as <T>(
  p: QuadraticPath2d<T>,
) => p is QuadraticPath2d<T & MonotonicY>

/** @internal */
export const asIncreasingX = <T>(p: QuadraticPath2d<T>): QuadraticPath2d<T & IncreasingX> => {
  invariant(isIncreasingX(p), 'quadratic path is not increasing in x')
  return p
}

/** @internal */
export const asDecreasingX = <T>(p: QuadraticPath2d<T>): QuadraticPath2d<T & DecreasingX> => {
  invariant(isDecreasingX(p), 'quadratic path is not decreasing in x')
  return p
}

/** @internal */
export const asMonotonicX = <T>(p: QuadraticPath2d<T>): QuadraticPath2d<T & MonotonicX> => {
  invariant(isMonotonicX(p), 'quadratic path is not monotonic in x')
  return p
}

/** @internal */
export const asIncreasingY = <T>(p: QuadraticPath2d<T>): QuadraticPath2d<T & IncreasingY> => {
  invariant(isIncreasingY(p), 'quadratic path is not increasing in y')
  return p
}

/** @internal */
export const asDecreasingY = <T>(p: QuadraticPath2d<T>): QuadraticPath2d<T & DecreasingY> => {
  invariant(isDecreasingY(p), 'quadratic path is not decreasing in y')
  return p
}

/** @internal */
export const asMonotonicY = <T>(p: QuadraticPath2d<T>): QuadraticPath2d<T & MonotonicY> => {
  invariant(isMonotonicY(p), 'quadratic path is not monotonic in y')
  return p
}

/** @internal */
export const solveAtX = methods.solveAtX as never

/** @internal */
export const solveAtY = methods.solveAtY as never

/** @internal */
export const boundingBox = methods.boundingBox as (p: QuadraticPath2d) => Interval2d<Closed, Closed>

/** @internal */
export const transform = methods.transform as never
