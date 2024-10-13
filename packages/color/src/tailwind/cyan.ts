import { createCurve } from 'curvy'
import { createCatmullRomAxis } from 'curvy/axis'
import { createHslGetter } from '../util'

const hue = createCatmullRomAxis([
  183, 185, 186, 187, 188, 189, 192, 193, 194, 196, 197,
])

const saturation = createCatmullRomAxis([
  100, 96, 94, 92, 86, 94, 91, 82, 70, 64, 79,
])

const lightness = createCatmullRomAxis([
  96, 90, 82, 69, 53, 43, 36, 31, 27, 24, 15,
])

const shade = createCatmullRomAxis([
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
])

export const spline = createCurve({ hue, saturation, lightness, shade })

export const cyan = createHslGetter(spline)
