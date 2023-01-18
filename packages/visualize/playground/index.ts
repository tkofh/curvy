import {
  bezier,
  bSpline,
  convertControlPoints,
  createCubicUniformSpline,
  hermite,
} from '@curvy/uniform'
import type { CubicPoints } from '@curvy/types'
import { drawSplineSVG } from '../src'

window.addEventListener('load', () => {
  const points: CubicPoints<'x' | 'y'> = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 0, y: 100 },
    { x: 100, y: 100 },
  ]

  const spline = createCubicUniformSpline([points], bezier)

  const spline2 = createCubicUniformSpline(
    [convertControlPoints(points, bezier, hermite, 0)],
    hermite
  )
  const spline3 = createCubicUniformSpline(
    [convertControlPoints(points, bezier, bSpline, 0)],
    bSpline
  )

  console.log(spline.solveT(0.3))
  console.log(spline2.solveT(0.3))
  console.log(spline3.solveT(0.3))

  console.log({ spline, spline2, spline3 })

  document.querySelector('#app')!.innerHTML =
    drawSplineSVG(spline, {
      strategy: 'sample',
      sampleCount: 100,
      axes: { x: 'x', y: 'y' },
    }) +
    drawSplineSVG(spline2, {
      strategy: 'sample',
      sampleCount: 100,
      axes: { x: 'x', y: 'y' },
    }) +
    drawSplineSVG(spline3, {
      strategy: 'sample',
      sampleCount: 100,
      axes: { x: 'x', y: 'y' },
    })
})
