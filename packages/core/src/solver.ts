import invariant from 'tiny-invariant'
import type { Curve } from './curve'
import { createIntervalTree } from './interval'
import { createLengthLookup } from './sample'
import { remap, round } from './util'

type SolverOptions = {
  lengthAdjust: number
}

const defaultSolverOptions: SolverOptions = {
  lengthAdjust: 1,
}

export function createSolver(
  curve: Curve,
  options: Partial<SolverOptions> = {},
) {
  const { lengthAdjust: defaultLengthAdjust } = {
    ...defaultSolverOptions,
    ...options,
  }

  const lengthSamples = createLengthLookup(curve)

  const { search } = createIntervalTree(Array.from(lengthSamples.keys()))

  function solve(input: number, lengthAdjust = defaultLengthAdjust) {
    const query = round(input)

    invariant(typeof query === 'number', 'input must be a number')
    invariant(query >= 0 && query <= 1, 'input must be between 0 and 1')

    invariant(
      typeof lengthAdjust === 'number',
      'lengthAddjust must be a number',
    )
    invariant(
      lengthAdjust >= 0 && lengthAdjust <= 1,
      'lengthAddjust must be between 0 and 1',
    )

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

    return { input: t, output: curve.solve(t) }
  }

  return {
    solve,
    lengthSamples,
  }
}
