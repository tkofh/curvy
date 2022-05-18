import { PointObject, Spline, SplineMetadata } from '@curvy/types'
import { warnDev } from '@curvy/dx'

export const createProgressSolver = (
  dimension: 't' | 'length',
  meta: SplineMetadata,
  curves: Spline[]
) => {
  const cache = new Map<number, PointObject | undefined>()

  const inputMax = dimension === 't' ? 1 : meta.length

  const curveData = curves.map((curve) =>
    dimension === 't'
      ? {
          offset: 1 / curves.length,
          scalar: curves.length,
          solve: curve.solveT,
          inputMax: 1,
        }
      : {
          offset: curve.meta.length,
          scalar: 1,
          solve: curve.solveLength,
          inputMax: curve.meta.length,
        }
  )

  return (input: number): PointObject | undefined => {
    let output: PointObject | undefined

    if (input < 0) {
      warnDev(
        `Cannot get point at ${dimension} ${input} because curve is undefined below ${dimension} 0`
      )
    } else if (input > inputMax) {
      warnDev(
        `Cannot get point at ${dimension} ${input} because curve is undefined above ${dimension} ${meta.length}`
      )
    } else {
      let offset = 0

      for (const curve of curveData) {
        const adjusted = (input - offset) * curve.scalar

        if (adjusted <= curve.inputMax) {
          output = curve.solve(adjusted)
          break
        }

        offset += curve.offset
      }
    }

    cache.set(input, output)

    return output
  }
}
