import { Point, PointObject } from '@curvy/types'
import { distance, normalizeVector } from 'micro-math'
import { toPointObject } from '@curvy/parametric'

export interface BezierSplineBuilder {
  readonly points: readonly PointObject[]
  symmetricTo: (p2: Point, p3: Point) => BezierSplineBuilder
  asymmetricTo: (offset: number, p2: Point, p3: Point) => BezierSplineBuilder
  brokenTo: (p1: Point, p2: Point, p3: Point) => BezierSplineBuilder
}

export const bezierPoints = (p0: Point, p1: Point, p2: Point, p3: Point): BezierSplineBuilder => {
  const points: PointObject[] = [
    toPointObject(p0),
    toPointObject(p1),
    toPointObject(p2),
    toPointObject(p3),
  ]

  const builder: BezierSplineBuilder = {
    points,
    brokenTo: (p1, p2, p3) => {
      points.push(toPointObject(p1), toPointObject(p2), toPointObject(p3))
      return builder
    },
    symmetricTo: (p2, p3) => builder.asymmetricTo(1, p2, p3),
    asymmetricTo: (offset, p2, p3) => {
      const p0 = points.at(-1)!
      const pn1 = points.at(-2)!
      const [dirX, dirY] = normalizeVector(p0.x - pn1.x, p0.y - pn1.y)
      const dist = distance(p0.x, p0.y, pn1.x, pn1.y) * offset

      points.push(
        { x: p0.x + dist * dirX, y: p0.y + dist * dirY },
        toPointObject(p2),
        toPointObject(p3)
      )

      return builder
    },
  }

  return builder
}
