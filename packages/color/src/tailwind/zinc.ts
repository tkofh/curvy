import { createCurve } from 'curvy'
import { createCatmullRomAxis } from 'curvy/axis'
import { createHslGetter } from '../util'

const hue = createCatmullRomAxis([240, 240])

const saturation = createCatmullRomAxis([0, 5, 6, 5, 5, 4, 5, 5, 4, 6, 10])

const lightness = createCatmullRomAxis([
  95, 88, 77, 64, 53, 47, 40, 33, 29, 26, 14,
])

const shade = createCatmullRomAxis([98, 96, 90, 84, 65, 46, 34, 26, 16, 10, 4])

export const spline = createCurve({ hue, saturation, lightness, shade })

export const zinc = createHslGetter(spline)
