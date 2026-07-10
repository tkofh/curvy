import type * as LinearCurve2d from '../curve/linear2d.ts'
import * as linearCurveInternal from '../curve/linear2d.internal.ts'
import type { Closed } from '../interval/interval.ts'
import type { Interval2d } from '../interval/interval2d.ts'
import { invariant } from '../utils.ts'
import type { LinearPath2d } from './linear2d.ts'
import * as Path2d from './path2d.ts'
import {
  type Continuous,
  type DecreasingX,
  type DecreasingY,
  type IncreasingX,
  type IncreasingY,
  type MonotonicX,
  type MonotonicY,
} from './traits.ts'

export const LinearPath2dTypeId: unique symbol = Symbol('curvy/path/linear2d')
export type LinearPath2dTypeId = typeof LinearPath2dTypeId

// Generic operation surface, built once for LinearCurve2d's Ops.
const methods = Path2d.makeMethods(LinearPath2dTypeId, linearCurveInternal.Ops)

/** @internal */
export const isLinearPath2d = (p: unknown): p is LinearPath2d =>
  typeof p === 'object' && p !== null && LinearPath2dTypeId in p

/** @internal */
export const make = methods.make as (
  ...curves: ReadonlyArray<LinearCurve2d.LinearCurve2d>
) => LinearPath2d

/** @internal */
export const fromArray = methods.fromArray as (
  curves: ReadonlyArray<LinearCurve2d.LinearCurve2d>,
) => LinearPath2d

/** @internal */
export const append = methods.append as never

/** @internal */
export const length = methods.length as (p: LinearPath2d) => number

/** @internal */
export const solve = methods.solve as never

/** @internal */
export const toPathData = methods.toPathData as (p: LinearPath2d) => string

/** @internal */
export const isContinuous = methods.isContinuous as unknown as <T>(
  p: LinearPath2d<T>,
) => p is LinearPath2d<T & Continuous>

/** @internal */
export const asContinuous = <T>(p: LinearPath2d<T>): LinearPath2d<T & Continuous> => {
  invariant(isContinuous(p), 'linear path is not continuous')
  return p
}

/** @internal */
export const isIncreasingX = methods.isIncreasingX as unknown as <T>(
  p: LinearPath2d<T>,
) => p is LinearPath2d<T & IncreasingX>

/** @internal */
export const isDecreasingX = methods.isDecreasingX as unknown as <T>(
  p: LinearPath2d<T>,
) => p is LinearPath2d<T & DecreasingX>

/** @internal */
export const isMonotonicX = methods.isMonotonicX as unknown as <T>(
  p: LinearPath2d<T>,
) => p is LinearPath2d<T & MonotonicX>

/** @internal */
export const isIncreasingY = methods.isIncreasingY as unknown as <T>(
  p: LinearPath2d<T>,
) => p is LinearPath2d<T & IncreasingY>

/** @internal */
export const isDecreasingY = methods.isDecreasingY as unknown as <T>(
  p: LinearPath2d<T>,
) => p is LinearPath2d<T & DecreasingY>

/** @internal */
export const isMonotonicY = methods.isMonotonicY as unknown as <T>(
  p: LinearPath2d<T>,
) => p is LinearPath2d<T & MonotonicY>

/** @internal */
export const asIncreasingX = <T>(p: LinearPath2d<T>): LinearPath2d<T & IncreasingX> => {
  invariant(isIncreasingX(p), 'linear path is not increasing in x')
  return p
}

/** @internal */
export const asDecreasingX = <T>(p: LinearPath2d<T>): LinearPath2d<T & DecreasingX> => {
  invariant(isDecreasingX(p), 'linear path is not decreasing in x')
  return p
}

/** @internal */
export const asMonotonicX = <T>(p: LinearPath2d<T>): LinearPath2d<T & MonotonicX> => {
  invariant(isMonotonicX(p), 'linear path is not monotonic in x')
  return p
}

/** @internal */
export const asIncreasingY = <T>(p: LinearPath2d<T>): LinearPath2d<T & IncreasingY> => {
  invariant(isIncreasingY(p), 'linear path is not increasing in y')
  return p
}

/** @internal */
export const asDecreasingY = <T>(p: LinearPath2d<T>): LinearPath2d<T & DecreasingY> => {
  invariant(isDecreasingY(p), 'linear path is not decreasing in y')
  return p
}

/** @internal */
export const asMonotonicY = <T>(p: LinearPath2d<T>): LinearPath2d<T & MonotonicY> => {
  invariant(isMonotonicY(p), 'linear path is not monotonic in y')
  return p
}

/** @internal */
export const solveAtX = methods.solveAtX as never

/** @internal */
export const solveAtY = methods.solveAtY as never

/** @internal */
export const boundingBox = methods.boundingBox as (p: LinearPath2d) => Interval2d<Closed, Closed>

/** @internal */
export const transform = methods.transform as never
