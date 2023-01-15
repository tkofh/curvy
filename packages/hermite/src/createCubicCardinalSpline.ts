import type { Point, PointObject, Spline } from '@curvy/types'
import type { SplineOptions} from '../../uniform';
import { toPointObject } from '../../uniform'
import { createCubicHermiteSpline } from './createCubicHermiteSpline'

interface CardinalSplineOptions extends SplineOptions {
  a?: number
  virtualStart?: Point
  virtualEnd?: Point
}

export const createCubicCardinalSpline = (
  points: Point[],
  options?: CardinalSplineOptions
): Spline => {
  if (points.length < 2) {
    throw new Error('At least 2 points must be provided')
  }

  const { a = 0, virtualStart: _, virtualEnd: __, ...baseOptions } = options ?? {}

  const pointObjects = points.map((point) => toPointObject(point))

  const virtualStart =
    options?.virtualStart != null ? toPointObject(options.virtualStart) : pointObjects[0]
  const virtualEnd =
    options?.virtualEnd != null
      ? toPointObject(options.virtualEnd)
      : pointObjects[pointObjects.length - 1]

  const pointsAndTangents: Point[] = []

  for (let i = 0; i < pointObjects.length; i++) {
    const pPrev = i === 0 ? virtualStart : pointObjects[i - 1]
    const pCurrent = pointObjects[i]
    const pNext = i === pointObjects.length - 1 ? virtualEnd : pointObjects[i + 1]

    const tangent: PointObject = {
      x: a * (pNext.x - pPrev.x),
      y: a * (pNext.y - pPrev.y),
    }

    if (i > 0) {
      pointsAndTangents.push(tangent)
    }
    pointsAndTangents.push(pCurrent)
    if (i < pointObjects.length - 1) {
      pointsAndTangents.push(tangent)
    }
  }

  return createCubicHermiteSpline(pointsAndTangents, baseOptions)
}
