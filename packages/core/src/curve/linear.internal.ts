import { dual } from '../internal/function'
import { Pipeable } from '../internal/pipeable'
import type { Interval } from '../interval'
import * as interval from '../interval'
import type { LinearPolynomial } from '../polynomial/linear'
import * as linear from '../polynomial/linear'
import { invariant } from '../util'
import type { LinearCurve } from './linear'

export const LinearCurveTypeId: unique symbol = Symbol.for('curvy/curve/linear')
export type LinearCurveTypeId = typeof LinearCurveTypeId

export class LinearCurveImpl extends Pipeable implements LinearCurve {
  readonly [LinearCurveTypeId]: LinearCurveTypeId = LinearCurveTypeId

  readonly domain: Interval
  readonly polynomial: LinearPolynomial

  constructor(domain: Interval, polynomial: LinearPolynomial) {
    super()
    this.domain = domain
    this.polynomial = polynomial
  }
}

export const make = (
  domain: Interval,
  polynomial: LinearPolynomial,
): LinearCurve => new LinearCurveImpl(domain, polynomial)

export const isLinearCurve = (v: unknown): v is LinearCurve =>
  typeof v === 'object' && v !== null && LinearCurveTypeId in v

export const polynomial = (curve: LinearCurve): LinearPolynomial =>
  (curve as LinearCurveImpl).polynomial

export const domain = (curve: LinearCurve): Interval =>
  (curve as LinearCurveImpl).domain

export const range = (curve: LinearCurve): Interval => {
  const { polynomial, domain } = curve as LinearCurveImpl
  const start = linear.solve(polynomial, domain.start)
  const end = linear.solve(polynomial, domain.end)
  return interval.make(Math.min(start, end), Math.max(start, end))
}

export const solve = dual(2, (curve: LinearCurve, t: number) => {
  invariant(interval.contains(interval.unit, t), 't out of range')

  const { polynomial, domain } = curve as LinearCurveImpl

  return linear.solve(polynomial, interval.lerp(t, domain))
})

export const length = (curve: LinearCurve): number => {
  const { polynomial, domain } = curve as LinearCurveImpl
  return interval.size(domain) * polynomial.c1
}
