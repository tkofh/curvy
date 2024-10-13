import { createCurve } from 'curvy'
import { createCatmullRomAxis } from 'curvy/axis'
import { createHslGetter } from '../util'

const hue = createCatmullRomAxis([
  210, 220, 220, 216, 218, 220, 215, 217, 215, 221, 224,
])

const saturation = createCatmullRomAxis([
  20, 14, 13, 12, 11, 9, 14, 19, 28, 39, 71,
])

const lightness = createCatmullRomAxis([
  98, 96, 91, 84, 65, 46, 34, 27, 17, 11, 4,
])

const shade = createCatmullRomAxis([
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
])

export const spline = createCurve({ hue, saturation, lightness, shade })

export const gray = createHslGetter(spline)
