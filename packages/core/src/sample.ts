import type { CurveAxis } from './axis'
import type { Point } from './curve'
import { createIntervalTree } from './interval'
import { type CubicPolynomial, computeCubicAntiderivative } from './polynomial'
import { invariant, remap } from './util'

function collectPointsOfInterest(axis: CurveAxis): Array<number> {
  const samples = new Set<number>(Array.from({ length: 33 }, (_, i) => i / 32))
  const segmentToNormalized = 1 / axis.segments.length
  for (const [index, segment] of axis.segments.entries()) {
    samples.add(index * segmentToNormalized)
    samples.add((index + 1) * segmentToNormalized)

    for (const t of segment.extrema) {
      samples.add((index + t) * segmentToNormalized)
    }

    for (const root of segment.roots) {
      samples.add((index + root) * segmentToNormalized)
    }

    for (const root of segment.derivative.roots) {
      samples.add((index + root) * segmentToNormalized)
    }
  }
  return Array.from(samples).sort((a, b) => a - b)
}

function takeLinearIntegral(x1: number, x2: number, y1: number, y2: number) {
  const m = (y2 - y1) / (x2 - x1)
  const b = y1 - m * x1

  const s1 = (x1 ** 2 * m) / 2 + b * x1
  const s2 = (x2 ** 2 * m) / 2 + b * x2

  return Math.abs(s2 - s1)
}

function takePolynomialIntegral(
  coefficients: ReadonlyArray<number>,
  start: number,
  end: number,
): number {
  let s1 = 0
  let s2 = 0

  for (const [index, coefficient] of coefficients.entries()) {
    const power = coefficients.length - index
    s1 += (coefficient * start ** power) / power
    s2 += (coefficient * end ** power) / power
  }

  return Math.abs(s2 - s1)
}

type LengthData = { length: number; lookup: Map<number, number> }

function* createAxisSampler<Axis extends string | number>(
  key: Axis,
  axis: CurveAxis,
) {
  const queue = collectPointsOfInterest(axis)
  let totalLength = 0

  const lengthLookup = new Map<number, number>()

  while (queue.length > 0) {
    const current = queue[0] as number
    const next = queue[1]

    if (next === undefined) {
      yield current
      lengthLookup.set(totalLength, current)
      break
    }

    const segment = axis.segments[
      Math.floor(current * axis.segments.length)
    ] as CubicPolynomial

    const currentPosition = axis.solvePosition(current)
    const nextPosition = axis.solvePosition(next)

    const currentVelocity = axis.solveVelocity(current)
    const nextVelocity = axis.solveVelocity(next)

    const lutPositionIntegral = takeLinearIntegral(
      current,
      next,
      currentPosition,
      nextPosition,
    )
    const curvePositionIntegral = takePolynomialIntegral(
      computeCubicAntiderivative(segment.coefficients, 0),
      current,
      next,
    )

    const lutVelocityIntegral = takeLinearIntegral(
      current,
      next,
      currentVelocity,
      nextVelocity,
    )
    const curveVelocityIntegral = takePolynomialIntegral(
      segment.derivative.coefficients,
      current,
      next,
    )

    const error = Math.max(
      Math.abs(lutPositionIntegral - curvePositionIntegral),
      Math.abs(lutVelocityIntegral - curveVelocityIntegral),
    )

    if (error > 1) {
      queue.splice(1, 0, (current + next) / 2)
    } else {
      yield current
      lengthLookup.set(totalLength, current)
      totalLength += Math.hypot(current - next, currentPosition - nextPosition)
      queue.shift()
    }
  }

  return [
    key,
    {
      length: totalLength,
      lookup: lengthLookup,
    },
  ] as [Axis, LengthData]
}

type AxisSampler<Axis extends string | number> = Generator<
  number,
  readonly [Axis, LengthData]
>

function distance<Axis extends string | number>(
  a: Point<Axis>,
  b: Point<Axis>,
) {
  const deltas: Array<number> = []
  for (const key of Object.keys(a) as Array<Axis>) {
    deltas.push(a[key] - b[key])
  }
  return Math.hypot(...deltas)
}

function createSampleBuffer<Axis extends string | number>() {
  const values = new Map<number, Set<AxisSampler<Axis>>>()
  return {
    get size() {
      return values.size
    },
    add(key: number, value: AxisSampler<Axis>) {
      if (!values.has(key)) {
        values.set(key, new Set())
      }
      values.get(key)?.add(value)
    },
    get(key: number): Set<AxisSampler<Axis>> {
      return values.get(key) as Set<AxisSampler<Axis>>
    },
    remove(key: number, value: AxisSampler<Axis>) {
      values.get(key)?.delete(value)
      if (values.get(key)?.size === 0) {
        values.delete(key)
      }
    },
    keys() {
      return Array.from(values.keys())
    },
  }
}

type LengthLookup = (length: number) => number

function createLengthLookup({
  length: totalLength,
  lookup,
}: LengthData): LengthLookup {
  const { search } = createIntervalTree(Array.from(lookup.keys()))

  return (normalized: number) => {
    invariant(normalized >= 0 && normalized <= 1, 'Length out of bounds')
    const length = normalized * totalLength

    const result = search(length)

    invariant(result !== null, 'Length not found')

    return remap(
      length,
      result[0],
      result[1],
      lookup.get(result[0]) as number,
      lookup.get(result[1]) as number,
    )
  }
}

export function createCurveLengthLookups<Axis extends string | number>(
  axes: Record<Axis, CurveAxis>,
  positionAt: (t: number) => Point<Axis>,
): { curve: LengthLookup; axes: Record<Axis, LengthLookup> } {
  const lengthLookup = new Map<number, number>()

  const axesLookups = {} as Record<Axis, LengthLookup>
  const sampleBuffer = createSampleBuffer<Axis>()

  for (const [key, axis] of Object.entries(axes) as Array<[Axis, CurveAxis]>) {
    const sampler = createAxisSampler(key, axis)

    const first = sampler.next()
    if (first.done) {
      axesLookups[first.value[0]] = createLengthLookup(first.value[1])
    } else {
      sampleBuffer.add(first.value, sampler)
    }
  }

  let lastPoint = positionAt(0)
  let length = 0
  lengthLookup.set(0, 0)

  while (sampleBuffer.size > 0) {
    const t = Math.min(...sampleBuffer.keys())
    const point = positionAt(t)
    length += distance(lastPoint, point)
    lengthLookup.set(length, t)
    lastPoint = point

    const samplers = sampleBuffer.get(t)

    for (const sampler of samplers) {
      const next = sampler.next()
      if (next.done) {
        axesLookups[next.value[0]] = createLengthLookup(next.value[1])
      } else {
        sampleBuffer.add(next.value, sampler)
      }
      sampleBuffer.remove(t, sampler)
    }
  }

  return {
    curve: createLengthLookup({ length, lookup: lengthLookup }),
    axes: axesLookups,
  }
}
