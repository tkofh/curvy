import { createCurve } from 'curvy'
import { createCatmullRomAxis } from 'curvy/axis'
import { createHslGetter } from '../util'

const hue = createCatmullRomAxis([
  250, 251, 251, 252, 255, 258, 262, 263, 263, 264, 264,
])

const saturation = createCatmullRomAxis([
  100, 91, 95, 95, 92, 90, 83, 70, 69, 67, 73,
])

const lightness = createCatmullRomAxis([
  98, 95, 92, 85, 76, 66, 58, 50, 42, 35, 23,
])

const shade = createCatmullRomAxis([
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
])

export const spline = createCurve({ hue, saturation, lightness, shade })

export const violet = createHslGetter(spline)
