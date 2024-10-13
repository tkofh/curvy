import { createCurve } from 'curvy'
import { createCatmullRomAxis } from 'curvy/axis'
import { createHslGetter } from '../util'

const hue = createCatmullRomAxis([48, 48, 48, 46, 43, 38, 32, 26, 23, 22, 21])

const saturation = createCatmullRomAxis([
  100, 96, 97, 97, 96, 92, 95, 90, 83, 78, 92,
])

const lightness = createCatmullRomAxis([
  96, 89, 77, 65, 56, 50, 44, 37, 31, 26, 14,
])

const shade = createCatmullRomAxis([
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
])

export const spline = createCurve({ hue, saturation, lightness, shade })

export const amber = createHslGetter(spline)
