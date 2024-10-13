import { createCurve } from 'curvy'
import { createCatmullRomAxis } from 'curvy/axis'
import { createHslGetter } from '../util'

const hue = createCatmullRomAxis([
  214, 214, 213, 212, 213, 217, 221, 224, 226, 224, 226,
])

const saturation = createCatmullRomAxis([
  100, 95, 97, 96, 94, 91, 83, 76, 71, 64, 57,
])

const lightness = createCatmullRomAxis([
  97, 93, 87, 78, 68, 60, 53, 48, 40, 33, 21,
])

const shade = createCatmullRomAxis([
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
])

export const spline = createCurve({ hue, saturation, lightness, shade })

export const blue = createHslGetter(spline)
