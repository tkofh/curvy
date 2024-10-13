import { createCurve } from 'curvy'
import { createCatmullRomAxis } from 'curvy/axis'
import { createHslGetter } from '../util'

const hue = createCatmullRomAxis([
  226, 226, 228, 230, 234, 239, 243, 245, 244, 242, 244,
])

const saturation = createCatmullRomAxis([
  100, 100, 96, 94, 89, 84, 75, 58, 55, 47, 47,
])

const lightness = createCatmullRomAxis([
  97, 94, 89, 82, 74, 67, 59, 51, 41, 34, 20,
])

const shade = createCatmullRomAxis([
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
])

export const spline = createCurve({ hue, saturation, lightness, shade })

export const indigo = createHslGetter(spline)
