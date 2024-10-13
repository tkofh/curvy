import { createCurve } from 'curvy'
import { createCatmullRomAxis } from 'curvy/axis'
import { createHslGetter } from '../util'

const hue = createCatmullRomAxis([
  210, 210, 214, 213, 215, 215, 215, 215, 217, 222, 229,
])

const saturation = createCatmullRomAxis([
  40, 40, 32, 27, 20, 16, 19, 25, 33, 47, 84,
])

const lightness = createCatmullRomAxis([
  98, 96, 91, 84, 65, 47, 35, 27, 17, 11, 5,
])

const shade = createCatmullRomAxis([
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
])

export const spline = createCurve({ hue, saturation, lightness, shade })

export const slate = createHslGetter(spline)
