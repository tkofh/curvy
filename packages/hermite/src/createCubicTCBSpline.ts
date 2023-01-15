import type { Point, PointObject, Spline } from '@curvy/types'
import type { SplineOptions} from '../../uniform';
import { toPointObject } from '../../uniform'
import { createCubicHermiteSpline } from './createCubicHermiteSpline'

interface TCBSplineOptions extends SplineOptions {
  tension?: number
  continuity?: number
  bias?: number
  virtualStart?: Point
  virtualEnd?: Point
}

export const createCubicTCBSpline = (points: Point[], options?: TCBSplineOptions): Spline => {
  if (points.length < 2) {
    throw new Error('At least 2 points must be provided')
  }

  const {
    tension = 0,
    continuity = 0,
    bias = 0,
    virtualStart: _,
    virtualEnd: __,
    ...baseOptions
  } = options ?? {}

  const pointObjects = points.map((point) => toPointObject(point))

  const virtualStart =
    options?.virtualStart != null ? toPointObject(options.virtualStart) : pointObjects[0]
  const virtualEnd =
    options?.virtualEnd != null
      ? toPointObject(options.virtualEnd)
      : pointObjects[pointObjects.length - 1]

  const pointsAndTangents: Point[] = [pointObjects[0]]

  for (let i = 0; i < pointObjects.length - 1; i++) {
    const p0 = i === 0 ? virtualStart : pointObjects[i - 1]
    const p1 = pointObjects[i]
    const p2 = pointObjects[i + 1]
    const p3 = i === pointObjects.length - 2 ? virtualEnd : pointObjects[i + 2]

    const t1: PointObject = {
      x:
        (1 - tension) * (1 + bias) * (1 + continuity) * 0.5 * (p1.x - p0.x) +
        (1 - tension) * (1 - bias) * (1 - continuity) * 0.5 * (p2.x - p1.x),
      y:
        (1 - tension) * (1 + bias) * (1 + continuity) * 0.5 * (p1.y - p0.y) +
        (1 - tension) * (1 - bias) * (1 - continuity) * 0.5 * (p2.y - p1.y),
    }

    const t2: PointObject = {
      x:
        (1 - tension) * (1 + bias) * (1 - continuity) * 0.5 * (p2.x - p1.x) +
        (1 - tension) * (1 - bias) * (1 + continuity) * 0.5 * (p3.x - p2.x),
      y:
        (1 - tension) * (1 + bias) * (1 - continuity) * 0.5 * (p2.y - p1.y) +
        (1 - tension) * (1 - bias) * (1 + continuity) * 0.5 * (p3.y - p2.y),
    }

    pointsAndTangents.push(t1, t2, p2)
  }

  return createCubicHermiteSpline(pointsAndTangents, baseOptions)
}
