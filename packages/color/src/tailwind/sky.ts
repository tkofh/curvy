import { createCurve } from 'curvy'
import { createCatmullRomAxis } from 'curvy/axis'
import { createHslGetter } from '../util'

const hue = createCatmullRomAxis([
  204, 204, 201, 199, 198, 199, 200, 201, 201, 202, 204,
])

const saturation = createCatmullRomAxis([
  100, 94, 94, 95, 93, 89, 98, 96, 90, 80, 80,
])

const lightness = createCatmullRomAxis([
  97, 94, 86, 74, 60, 48, 39, 32, 27, 24, 16,
])

const shade = createCatmullRomAxis([
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
])

export const spline = createCurve({ hue, saturation, lightness, shade })

export const sky = createHslGetter(spline)
