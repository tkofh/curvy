import { createCurve } from 'curvy'
import { createCatmullRomAxis } from 'curvy/axis'
import { createHslGetter } from '../util'

const hue = createCatmullRomAxis([33, 34, 32, 31, 27, 25, 21, 17, 15, 15, 13])

const saturation = createCatmullRomAxis([
  100, 100, 98, 97, 96, 95, 90, 88, 79, 75, 81,
])

const lightness = createCatmullRomAxis([
  96, 92, 83, 72, 61, 53, 48, 40, 34, 28, 15,
])

const shade = createCatmullRomAxis([
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
])

export const spline = createCurve({ hue, saturation, lightness, shade })

export const orange = createHslGetter(spline)
