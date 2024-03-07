import invariant from 'tiny-invariant'
import type { Curve } from './curve'
import { createIntervalTree } from './interval'
import { remapSamplesByLength, sampleCurve } from './sample'
import type { SamplingOptions } from './sample'
import { remap, round } from './util'

function createSolver(samples: Map<number, number>) {
  const { search } = createIntervalTree(Array.from(samples.keys()))

  return function solve(input: number) {
    const query = round(input)

    invariant(query >= 0 && query <= 1, 'input must be between 0 and 1')

    const result = search(query)

    invariant(result, 'result must be defined')

    const [x1, x2] = result

    const y1 = samples.get(x1) as number
    const y2 = samples.get(x2) as number

    return remap(query, x1, x2, y1, y2)
  }
}

export function createTSpaceSolver(
  curve: Curve,
  options: Partial<SamplingOptions> = {},
) {
  const samples = sampleCurve(curve, options)

  return createSolver(samples)
}

export function createNormalizedLengthSolver(
  curve: Curve,
  options: Partial<SamplingOptions> = {},
) {
  const samples = sampleCurve(curve, options)
  const lengthSamples = remapSamplesByLength(samples)

  return createSolver(lengthSamples)
}
