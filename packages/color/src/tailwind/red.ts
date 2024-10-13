import { createCurve } from 'curvy'
import { createCatmullRomAxis } from 'curvy/axis'
import { createHslGetter } from '../util'

const hue = createCatmullRomAxis([0, 0])

const saturation = createCatmullRomAxis([
  86, 93, 96, 94, 91, 84, 72, 74, 70, 63, 75,
])

const lightness = createCatmullRomAxis([
  97, 94, 89, 82, 71, 60, 51, 42, 35, 31, 15,
])

const shade = createCatmullRomAxis([
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
])

export const spline = createCurve({ hue, saturation, lightness, shade })

export const red = createHslGetter(spline)
