import { createCurve } from 'curvy'
import { createCatmullRomAxis } from 'curvy/axis'
import { createHslGetter } from '../util'

const hue = createCatmullRomAxis([60, 60, 20, 24, 24, 25, 33, 30, 12, 24, 20])

const saturation = createCatmullRomAxis([9, 5, 6, 6, 5, 5, 5, 6, 6, 10, 14])

const lightness = createCatmullRomAxis([
  98, 96, 90, 83, 64, 45, 32, 25, 15, 10, 4,
])

const shade = createCatmullRomAxis([
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
])

export const spline = createCurve({ hue, saturation, lightness, shade })

export const stone = createHslGetter(spline)
