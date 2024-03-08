import type { BaseAxes, CubicPoints, Point } from '@curvy/types'
import { distance, normalizeVector } from 'micro-math'

export interface BezierSplineBuilder<TAxes extends BaseAxes> {
  readonly points: ReadonlyArray<Point<TAxes>>
  symmetricTo: (
    p2: Point<TAxes>,
    p3: Point<TAxes>,
  ) => BezierSplineBuilder<TAxes>
  asymmetricTo: (
    ratio: number,
    p2: Point<TAxes>,
    p3: Point<TAxes>,
  ) => BezierSplineBuilder<TAxes>
  brokenTo: (
    p1: Point<TAxes>,
    p2: Point<TAxes>,
    p3: Point<TAxes>,
  ) => BezierSplineBuilder<TAxes>
}

export const bezierPoints = <TAxes extends BaseAxes>(
  points: CubicPoints<TAxes>,
): BezierSplineBuilder<TAxes> => {
  const _points = [...points]
  const axes = Object.keys(points[0]) as Array<TAxes>

  const builder: BezierSplineBuilder<TAxes> = {
    points: _points,
    brokenTo: (p1, p2, p3) => {
      _points.push(p1, p2, p3)
      return builder
    },
    symmetricTo: (p2, p3) => builder.asymmetricTo(1, p2, p3),
    asymmetricTo: (ratio, p2, p3) => {
      // biome-ignore lint/style/noNonNullAssertion: we know its there
      const p0 = _points.at(-1)!
      // biome-ignore lint/style/noNonNullAssertion: we know its there
      const pn1 = _points.at(-2)!
      const directions: Array<number> = []

      const p0Array: Array<number> = []
      const pn1Array: Array<number> = []
      for (const axis of axes) {
        p0Array.push(p0[axis])
        pn1Array.push(pn1[axis])
        directions.push(p0[axis] - pn1[axis])
      }
      const normalizedDirections = normalizeVector(...directions)
      const dist = distance(p0Array, pn1Array) * ratio

      const p1 = {} as Point<TAxes>
      for (const [index, axis] of axes.entries()) {
        p1[axis] = p0[axis] + dist * normalizedDirections[index]
      }

      _points.push(p1, p2, p3)

      return builder
    },
  }

  return builder
}
