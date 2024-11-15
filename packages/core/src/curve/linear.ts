import type { Pipeable } from '../internal/pipeable'
import type { Interval } from '../interval'
import type { LinearPolynomial } from '../polynomial/linear'
import type { LinearCurveTypeId } from './linear.internal'
import * as internal from './linear.internal'

export interface LinearCurve extends Pipeable {
  readonly [LinearCurveTypeId]: LinearCurveTypeId
}

export const isLinearCurve: (v: unknown) => v is LinearCurve =
  internal.isLinearCurve

export const make: (
  domain: Interval,
  polynomial: LinearPolynomial,
) => LinearCurve = internal.make

export const polynomial: (curve: LinearCurve) => LinearPolynomial =
  internal.polynomial

export const domain: (curve: LinearCurve) => Interval = internal.domain

export const range: (curve: LinearCurve) => Interval = internal.range

export const length: (curve: LinearCurve) => number = internal.length
