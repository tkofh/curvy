import { createCurve } from 'curvy'
import { createCatmullRomAxis } from 'curvy/axis'
import { createHslGetter } from '../util'

const hue = createCatmullRomAxis([
  152, 149, 152, 156, 158, 160, 161, 163, 163, 164, 166,
])

const saturation = createCatmullRomAxis([
  81, 80, 76, 72, 64, 84, 94, 94, 88, 86, 91,
])

const lightness = createCatmullRomAxis([
  96, 90, 80, 67, 52, 39, 30, 24, 20, 16, 9,
])

const shade = createCatmullRomAxis([
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
])

export const spline = createCurve({ hue, saturation, lightness, shade })

export const emerald = createHslGetter(spline)
