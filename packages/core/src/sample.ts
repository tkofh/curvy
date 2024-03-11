// import type { Curve } from './curve'
// import type { CubicScalars } from './splines'
// import { coarseRound, round } from './util'

import invariant from 'tiny-invariant'
import type { Point } from './curve'
import { createIntervalTree } from './interval'
import { remap } from './util'

// type SampleSet = {
//   addPrimary: (value: number) => void
//   addSupporting: (value: number) => void
//   samples: ReadonlySet<number>
// }

// function createSampleSet(): SampleSet {
//   const samples = new Set<number>()
//   const filter = new Set<number>()

//   function addPrimary(value: number) {
//     samples.add(round(value))
//     filter.add(coarseRound(value))
//   }

//   function addSupporting(value: number) {
//     if (!filter.has(coarseRound(value))) {
//       addPrimary(value)
//     }
//   }

//   return {
//     addPrimary,
//     addSupporting,
//     samples,
//   }
// }

// // https://quarticequations.com/Cubic.pdf
// // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: this is a complex algorithm
// function cubicRootsInUnitInterval(polynomial: CubicScalars) {
//   const roots = new Set<number>()
//   const a2 = polynomial[1] / polynomial[0]
//   const a1 = polynomial[2] / polynomial[0]
//   const a0 = polynomial[3] / polynomial[0]

//   const q = a1 / 3 - a2 ** 2 / 9
//   const r = (a1 * a2 - 3 * a0) / 6 - a2 ** 3 / 27

//   const discriminant = q ** 3 + r ** 2

//   if (discriminant > 0) {
//     const a = Math.cbrt(Math.abs(r) + Math.sqrt(discriminant))

//     /* c8 ignore next */
//     const t = r < 0 ? q / a - a : a - q / a
//     const root = round(t - a2 / 3)
//     if (0 <= root && root <= 1) {
//       roots.add(root)
//     }
//   } else {
//     const theta = Math.acos(r / Math.sqrt((-q) ** 3))
//     const theta1 = theta / 3
//     const theta2 = theta1 - (2 * Math.PI) / 3
//     const theta3 = theta1 + (2 * Math.PI) / 3

//     const twoRootQ = 2 * Math.sqrt(-q)
//     const a2over3 = a2 / 3

//     const root1 = round(twoRootQ * Math.cos(theta1) - a2over3)
//     const root2 = round(twoRootQ * Math.cos(theta2) - a2over3)
//     const root3 = round(twoRootQ * Math.cos(theta3) - a2over3)

//     if (0 <= root1 && root1 <= 1) {
//       roots.add(root1)
//     }
//     if (0 <= root2 && root2 <= 1) {
//       roots.add(root2)
//     }
//     if (0 <= root3 && root3 <= 1) {
//       roots.add(root3)
//     }
//   }

//   return roots
// }

// function addPointsOfInterest(samples: SampleSet, curve: Curve) {
//   const segmentToNormalized = 1 / curve.segments.length

//   for (const [index, segment] of curve.segments.entries()) {
//     // all segment boundaries must be present in order to integrate
//     // the curve over each sample interval
//     samples.addPrimary(index * segmentToNormalized)
//     samples.addPrimary((index + 1) * segmentToNormalized)

//     // adding in the extrema and the midpoints between ensures
//     // the tangent between to samples never intersects the curve
//     // except at the sample points. such intersections would
//     // produce incorrect areas when integrating.
//     // the extrema are also the potential roots of the velocity.
//     const extrema = Array.from(segment.localExtrema.keys())

//     for (const t of extrema) {
//       samples.addPrimary(round((index + t) * segmentToNormalized))
//     }

//     if (extrema.length === 4) {
//       const segmentInflectionX = (extrema[1] + extrema[2]) / 2

//       samples.addPrimary(
//         round((index + segmentInflectionX) * segmentToNormalized),
//       )
//     }

//     // all segment roots must be present because mixed signs will
//     // produce incorrect areas
//     const roots = cubicRootsInUnitInterval(segment.positionScalars)
//     for (const root of roots) {
//       samples.addPrimary(round((index + root) * segmentToNormalized))
//     }
//   }
// }

// function addUniformIntervals(samples: SampleSet) {
//   const count = 64
//   for (const sample of Array.from({ length: count + 1 }, (_, i) => i / count)) {
//     samples.addSupporting(sample)
//   }
// }

// function takeLinearIntegral(x1: number, x2: number, y1: number, y2: number) {
//   const m = (y2 - y1) / (x2 - x1)
//   const b = y1 - m * x1

//   // return takePolynomialIntegral([m, b], x1, x2)

