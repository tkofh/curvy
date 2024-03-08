import invariant from 'tiny-invariant'
import type { Curve } from './curve'
import { createIntervalTree } from './interval'
import { createLengthLookup } from './sample'
import type { LengthLookupOptions } from './sample'
import { remap, round } from './util'

type Prettify<T> = T extends infer U ? { [K in keyof U]: U[K] } : never

type SolverOptions = Prettify<
  LengthLookupOptions & {
    lengthAdjust: number
  }
>

const defaultSolverOptions: SolverOptions = {
  minSamples: 64,
  maxError: 0.001,
  lengthAdjust: 1,
}

export function createSolver(
  curve: Curve,
  options: Partial<SolverOptions> = {},
) {
  const {
    maxError,
    minSamples,
    lengthAdjust: defaultLengthAdjust,
  } = {
    ...defaultSolverOptions,
    ...options,
  }

  const lengthSamples = createLengthLookup(curve, { maxError, minSamples })

  const { search } = createIntervalTree(Array.from(lengthSamples.keys()))

  return function solve(input: number, lengthAdjust = defaultLengthAdjust) {
    const query = round(input)

    invariant(query >= 0 && query <= 1, 'input must be between 0 and 1')

    let t!: number

    if (lengthAdjust === 0) {
      t = query
    } else {
      const lengthRange = search(query)

      invariant(lengthRange, 'lengthRange must be defined')

      const [length1, length2] = lengthRange
      const t1 = lengthSamples.get(length1) as number
      const t2 = lengthSamples.get(length2) as number

      const lengthT = remap(query, length1, length2, t1, t2)

      if (lengthAdjust === 1) {
        t = lengthT
      } else {
        t = (1 - lengthAdjust) * query + lengthAdjust * lengthT
      }
    }

    return curve.solve(t)
  }
}
