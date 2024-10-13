import { createCurve } from 'curvy'
import { createCatmullRomAxis } from 'curvy/axis'
import { createHslGetter } from '../util'

const hue = createCatmullRomAxis([
  138, 141, 141, 142, 142, 142, 142, 142, 143, 144, 145,
])

const saturation = createCatmullRomAxis([
  76, 84, 79, 77, 69, 71, 76, 72, 64, 61, 80,
])

const lightness = createCatmullRomAxis([
  97, 93, 85, 73, 58, 45, 36, 29, 24, 20, 10,
])

const shade = createCatmullRomAxis([
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
])

export const spline = createCurve({ hue, saturation, lightness, shade })

export const green = createHslGetter(spline)
