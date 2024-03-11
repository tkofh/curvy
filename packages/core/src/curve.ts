import invariant from 'tiny-invariant'
import { type CurveAxis, createCurveAxis } from './axis'
import type { Spline } from './splines'
import { splines } from './splines'

export type Point<Axis extends string | number> = Readonly<{
  [A in Axis]: number
}>

export type Curve<Axis extends string | number> = {
  readonly axes: Readonly<Record<Axis, CurveAxis>>
  readonly positionAt: (t: number, precision?: number) => Point<Axis>
  readonly solveWhere: <SolveAxis extends Axis>(
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

function createCurve<Axis extends string | number>(
  points: ReadonlyArray<Point<Axis>>,
  spline: Spline,
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
    axes[key] = createCurveAxis(spline.chunkCoefficients(axisPoints[key]))
  }

  const positionAt = (t: number, precision = 12) => {
    const rounded = round(t)
    invariant(
      rounded >= 0 && rounded <= 1,
      `t must be between 0 and 1, got ${rounded}`,
    )
    const position = {} as { [A in Axis]: number }
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

    const result = { [axis]: round(position, precision) } as {
      [A in Axis]: number
    }
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
  return createCurve(points, splines.basis(triplicateEndpoints))
}

export function createBezierCurve<Axis extends string | number>(
  points: ReadonlyArray<Point<Axis>>,
): Curve<Axis> {
  return createCurve(points, splines.bezier)
}

export function createCardinalCurve<Axis extends string | number>(
  points: ReadonlyArray<Point<Axis>>,
  tension = 0.5,
  duplicateEndpoints = true,
): Curve<Axis> {
  return createCurve(points, splines.cardinal(tension, duplicateEndpoints))
}

export function createCatmullRomCurve<Axis extends string | number>(
  points: ReadonlyArray<Point<Axis>>,
  duplicateEndpoints = true,
): Curve<Axis> {
  return createCurve(points, splines.catmullRom(duplicateEndpoints))
}

export function createHermiteCurve<Axis extends string | number>(
  points: ReadonlyArray<Point<Axis>>,
): Curve<Axis> {
  return createCurve(points, splines.hermite)
}
