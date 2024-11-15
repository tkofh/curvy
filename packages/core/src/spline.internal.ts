export const SplineTypeId: unique symbol = Symbol.for('curvy/spline')
export type SplineTypeId = typeof SplineTypeId

export class SplineImpl {
  readonly [SplineTypeId]: SplineTypeId = SplineTypeId
}
