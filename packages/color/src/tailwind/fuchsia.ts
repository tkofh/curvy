import { createCurve } from 'curvy'
import { createCatmullRomAxis } from 'curvy/axis'
import { createHslGetter } from '../util'

const hue = createCatmullRomAxis([
  289, 287, 288, 291, 292, 292, 293, 295, 295, 297, 297,
])

const saturation = createCatmullRomAxis([
  100, 100, 96, 93, 91, 84, 69, 72, 70, 64, 90,
])

const lightness = createCatmullRomAxis([
  98, 95, 91, 83, 73, 61, 49, 40, 33, 28, 16,
])

const shade = createCatmullRomAxis([
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
])

export const spline = createCurve({ hue, saturation, lightness, shade })

export const fuchsia = createHslGetter(spline)
