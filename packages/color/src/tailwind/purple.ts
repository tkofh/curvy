import { createCurve } from 'curvy'
import { createCatmullRomAxis } from 'curvy/axis'
import { createHslGetter } from '../util'

const hue = createCatmullRomAxis([
  270, 269, 269, 269, 270, 271, 271, 272, 273, 274, 274,
])

const saturation = createCatmullRomAxis([
  100, 100, 100, 97, 95, 91, 81, 72, 67, 66, 87,
])

const lightness = createCatmullRomAxis([
  98, 95, 92, 85, 75, 65, 56, 47, 39, 32, 21,
])

const shade = createCatmullRomAxis([
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
])

export const spline = createCurve({ hue, saturation, lightness, shade })

export const purple = createHslGetter(spline)
