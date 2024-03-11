import invariant from 'tiny-invariant'
import { type CurveAxis, createCurveAxis } from './axis'
import type { CubicCoefficients } from './polynomial'
import {
  createBasisCoefficients,
  createBezierCoefficients,
  createCardinalCoefficients,
  createCatmullRomCoefficients,
  createHermiteCoefficients,
} from './splines'

export type Point<Axis extends string | number> = { [A in Axis]: number }

export type Curve<Axis extends string | number> = {
  axes: Record<Axis, CurveAxis>
  positionAt: (t: number, precision?: number) => Point<Axis>
  solveWhere: <SolveAxis extends Axis>(
    axis: SolveAxis,
    position: number,
    precsiion?: number,
  ) => Point<Axis>
}

function round(value: number, precision = 12): number {
  const scale = 10 ** precision
  const result = Math.round(value * scale) / scale
  if (result === 0) {
    return 0
  }
  return result
}

export function createCurve<Axis extends string | number>(
  points: ReadonlyArray<Point<Axis>>,
  coefficientsGenerator: (
    points: ReadonlyArray<number>,
  ) => ReadonlyArray<CubicCoefficients>,
): Curve<Axis> {
  const axisKeys = Object.keys(points[0]) as unknown as ReadonlyArray<Axis>
  const axisPoints = {} as Record<Axis, Array<number>>

  for (const key of axisKeys) {
    axisPoints[key] = []
  }

  for (const point of points) {
    for (const key of axisKeys) {
      invariant(key in point, `Point ${point} is missing axis "${key}"`)
      axisPoints[key].push(point[key])
    }
  }

  const axes = {} as Record<Axis, CurveAxis>
  for (const key of axisKeys) {
    axes[key] = createCurveAxis(coefficientsGenerator(axisPoints[key]))
  }

  const positionAt = (t: number, precision = 12) => {
    const rounded = round(t)
    invariant(
      rounded >= 0 && rounded <= 1,
      `t must be between 0 and 1, got ${rounded}`,
    )
    const position = {} as Point<Axis>
    for (const key of axisKeys) {
      position[key] = round(axes[key].solvePosition(rounded), precision)
    }
    return position
  }

  const solveWhere = <SolveAxis extends Axis>(
    axis: SolveAxis,
    position: number,
    precision = 12,
  ): Point<Axis> => {
    const curveAxis = axes[axis]
    invariant(curveAxis.monotonicity !== 'none', 'Axis is not monotonic')

    const t = curveAxis.solveT(position, curveAxis.domain)[0]

    invariant(
      typeof t === 'number',
      `Could not solve for ${axis} = ${position}`,
    )

    const result = { [axis]: round(position, precision) } as Point<Axis>
    for (const key of axisKeys) {
      if (key !== axis) {
        result[key] = round(axes[key].solvePosition(t), precision)
      }
    }

    return result
  }

  return {
    axes,
    positionAt,
    solveWhere,
  }
}

export function createBasisCurve<Axis extends string | number>(
  points: ReadonlyArray<Point<Axis>>,
  triplicateEndpoints = true,
): Curve<Axis> {
  return createCurve(points, (points) =>
    createBasisCoefficients(points, triplicateEndpoints),
  )
}

export function createBezierCurve<Axis extends string | number>(
  points: ReadonlyArray<Point<Axis>>,
): Curve<Axis> {
  return createCurve(points, createBezierCoefficients)
}

export function createCardinalCurve<Axis extends string | number>(
  points: ReadonlyArray<Point<Axis>>,
  tension = 0.5,
  duplicateEndpoints = true,
): Curve<Axis> {
  return createCurve(points, (points) =>
    createCardinalCoefficients(points, tension, duplicateEndpoints),
  )
}

export function createCatmullRomCurve<Axis extends string | number>(
  points: ReadonlyArray<Point<Axis>>,
  duplicateEndpoints = true,
): Curve<Axis> {
  return createCurve(points, (points) =>
    createCatmullRomCoefficients(points, duplicateEndpoints),
  )
}

export function createHermiteCurve<Axis extends string | number>(
  points: ReadonlyArray<Point<Axis>>,
): Curve<Axis> {
  return createCurve(points, createHermiteCoefficients)
}
