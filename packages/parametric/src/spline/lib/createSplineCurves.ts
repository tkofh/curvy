import { Matrix4x3, Matrix4x4, PointObject, Spline } from '@curvy/types'
import { createParametricCurve } from '../../curve'

export const createSplineCurves = (
  baseScalars: Matrix4x4,
  primeScalars: Matrix4x3,
  points: PointObject[],
  precisionX: number,
  precisionY: number,
  lutResolution: number
): Spline[] => {
  const curveCount = (points.length - 1) / 3

  const children: Spline[] = []

  for (let i = 0; i < curveCount; i++) {
    children.push(
      createParametricCurve(
        points[i * 3],
        points[i * 3 + 1],
        points[i * 3 + 2],
        points[i * 3 + 3],
        baseScalars,
        primeScalars,
        precisionX,
        precisionY,
        lutResolution
      )
    )
  }

  return children
}
