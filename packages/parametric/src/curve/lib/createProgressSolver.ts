import { PointObject, SplineMetadata } from '@curvy/types'
import { warnDev } from '@curvy/dx'
import { remap, roundTo } from '@curvy/math'
import { rangeIncludes } from '../../common'

export const createProgressSolver = (dimension: 'length' | 't', meta: SplineMetadata) => {
  const cache = new Map<number, PointObject | undefined>()

  const inputMax = meta.lut[meta.lut.length - 1][dimension]

  return (input: number): Readonly<PointObject> | undefined => {
    let output: PointObject | undefined

    if (cache.has(input)) {
      output = cache.get(input)
    } else if (input < 0) {
      warnDev(
        `Cannot get point at ${dimension} ${input} because curve is undefined below ${dimension} 0`
      )
    } else if (input > inputMax) {
      warnDev(
        `Cannot get point at ${dimension} ${input} because curve is undefined above ${dimension} ${inputMax}`
      )
    } else {
      for (let i = 0; i < meta.lut.length - 1; i++) {
        if (input === meta.lut[i][dimension]) {
          output = {
            x: roundTo(meta.lut[i].x, meta.precisionX),
            y: roundTo(meta.lut[i].y, meta.precisionY),
          }
        } else if (input === meta.lut[i + 1][dimension]) {
          output = {
            x: roundTo(meta.lut[i + 1].x, meta.precisionX),
            y: roundTo(meta.lut[i + 1].y, meta.precisionY),
          }
        } else if (rangeIncludes(input, meta.lut[i][dimension], meta.lut[i + 1][dimension])) {
          output = {
            x: roundTo(
              remap(
                input,
                meta.lut[i][dimension],
                meta.lut[i + 1][dimension],
                meta.lut[i].x,
                meta.lut[i + 1].x
              ),
              meta.precisionX
            ),
            y: roundTo(
              remap(
                input,
                meta.lut[i][dimension],
                meta.lut[i + 1][dimension],
                meta.lut[i].y,
                meta.lut[i + 1].y
              ),
              meta.precisionY
            ),
          }
        }

        if (output !== undefined) {
          break
        }
      }
    }

    cache.set(input, output)

    return output
  }
}
