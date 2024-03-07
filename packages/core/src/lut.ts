import type { CubicScalars, Curve, CurveSegment } from './types'
import { round } from './util'

function createSamples(count: number) {
  return Array.from({ length: count }, (_, i) => round(i / (count - 1)))
}

// https://quarticequations.com/Cubic.pdf
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: this is a complex algorithm
function cubicRootsInUnitInterval(polynomial: CubicScalars) {
  const roots = new Set<number>()
  const a2 = polynomial[1] / polynomial[0]
  const a1 = polynomial[2] / polynomial[0]
  const a0 = polynomial[3] / polynomial[0]

  const q = a1 / 3 - a2 ** 2 / 9
  const r = (a1 * a2 - 3 * a0) / 6 - a2 ** 3 / 27

  const discriminant = q ** 3 + r ** 2

  if (discriminant > 0) {
    const a = Math.cbrt(Math.abs(r) + Math.sqrt(discriminant))
    const t = r < 0 ? q / a - a : a - q / a
    const root = round(t - a2 / 3)
    if (0 <= root && root <= 1) {
      roots.add(root)
    }
  } else {
    const theta = q === 0 ? 0 : Math.acos(r / Math.sqrt((-q) ** 3))
    const theta1 = theta / 3
    const theta2 = theta1 - (2 * Math.PI) / 3
    const theta3 = theta1 + (2 * Math.PI) / 3

    const twoRootQ = 2 * Math.sqrt(-q)
    const a2over3 = a2 / 3

    const root1 = round(twoRootQ * Math.cos(theta1) - a2over3)
    const root2 = round(twoRootQ * Math.cos(theta2) - a2over3)
    const root3 = round(twoRootQ * Math.cos(theta3) - a2over3)

    if (0 <= root1 && root1 <= 1) {
      roots.add(root1)
    }
    if (0 <= root2 && root2 <= 1) {
      roots.add(root2)
    }
    if (0 <= root3 && root3 <= 1) {
      roots.add(root3)
    }
  }

  return roots
}

type LookupTableOptions = {
  minSamples: number
  maxError: number
}

const defaultOptions: LookupTableOptions = {
  minSamples: 33,
  maxError: 0.01,
}

function addPointsOfInterest(samples: Map<number, number>, curve: Curve) {
  const segmentToNormalized = 1 / curve.segments.length
  for (const [index, segment] of curve.segments.entries()) {
    // all segment boundaries must be present in order to integrate
    // the curve over each sample interval
    samples.set(
      index * segmentToNormalized,
      curve.solve(index * segmentToNormalized),
    )

    // adding in the extrema and the midpoints between ensures
    // the tangent between to samples never intersects the curve
    // except at the sample points. such intersections  would
    // produce incorrect areas when integrating
    const extrema = Array.from(segment.localExtrema.entries())

    for (const [t, extreme] of extrema) {
      samples.set((index + t) * segmentToNormalized, extreme)
    }

    if (extrema.length === 4) {
      const segmentInflectionX = (extrema[1][0] + extrema[2][0]) / 2
      const segmentInflectionY = (extrema[1][1] + extrema[2][1]) / 2
      samples.set(
        (index + segmentInflectionX) * segmentToNormalized,
        segmentInflectionY,
      )
    }

    // all segment roots must be present because mixed signs will
    // produce incorrect areas
    const roots = cubicRootsInUnitInterval(segment.polynomial)
    for (const root of roots) {
      samples.set((index + root) * segmentToNormalized, 0)
    }
    samples.set(
      (index + 1) * segmentToNormalized,
      curve.solve((index + 1) * segmentToNormalized),
    )
  }
}

function getLookupTableIntegral(
  x1: number,
  x2: number,
  y1: number,
  y2: number,
) {
  const m = (y2 - y1) / (x2 - x1)
  const b = y1 - m * x1

  return Math.abs((x2 ** 2 * m) / 2 + b * x2 - (x1 ** 2 * m) / 2 - b * x1)
}

function getCurveSegmentIntegral(
  segment: CurveSegment,
  start: number,
  end: number,
) {
  const a = segment.polynomial[0] / 4
  const b = segment.polynomial[1] / 3
  const c = segment.polynomial[2] / 2
  const d = segment.polynomial[3]

  const y1 = a * start ** 4 + b * start ** 3 + c * start ** 2 + d * start
  const y2 = a * end ** 4 + b * end ** 3 + c * end ** 2 + d * end

  return Math.abs(y2 - y1)
}

function enforceMaxError(
  curve: Curve,
  samples: Map<number, number>,
  options: LookupTableOptions,
) {
  const intervalBoundaries = Array.from(samples.keys()).sort((a, b) => a - b)

  const normalizedToSegment = curve.segments.length

  const queue = [...intervalBoundaries]

  while (queue.length > 1) {
    const start = queue[0] as number
    const end = queue[1]

    const y1 = curve.solve(start)
    const y2 = curve.solve(end)

    const segment = curve.segments[Math.floor(start * normalizedToSegment)]

    const lutIntegral = getLookupTableIntegral(start, end, y1, y2)
    const curveIntegral = getCurveSegmentIntegral(segment, start, end)

    const error = Math.abs(lutIntegral - curveIntegral)

    if (error > options.maxError) {
      queue.splice(1, 0, (start + end) / 2)
    } else {
      samples.set(start, y1)
      queue.shift()
    }
  }
  samples.set(queue[0], curve.solve(queue[0]))
}

function sampleCurve(
  curve: Curve,
  options: LookupTableOptions,
): Map<number, number> {
  const { minSamples, maxError } = options

  const samples = new Map<number, number>()

  for (const t of createSamples(Math.max(minSamples, 2))) {
    samples.set(t, curve.solve(t))
  }

  if (maxError > 0) {
    addPointsOfInterest(samples, curve)

    console.log(samples)
    enforceMaxError(curve, samples, options)
  }

  const sortedKeys = Array.from(samples.keys()).sort((a, b) => a - b)

  return new Map(sortedKeys.map((key) => [key, samples.get(key) as number]))
}

export function createLookupTable(
  curve: Curve,
  options?: Partial<LookupTableOptions>,
) {
  const mergedOptions = { ...defaultOptions, ...options }

  const _samples = sampleCurve(curve, mergedOptions)
  // const
}
