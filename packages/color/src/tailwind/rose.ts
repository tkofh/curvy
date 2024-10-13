import { createCurve } from 'curvy'
import { createCatmullRomAxis } from 'curvy/axis'
import { createHslGetter } from '../util'

const hue = createCatmullRomAxis([
  356, 356, 353, 353, 351, 350, 347, 345, 343, 342, 343,
])

const saturation = createCatmullRomAxis([
  100, 100, 96, 96, 95, 89, 77, 83, 80, 75, 88,
])

const lightness = createCatmullRomAxis([
  97, 95, 90, 82, 71, 60, 50, 41, 35, 30, 16,
])

const shade = createCatmullRomAxis([
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
])

export const spline = createCurve({ hue, saturation, lightness, shade })

export const rose = createHslGetter(spline)
