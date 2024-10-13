import { createCurve } from 'curvy'
import { createCatmullRomAxis } from 'curvy/axis'
import { createHslGetter } from '../util'

const hue = createCatmullRomAxis([78, 80, 81, 82, 83, 84, 85, 86, 86, 88, 89])

const saturation = createCatmullRomAxis([
  92, 89, 88, 85, 78, 81, 85, 78, 69, 61, 80,
])

const lightness = createCatmullRomAxis([
  95, 89, 80, 67, 55, 44, 35, 27, 23, 20, 10,
])

const shade = createCatmullRomAxis([
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
])

export const spline = createCurve({ hue, saturation, lightness, shade })

export const lime = createHslGetter(spline)
