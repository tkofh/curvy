import { createCurve } from 'curvy'
import { createCatmullRomAxis } from 'curvy/axis'
import { createHslGetter } from '../util'

const hue = createCatmullRomAxis([
  327, 326, 326, 327, 329, 330, 333, 335, 336, 336, 336,
])

const saturation = createCatmullRomAxis([
  73, 78, 85, 87, 86, 81, 71, 78, 74, 69, 84,
])

const lightness = createCatmullRomAxis([
  97, 95, 90, 82, 70, 60, 51, 42, 35, 30, 17,
])

const shade = createCatmullRomAxis([
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
])

export const spline = createCurve({ hue, saturation, lightness, shade })

export const pink = createHslGetter(spline)
