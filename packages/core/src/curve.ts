import invariant from 'tiny-invariant'
import { createCurveSegment } from './segment'
import type { CurveSegment, Monotonicity } from './segment'
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
  readonly segments: ReadonlyArray<CurveSegment>
  readonly min: number
  readonly max: number
  readonly solve: (t: number) => number
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

export function createCurve(
  matrix: Matrix4x4,
  segmentScalars: Array<CubicScalars>,
): Curve {
  const segments: Array<CurveSegment> = []
  let min = 0
  let max = 0
  let monotonicity: Monotonicity = 'none'

  const normalizedToSegment = segmentScalars.length
  const segmentToNormalized = 1 / normalizedToSegment

  const extrema = new Map<number, number>()

  for (const [index, points] of segmentScalars.entries()) {
    const segment = createCurveSegment(matrix, points)

    segments.push(segment)

    if (index === 0) {
      min = segment.min
      max = segment.max
      monotonicity = segment.monotonicity
    } else {
      min = Math.min(min, segment.min)
      max = Math.max(max, segment.max)
      monotonicity =
        segment.monotonicity === monotonicity ? monotonicity : 'none'
    }

    for (const [t, value] of segment.localExtrema) {
      const curveT = round((t + index) * segmentToNormalized)
      extrema.set(curveT, value)
    }
  }

  if (extrema.size > 2) {
    filterExtrema(extrema)
  }

  return {
    extrema,
    max,
    min,
    monotonicity,
    segments,
    solve: (t: number) => {
      invariant(t >= 0 && t <= 1, 't must be between 0 and 1')

      const t1 = round(t)

      if (t1 === 1) {
        return segments[segments.length - 1].solve(1)
      }

      const segmentT = round(t1 * segments.length)
      const segmentIndex = Math.floor(segmentT)

      const segment = segments[segmentIndex]

      return segment.solve(segmentT - segmentIndex)
    },
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
