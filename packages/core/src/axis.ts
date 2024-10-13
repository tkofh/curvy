// import type { CubicPolynomial, Monotonicity } from './polynomial'
// import { createCubicPolynomial } from './polynomial'
// import { splines } from './splines'
// import { invariant } from './util'
// //
// export interface AxisInput {
//   value: number
//   weight: number
// }

// export type CurveAxis = {
//   readonly domain: Interval
//   readonly range: Interval
//   readonly monotonicity: Monotonicity
//   readonly extrema: ReadonlyArray<number>
//   readonly segments: ReadonlyArray<CubicPolynomial>
//   readonly solvePosition: (t: number) => number
//   readonly solveVelocity: (t: number) => number
//   readonly solveT: (position: number, domain: Interval) => ReadonlyArray<number>
// }

// class CurveAxis {
//   readonly domainStart: number
//   readonly domainEnd: number
//   readonly rangeStart: number
//   readonly rangeEnd: number
//   readonly monotonicity: Monotonicity
//   readonly extrema: ReadonlyArray<number>
//   readonly segments: ReadonlyArray<CubicPolynomial>
// }

// function getCurveExtrema(lookup: Map<number, number>): ReadonlyArray<number> {
//   const extremaLookup = new Map(lookup)
//   const extremaCandidates = Array.from(extremaLookup.keys())
//   for (const [index, t] of extremaCandidates.entries()) {
//     if (index === 0 || index === extremaCandidates.length - 1) {
//       continue
//     }
//     const previousCandidate = extremaCandidates[index - 1] as number
//     const nextCandidate = extremaCandidates[index + 1] as number

//     const previous = extremaLookup.get(previousCandidate) as number
//     const current = extremaLookup.get(t) as number
//     const next = extremaLookup.get(nextCandidate) as number

//     if (
//       (previous <= current && current < next) ||
//       (previous >= current && current > next)
//     ) {
//       extremaLookup.delete(t)
//     }
//   }

//   return Array.from(extremaLookup.keys())
// }

// export function createCurveAxis(
//   coefficients: ReadonlyArray<CubicCoefficients>,
// ): CurveAxis {
//   invariant(coefficients.length > 0, 'Curve must have at least one segment')

//   const segments: Array<CubicPolynomial> = []
//   const extremaLookup = new Map<number, number>()
//   let monotonicity: Monotonicity = 'none'

//   const normalizedToCurve = coefficients.length
//   const curveToNormalized = 1 / coefficients.length

//   for (const [index, coefficient] of coefficients.entries()) {
//     const segment = createCubicPolynomial(coefficient, UNIT_INTERVAL)
//     segments.push(segment)

//     extremaLookup.set(index * curveToNormalized, segment.solve(0))
//     for (const extreme of segment.extrema) {
//       extremaLookup.set(
//         (index + extreme) * curveToNormalized,
//         segment.solve(extreme),
//       )
//     }

//     if (index === 0) {
//       monotonicity = segment.monotonicity
//     } else if (monotonicity !== segment.monotonicity) {
//       monotonicity = 'none'
//     }
//   }

//   extremaLookup.set(
//     1,
//     (segments[segments.length - 1] as CubicPolynomial).solve(1),
//   )

//   const extrema = getCurveExtrema(extremaLookup)

//   const range: Interval = [
//     Math.min(...extremaLookup.values()),
//     Math.max(...extremaLookup.values()),
//   ]

//   const getSegmentAndInput = (
//     t: number,
//   ): { segment: CubicPolynomial; input: number } => {
//     invariant(t >= 0 && t <= 1, 't out of range')
//     if (t === 1) {
//       return {
//         segment: segments[segments.length - 1] as CubicPolynomial,
//         input: 1,
//       }
//     }

//     const curveT = t * normalizedToCurve
//     const index = Math.floor(curveT)
//     const segment = segments[index] as CubicPolynomial
//     const input = curveT - index
//     return { segment, input }
//   }

//   const solvePosition = (t: number) => {
//     const { segment, input } = getSegmentAndInput(t)
//     return segment.solve(input)
//   }

//   const solveVelocity = (t: number) => {
//     const { segment, input } = getSegmentAndInput(t)
//     return segment.derivative.solve(input)
//   }

//   const solveT = (position: number, domain: Interval) => {
//     invariant(
//       position >= range[0] && position <= range[1],
//       'position out of range',
//     )
//     invariant(domain[0] <= domain[1], 'invalid domain')
//     const result: Array<number> = []
//     for (const [index, segment] of segments.entries()) {
//       if (position >= segment.range[0] && position <= segment.range[1]) {
//         const t = segment.solveInverse(position, domain)
//         for (const tValue of t) {
//           result.push((index + tValue) * curveToNormalized)
//         }
//       }
//     }

//     return result
//   }

//   return {
//     domain: UNIT_INTERVAL,
//     range,
//     monotonicity,
//     extrema,
//     segments,
//     solvePosition,
//     solveVelocity,
//     solveT,
//   }
// }

// export function createBasisAxis(
//   parameters: ReadonlyArray<number>,
//   triplicateEndpoints = true,
// ): CurveAxis {
//   return createCurveAxis(
//     splines.basis(triplicateEndpoints).chunkCoefficients(parameters),
//   )
// }

// export function createBezierAxis(parameters: ReadonlyArray<number>): CurveAxis {
//   return createCurveAxis(splines.bezier.chunkCoefficients(parameters))
// }

// export function createCardinalAxis(
//   parameters: ReadonlyArray<number>,
//   a = 0.5,
//   duplicateEndpoints = true,
// ): CurveAxis {
//   return createCurveAxis(
//     splines.cardinal(a, duplicateEndpoints).chunkCoefficients(parameters),
//   )
// }

// export function createCatmullRomAxis(
//   parameters: ReadonlyArray<number>,
//   duplicateEndpoints = true,
// ): CurveAxis {
//   return createCurveAxis(
//     splines.catmullRom(duplicateEndpoints).chunkCoefficients(parameters),
//   )
// }

// export function createHermiteAxis(
//   parameters: ReadonlyArray<number>,
// ): CurveAxis {
//   return createCurveAxis(splines.hermite.chunkCoefficients(parameters))
// }
