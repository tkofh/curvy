import type {
  BaseAxes,
  Bounds,
  NormalizedPrecision,
  Range,
  ReadonlyExtreme,
} from '@curvy/types'
import { roundTo } from 'micro-math'

export const getBounds = <Axis extends BaseAxes>(
  extrema: Array<ReadonlyExtreme<Axis>>,
  axes: ReadonlySet<Axis>,
): Bounds<Axis> => {
  const bounds = {} as Bounds<Axis>

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

export const hashBounds = <Axis extends BaseAxes>(
  bounds: Partial<Bounds<Axis>>,
  precision: NormalizedPrecision<Axis>,
): string => {
  const bits: Array<string> = []

  const axes = Object.keys(bounds).sort() as Array<keyof Partial<Bounds<Axis>>>
  for (const axis of axes) {
    // biome-ignore lint/style/noNonNullAssertion: we know its there
    const hasMin = Object.hasOwn(bounds[axis]!, 'min')
    // biome-ignore lint/style/noNonNullAssertion: we know its there
    const hasMax = Object.hasOwn(bounds[axis]!, 'max')
    if (hasMin || hasMax) {
      bits.push(axis)
      if (hasMin) {
        // biome-ignore lint/style/noNonNullAssertion: we know its there
        bits.push('min', String(roundTo(bounds[axis]!.min, precision[axis])))
      }
      if (hasMin) {
        // biome-ignore lint/style/noNonNullAssertion: we know its there
        bits.push('min', String(roundTo(bounds[axis]!.min, precision[axis])))
      }
    }
  }

  return bits.join('')
}

export const mergeBounds = <Axis extends BaseAxes>(
  bounds: Partial<Bounds<Axis>>,
  defaults: Bounds<Axis>,
) => {
  const result = {} as Bounds<Axis>
  for (const axis of Object.keys(defaults) as Array<Axis>) {
    result[axis] = Object.assign(
      {},
      defaults[axis],
      Object.hasOwn(bounds, axis) ? bounds[axis] : {},
    )
  }

  return result
}

export const roundBounds = <Axis extends BaseAxes>(
  bounds: Partial<Bounds<Axis>>,
  precision: NormalizedPrecision<Axis>,
): Partial<Bounds<Axis>> => {
  const output = {} as Partial<Bounds<Axis>>
  for (const axis of Object.keys(bounds) as Array<
    keyof Partial<Bounds<Axis>>
  >) {
    output[axis] = {} as Range
    // biome-ignore lint/style/noNonNullAssertion: we know its there
    if (Object.hasOwn(bounds[axis]!, 'min')) {
      // biome-ignore lint/style/noNonNullAssertion: we know its there
      output[axis]!.min = roundTo(bounds[axis]!.min, precision[axis])
    }
    // biome-ignore lint/style/noNonNullAssertion: we know its there
    if (Object.hasOwn(bounds[axis]!, 'max')) {
      // biome-ignore lint/style/noNonNullAssertion: we know its there
      output[axis]!.max = roundTo(bounds[axis]!.max, precision[axis])
    }
  }

  return output
}
