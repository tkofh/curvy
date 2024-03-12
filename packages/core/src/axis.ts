import invariant from 'tiny-invariant'
import type {
  CubicCoefficients,
  CubicPolynomial,
  Interval,
  Monotonicity,
} from './polynomial'
import { UNIT_INTERVAL, createCubicPolynomial } from './polynomial'
import { splines } from './splines'

export type CurveAxis = {
  readonly domain: Interval
  readonly range: Interval
  readonly monotonicity: Monotonicity
  readonly extrema: ReadonlyArray<number>
  readonly segments: ReadonlyArray<CubicPolynomial>
  readonly solvePosition: (t: number) => number
  readonly solveVelocity: (t: number) => number
  readonly solveT: (position: number, domain: Interval) => ReadonlyArray<number>
}

function getCurveExtrema(lookup: Map<number, number>): ReadonlyArray<number> {
  const extremaLookup = new Map(lookup)
  const extremaCandidates = Array.from(extremaLookup.keys())
  for (const [index, t] of extremaCandidates.entries()) {
    if (index === 0 || index === extremaCandidates.length - 1) {
      continue
    }
    const previous = extremaLookup.get(extremaCandidates[index - 1]) as number
    const current = extremaLookup.get(t) as number
    const next = extremaLookup.get(extremaCandidates[index + 1]) as number

    if (
      (previous <= current && current < next) ||
      (previous >= current && current > next)
    ) {
      extremaLookup.delete(t)
    }
  }

  const extrema = Array.from(extremaLookup.keys())

  return extrema
}

export function createCurveAxis(
  coefficients: ReadonlyArray<CubicCoefficients>,
): CurveAxis {
  invariant(coefficients.length > 0, 'Curve must have at least one segment')

  const segments: Array<CubicPolynomial> = []
  const extremaLookup = new Map<number, number>()
  let monotonicity: Monotonicity = 'none'

  const normalizedToCurve = coefficients.length
  const curveToNormalized = 1 / coefficients.length

  for (let i = 0; i < coefficients.length; i++) {
    const segment = createCubicPolynomial(coefficients[i], UNIT_INTERVAL)
    segments.push(segment)

    extremaLookup.set(i * curveToNormalized, segment.solve(0))
    for (const extreme of segment.extrema) {
      extremaLookup.set(
        (i + extreme) * curveToNormalized,
        segment.solve(extreme),
      )
    }

    if (i === 0) {
      monotonicity = segment.monotonicity
    } else if (monotonicity !== segment.monotonicity) {
      monotonicity = 'none'
    }
  }
  extremaLookup.set(1, segments[segments.length - 1].solve(1))

  const extrema = getCurveExtrema(extremaLookup)

  const range: Interval = [
    Math.min(...extremaLookup.values()),
    Math.max(...extremaLookup.values()),
  ]

  const getSegmentAndInput = (t: number) => {
    invariant(t >= 0 && t <= 1, 't out of range')
    if (t === 1) {
      return { segment: segments[segments.length - 1], input: 1 }
    }

    const curveT = t * normalizedToCurve
    const index = Math.floor(curveT)
    const segment = segments[index]
    const input = curveT - index
    return { segment, input }
  }

  const solvePosition = (t: number) => {
    const { segment, input } = getSegmentAndInput(t)
    return segment.solve(input)
  }

  const solveVelocity = (t: number) => {
    const { segment, input } = getSegmentAndInput(t)
    return segment.derivative.solve(input)
  }

  const solveT = (position: number, domain: Interval) => {
    invariant(
      position >= range[0] && position <= range[1],
      'position out of range',
    )
    invariant(domain[0] <= domain[1], 'invalid domain')
    const result: Array<number> = []
    for (const [index, segment] of segments.entries()) {
      if (position >= segment.range[0] && position <= segment.range[1]) {
        const t = segment.solveInverse(position, domain)
        for (const tValue of t) {
          result.push((index + tValue) * curveToNormalized)
        }
      }
    }

    return result
  }

  return {
    domain: UNIT_INTERVAL,
    range,
    monotonicity,
    extrema,
    segments,
    solvePosition,
    solveVelocity,
    solveT,
  }
}

export function createBasisAxis(
  parameters: ReadonlyArray<number>,
  triplicateEndpoints = true,
): CurveAxis {
  return createCurveAxis(
    splines.basis(triplicateEndpoints).chunkCoefficients(parameters),
  )
}

export function createBezierAxis(parameters: ReadonlyArray<number>): CurveAxis {
  return createCurveAxis(splines.bezier.chunkCoefficients(parameters))
}

export function createCardinalAxis(
  parameters: ReadonlyArray<number>,
  a = 0.5,
  duplicateEndpoints = true,
): CurveAxis {
  return createCurveAxis(
    splines.cardinal(a, duplicateEndpoints).chunkCoefficients(parameters),
  )
}

export function createCatmullRomAxis(
  parameters: ReadonlyArray<number>,
  duplicateEndpoints = true,
): CurveAxis {
  return createCurveAxis(
    splines.catmullRom(duplicateEndpoints).chunkCoefficients(parameters),
  )
}

export function createHermiteAxis(
  parameters: ReadonlyArray<number>,
): CurveAxis {
  return createCurveAxis(splines.hermite.chunkCoefficients(parameters))
}
