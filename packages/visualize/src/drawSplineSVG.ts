import type { BaseAxes, CubicSpline } from '@curvy/types'

interface DrawAxes<Axis extends BaseAxes> {
  x: Axis
  y: Axis
}

interface BaseOptions<Axis extends BaseAxes> {
  padding?: number
  axes: DrawAxes<Axis>
}

interface BezierOptions {
  strategy: 'bezier'
}

interface SampleOptions {
  strategy: 'sample'
  sampleCount?: number
}

type Options<Axis extends BaseAxes> = BaseOptions<Axis> &
  (BezierOptions | SampleOptions)

const DEFAULT_PADDING = 20

export const drawSplineSVG = <Axis extends BaseAxes>(
  spline: CubicSpline<Axis>,
  options: Options<Axis>,
): string => {
  let svg = ''

  const padding = options.padding ?? DEFAULT_PADDING

  const height =
    spline.bounds[options.axes.y].max - spline.bounds[options.axes.y].min

  svg += `<svg viewBox="${[
    spline.bounds[options.axes.x].min - padding,
    spline.bounds[options.axes.y].min - padding,
    spline.bounds[options.axes.x].max -
      spline.bounds[options.axes.x].min +
      padding * 2,
    height + padding * 2,
  ].join(' ')}">`

  if (options.strategy === 'sample') {
    let path = ''

    const sampleCount = options.sampleCount ?? 100
    const segmentLength = 1 / (sampleCount - 1)

    for (let i = 0; i < sampleCount; i++) {
      const point = spline.solveT(i * segmentLength)
      path += `${i === 0 ? 'M' : ' L'}${point[options.axes.x]},${
        height - point[options.axes.y]
      }`
    }

    svg += `<path d="${path}" stroke="black" stroke-width="2" fill="none" />`
  }

  svg += '</svg>'

  return svg
}
