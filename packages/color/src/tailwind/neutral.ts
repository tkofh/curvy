import { createCurve } from 'curvy'
import { createCatmullRomAxis } from 'curvy/axis'
import { createHslGetter } from '../util'

const hue = createCatmullRomAxis([0, 0])

const saturation = createCatmullRomAxis([0, 0])

const lightness = createCatmullRomAxis([
  98, 96, 90, 83, 64, 45, 32, 25, 15, 9, 4,
])

const shade = createCatmullRomAxis([
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
])

export const spline = createCurve({ hue, saturation, lightness, shade })

export const neutral = createHslGetter(spline)
