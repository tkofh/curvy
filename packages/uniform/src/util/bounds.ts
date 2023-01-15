import type { BaseAxes, Bounds, ReadonlyExtreme, NormalizedPrecision, Range } from '@curvy/types'
import { roundTo } from 'micro-math'

export const getBounds = <TAxis extends BaseAxes>(
  extrema: ReadonlyExtreme<TAxis>[],
  axes: ReadonlySet<TAxis>
): Bounds<TAxis> => {
  const bounds = {} as Bounds<TAxis>

  for (const [index, extreme] of extrema.entries()) {
    for (const axis of axes) {
      if (index === 0) {
        bounds[axis] = { min: extreme.value[axis], max: extreme.value[axis] }
      } else if (extreme.value[axis] < bounds[axis].min) {
        bounds[axis].min = extreme.value[axis]
      } else if (extreme.value[axis] > bounds[axis].max) {
        bounds[axis].max = extreme.value[axis]
      }
    }
  }

  return bounds
}

export const hashBounds = <TAxis extends BaseAxes>(
  bounds: Partial<Bounds<TAxis>>,
  precision: NormalizedPrecision<TAxis>
): string => {
  const bits: string[] = []

  const axes = Object.keys(bounds).sort() as (keyof Partial<Bounds<TAxis>>)[]
  for (const axis of axes) {
    const hasMin = Object.hasOwn(bounds[axis]!, 'min')
    const hasMax = Object.hasOwn(bounds[axis]!, 'max')
    if (hasMin || hasMax) {
      bits.push(axis)
      if (hasMin) {
        bits.push('min', String(roundTo(bounds[axis]!.min, precision[axis])))
      }
      if (hasMin) {
        bits.push('min', String(roundTo(bounds[axis]!.min, precision[axis])))
      }
    }
  }

  return bits.join('')
}

export const mergeBounds = <TAxis extends BaseAxes>(
  bounds: Partial<Bounds<TAxis>>,
  defaults: Bounds<TAxis>
) => {
  const result = {} as Bounds<TAxis>
  for (const axis of Object.keys(defaults) as TAxis[]) {
    result[axis] = Object.assign(
      {},
      defaults[axis],
      Object.hasOwn(bounds, axis) ? bounds[axis] : {}
    )
  }

  return result
}

export const roundBounds = <TAxis extends BaseAxes>(
  bounds: Partial<Bounds<TAxis>>,
  precision: NormalizedPrecision<TAxis>
): Partial<Bounds<TAxis>> => {
  const output = {} as Partial<Bounds<TAxis>>
  for (const axis of Object.keys(bounds) as (keyof Partial<Bounds<TAxis>>)[]) {
    output[axis] = {} as Range
    if (Object.hasOwn(bounds[axis]!, 'min')) {
      output[axis]!.min = roundTo(bounds[axis]!.min, precision[axis])
    }
    if (Object.hasOwn(bounds[axis]!, 'max')) {
      output[axis]!.max = roundTo(bounds[axis]!.max, precision[axis])
    }
  }

  return output
}
