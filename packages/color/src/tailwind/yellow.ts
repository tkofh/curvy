import { createCurve } from 'curvy'
import { createCatmullRomAxis } from 'curvy/axis'
import { createHslGetter } from '../util'

const hue = createCatmullRomAxis([55, 55, 53, 50, 48, 45, 41, 35, 32, 28, 26])

const saturation = createCatmullRomAxis([
  92, 97, 98, 98, 96, 93, 96, 92, 81, 73, 83,
])

const lightness = createCatmullRomAxis([
  95, 88, 77, 64, 53, 47, 40, 33, 29, 26, 14,
])

const shade = createCatmullRomAxis([
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
])

export const spline = createCurve({ hue, saturation, lightness, shade })

export const yellow = createHslGetter(spline)
