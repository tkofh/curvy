import { Point, PointObject } from '@curvy/types'

export const toPointObject = (point: Point): PointObject =>
  Array.isArray(point) ? { x: point[0], y: point[1] } : point