//   const s1 = (x1 ** 2 * m) / 2 + b * x1
//   const s2 = (x2 ** 2 * m) / 2 + b * x2

//   return Math.abs(s2 - s1)
// }

// function takePolynomialIntegral(
//   coefficients: ReadonlyArray<number>,
//   start: number,
//   end: number,
// ): number {
//   let s1 = 0
//   let s2 = 0

//   for (let i = 0; i < coefficients.length; i++) {
//     const power = coefficients.length - i
//     s1 += (coefficients[i] * start ** power) / power
//     s2 += (coefficients[i] * end ** power) / power
//   }

//   return Math.abs(s2 - s1)
// }

// function addPositionIntervals(samples: SampleSet, curve: Curve) {
//   const normalizedToSegment = curve.segments.length

//   const queue = Array.from(samples.samples.keys()).sort((a, b) => a - b)

//   while (queue.length > 1) {
//     const start = queue[0] as number
//     const end = queue[1]

//     const y1 = curve.solve(start)
//     const y2 = curve.solve(end)

//     const segment = curve.segments[Math.floor(start * normalizedToSegment)]

//     const lutIntegral = takeLinearIntegral(start, end, y1, y2)
//     const curveIntegral = takePolynomialIntegral(
//       segment.positionScalars,
//       start,
//       end,
//     )

//     const error = Math.abs(lutIntegral - curveIntegral)

//     if (error > 0.0025) {
//       queue.splice(1, 0, (start + end) / 2)
//     } else {
//       samples.addSupporting(start)
//       queue.shift()
//     }
//   }
//   samples.addSupporting(queue[0])
// }

// function addVelocityIntervals(samples: SampleSet, curve: Curve) {
//   const normalizedToSegment = curve.segments.length

//   const queue = Array.from(samples.samples.keys()).sort((a, b) => a - b)

//   while (queue.length > 1) {
//     const start = queue[0] as number
//     const end = queue[1]

//     const y1 = curve.velocity(start)
//     const y2 = curve.velocity(end)

//     const segment = curve.segments[Math.floor(start * normalizedToSegment)]

//     const lutIntegral = takeLinearIntegral(start, end, y1, y2)
//     const curveIntegral = takePolynomialIntegral(
//       segment.velocityScalars,
//       start,
//       end,
//     )

//     const error = Math.abs(lutIntegral - curveIntegral)

//     if (error > 0.01) {
//       queue.splice(1, 0, (start + end) / 2)
//     } else {
//       samples.addSupporting(start)
//       queue.shift()
//     }
//   }
//   samples.addSupporting(queue[0])
// }

// export function sampleCurveLength(curve: Curve): Map<number, number> {
//   const samples = createSampleSet()

//   addPointsOfInterest(samples, curve)
//   // console.log(samples.samples.size)

//   addUniformIntervals(samples)
//   // console.log(samples.samples.size)

//   addPositionIntervals(samples, curve)
//   // console.log(samples.samples.size)

//   addVelocityIntervals(samples, curve)
//   // console.log(samples.samples.size)

//   const sortedSamples = Array.from(samples.samples.keys()).sort((a, b) => a - b)

//   return new Map(Array.from(sortedSamples, (t) => [t, curve.solve(t)]))
// }

function distance<Axis extends string | number>(
  a: Point<Axis>,
  b: Point<Axis>,
) {
  const keys = Object.keys(a) as Array<Axis>
  const deltas = keys.map((key) => a[key] - b[key])
  return Math.hypot(...deltas)
}

export function createLengthLookup<Axis extends string | number>(
  positionAt: (t: number) => Point<Axis>,
): (length: number) => number {
  const count = 512
  const orderedSamples = Array.from({ length: count + 1 }, (_, i) => i / count)

  const lengthLookup = new Map<number, number>()

  let lastPoint = positionAt(0)
  let length = 0
  lengthLookup.set(0, 0)

  for (const t of orderedSamples.slice(1)) {
    const point = positionAt(t)
    length = length + distance(lastPoint, point)
    lengthLookup.set(length, t)
    lastPoint = point
  }

  const totalLength = length

  const { search } = createIntervalTree(Array.from(lengthLookup.keys()))

  return (normalized: number) => {
    invariant(normalized >= 0 && normalized <= 1, 'Length out of bounds')
    const length = normalized * totalLength

    const result = search(length)

    invariant(result, 'Length not found')

    return remap(
      length,
      result[0],
      result[1],
      lengthLookup.get(result[0]) as number,
      lengthLookup.get(result[1]) as number,
    )
  }
}
