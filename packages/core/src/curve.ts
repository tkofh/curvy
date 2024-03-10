import invariant from 'tiny-invariant'
import { createCurveSegment, solveSegmentT } from './segment'
import type { CurveSegment, Interval, Monotonicity } from './segment'
import {
  basis,
  bezier,
  cardinal,
  catmullRom,
  hermite,
  toBasisSegments,
  toBezierSegments,
  toCardinalSegments,
  toCatmullRomSegments,
  toHermiteSegments,
} from './splines'
import type { CubicScalars, Matrix4x4 } from './splines'
import { round } from './util'

export type Curve = {
  readonly monotonicity: Monotonicity
  readonly extrema: ReadonlyMap<number, number>
  readonly range: Interval
  readonly segments: ReadonlyArray<CurveSegment>
  readonly positionAt: (t: number) => number
  readonly velocityAt: (t: number) => number
}

function filterExtrema(extrema: Map<number, number>) {
  const extremaArray = [...extrema.entries()]
  for (let index = 1; index < extremaArray.length - 1; index++) {
    const [t, currentValue] = extremaArray[index]

    const previousValue = extremaArray[index - 1][1]
    const nextValue = extremaArray[index + 1][1]

    if (
      (previousValue <= currentValue && currentValue <= nextValue) ||
      (previousValue >= currentValue && currentValue >= nextValue)
    ) {
      extrema.delete(t)
    }
  }
}

function getSegmentAndT(
  segments: ReadonlyArray<CurveSegment>,
  t: number,
): { segment: CurveSegment; t: number } {
  invariant(t >= 0 && t <= 1, 't must be between 0 and 1')

  const rounded = round(t)

  if (rounded === 1) {
    return {
      segment: segments[segments.length - 1],
      t: 1,
    }
  }

  const denormalized = t * segments.length

  const index = Math.floor(denormalized)
  const segment = segments[index]
  const localT = denormalized - index

  return {
    segment,
    t: localT,
  }
}

export function createCurve(
  matrix: Matrix4x4,
  segmentScalars: Array<CubicScalars>,
): Curve {
  const segments: Array<CurveSegment> = []
  const range = [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY] as [
    number,
    number,
  ]
  let monotonicity: Monotonicity = 'none'

  const normalizedToSegment = segmentScalars.length
  const segmentToNormalized = 1 / normalizedToSegment

  const extrema = new Map<number, number>()

  for (const [index, points] of segmentScalars.entries()) {
    const segment = createCurveSegment(matrix, points)

    segments.push(segment)

    if (index === 0) {
      range[0] = segment.range[0]
      range[1] = segment.range[1]
      monotonicity = segment.monotonicity
    } else {
      range[0] = Math.min(range[0], segment.range[0])
      range[1] = Math.max(range[1], segment.range[1])
      monotonicity =
        segment.monotonicity === monotonicity ? monotonicity : 'none'
    }

    for (const [t, value] of segment.extrema) {
      const curveT = round((t + index) * segmentToNormalized)
      extrema.set(curveT, value)
    }
  }

  if (extrema.size > 2) {
    filterExtrema(extrema)
  }

  function positionAt(t: number): number {
    const { segment, t: localT } = getSegmentAndT(segments, t)
    return segment.positionAt(localT)
  }

  function velocityAt(t: number): number {
    const { segment, t: localT } = getSegmentAndT(segments, t)
    return segment.velocityAt(localT)
  }

  return {
    extrema,
    range,
    monotonicity,
    segments,
    positionAt,
    velocityAt,
  }
}

export function createBezierCurve(values: Array<number>) {
  return createCurve(bezier, toBezierSegments(values))
}

export function createHermiteCurve(values: Array<number>) {
  return createCurve(hermite, toHermiteSegments(values))
}

type CardinalCurveOptions = {
  a: number
  duplicateEndpoints: boolean
}
const defaultCardinalCurveOptions = {
  a: 0.5,
  duplicateEndpoints: true,
} satisfies CardinalCurveOptions

export function createCardinalCurve(
  values: Array<number>,
  options: Partial<CardinalCurveOptions> = {},
) {
  const { a, duplicateEndpoints } = {
    ...defaultCardinalCurveOptions,
    ...options,
  }
  return createCurve(
    cardinal(a),
    toCardinalSegments(values, duplicateEndpoints),
  )
}

type CatmullRomCurveOptions = {
  duplicateEndpoints: boolean
}
const defaultCatmullRomCurveOptions = {
  duplicateEndpoints: true,
} satisfies CatmullRomCurveOptions

export function createCatmullRomCurve(
  values: Array<number>,
  options: Partial<CatmullRomCurveOptions> = {},
) {
  const { duplicateEndpoints } = {
    ...defaultCatmullRomCurveOptions,
    ...options,
  }
  return createCurve(
    catmullRom,
    toCatmullRomSegments(values, duplicateEndpoints),
  )
}

type BasisCurveOptions = {
  triplicateEndpoints: boolean
}
const defaultBasisCurveOptions = {
  triplicateEndpoints: true,
} satisfies BasisCurveOptions

export function createBasisCurve(
  values: Array<number>,
  options: Partial<BasisCurveOptions> = {},
) {
  const { triplicateEndpoints } = {
    ...defaultBasisCurveOptions,
    ...options,
  }
  return createCurve(basis, toBasisSegments(values, triplicateEndpoints))
}

export function solveCurveT(
  curve: Curve,
  position: number,
  domain: Interval,
): ReadonlyArray<number> {
  invariant(typeof position === 'number', 'position must be a number')

  const rounded = round(position)

  invariant(
    rounded >= curve.range[0] && rounded <= curve.range[1],
    "position must be within the curve's range",
  )

  const results: Array<number> = []

  for (const segment of curve.segments) {
    results.push(...solveSegmentT(segment, position, domain))
  }

  return results
}
