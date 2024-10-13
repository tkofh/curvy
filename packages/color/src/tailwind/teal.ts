import { createCurve } from 'curvy'
import { createCatmullRomAxis } from 'curvy/axis'
import { createHslGetter } from '../util'

const hue = createCatmullRomAxis([
  166, 167, 168, 171, 172, 173, 175, 175, 176, 176, 179,
])

const saturation = createCatmullRomAxis([
  76, 85, 84, 77, 66, 80, 84, 77, 69, 61, 84,
])

const lightness = createCatmullRomAxis([
  97, 89, 78, 64, 50, 40, 32, 26, 22, 19, 10,
])

const shade = createCatmullRomAxis([
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
])

export const spline = createCurve({ hue, saturation, lightness, shade })

export const teal = createHslGetter(spline)
