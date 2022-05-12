import { Monotonicity, Points, ReadonlyPoint, Rect, Spline } from '@curvy/types'
import { warnDev } from '@curvy/dx'
import {
  BezierSplineOptions,
  createSegment,
  DEFAULT_LUT_RESOLUTION,
  DEFAULT_PRECISION,
  createSplineDimensionSolver,
} from './lib'

export const createCubicBezierSpline = (points: Points, options?: BezierSplineOptions): Spline => {
  if (points.length < 4) {
    throw new Error('At least one cubic segment (four points) must be provided')
  }

  if ((points.length - 1) % 3 !== 0) {
    throw new Error('Invalid number of points provided (must have 3n+1 points)')
  }

  const precisionY = options?.precisionY ?? options?.precision ?? DEFAULT_PRECISION
  const precisionX = options?.precisionX ?? options?.precision ?? DEFAULT_PRECISION

  const lutResolution = options?.lutResolution ?? DEFAULT_LUT_RESOLUTION

  // number of points that sit along the curve
  const fixedPointCount = (points.length - 1) / 3

  const children: Spline[] = []

  const extremaCandidates: Points = []

  const boundingBox: Rect = { maxY: -Infinity, minY: Infinity, minX: Infinity, maxX: -Infinity }
  let monotonicityX: Monotonicity = 'none'
  let monotonicityY: Monotonicity = 'none'

  let splineLength = 0

  for (let i = 0; i < fixedPointCount; i++) {
    const child = createSegment(
      [points[i * 3], points[i * 3 + 1], points[i * 3 + 2], points[i * 3 + 3]],
      {
        lutResolution,
        precisionX,
        precisionY,
      }
    )
    children.push(child)

    if (i === 0) {
      extremaCandidates.push(...(child.extrema as Points))
      monotonicityX = child.monotonicityX
      monotonicityY = child.monotonicityY
    } else {
      extremaCandidates.push(...(child.extrema.slice(1) as Points))

      if (child.monotonicityX !== monotonicityX) {
        monotonicityX = 'none'
      }
      if (child.monotonicityY !== monotonicityY) {
        monotonicityY = 'none'
      }
    }

    splineLength += child.length

    if (child.boundingBox.maxY > boundingBox.maxY) {
      boundingBox.maxY = child.boundingBox.maxY
    }
    if (child.boundingBox.maxX > boundingBox.maxX) {
      boundingBox.maxX = child.boundingBox.maxX
    }
    if (child.boundingBox.minY < boundingBox.minY) {
      boundingBox.minY = child.boundingBox.minY
    }
    if (child.boundingBox.minX < boundingBox.minX) {
      boundingBox.minX = child.boundingBox.minX
    }
  }

  const extrema: Points = []
  for (let i = 0; i < extremaCandidates.length; i++) {
    const current = extremaCandidates[i]
    const [currentX, currentY] = current
    if (i === 0 || i === extremaCandidates.length - 1) {
      extrema.push(current)
    } else {
      const [previousX, previousY] = extrema[extrema.length - 1]
      const [nextX, nextY] = extremaCandidates[i + 1]

      if (
        currentX < Math.min(previousX, nextX) ||
        currentX > Math.max(previousX, nextX) ||
        currentY < Math.min(previousY, nextY) ||
        currentY > Math.max(previousY, nextY)
      ) {
        extrema.push(current)
      }
    }
  }

  const solveX = createSplineDimensionSolver('Y', boundingBox, precisionY, precisionX, children)

  const solveY = createSplineDimensionSolver('X', boundingBox, precisionX, precisionY, children)

  const solvePointAtLength = (length: number): ReadonlyPoint | undefined => {
    let output: ReadonlyPoint | undefined

    if (length < 0) {
      warnDev(`Cannot get point at length ${length} because curve is undefined below length 0`)
    } else if (length > splineLength) {
      warnDev(
        `Cannot get point at length ${length} because curve is undefined above length ${splineLength}`
      )
    } else {
      let lengthOffset = 0
      for (let i = 0; i < children.length; i++) {
        const child = children[i]

        const searchLength = length - lengthOffset

        if (child.length > searchLength) {
          output = child.solvePointAtLength(searchLength)
          break
        }

        lengthOffset += child.length
      }
    }

    return output
  }

  return {
    solveX,
    solveY,
    precisionX,
    precisionY,
    monotonicityX,
    monotonicityY,
    extrema,
    boundingBox,
    length: splineLength,
    solvePointAtLength,
  }
}
