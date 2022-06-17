import { PointObject, Spline, Bounds } from '@curvy/types'
import { remap, roundTo } from 'micro-math'

export const toPath = (spline: Spline, resolution: number, remapTo?: Bounds): string => {
  const points: PointObject[] = []

  for (let i = 0; i < resolution; i++) {
    const x = remap(i, 0, resolution - 1, spline.meta.bounds.x.min, spline.meta.bounds.x.max)

    points.push({ x, y: spline.solveY(x)! })
  }

  const pathCommands: string[] = []

  for (const [index, point] of points.entries()) {
    let pathX!: number
    let pathY!: number
    if (remapTo === undefined) {
      pathX = point.x
      pathY = roundTo(
        remap(
          point.y,
          spline.meta.bounds.y.min,
          spline.meta.bounds.y.max,
          spline.meta.bounds.y.max,
          spline.meta.bounds.y.min
        ),
        2
      )
    } else {
      pathX = roundTo(
        remap(
          point.x,
          spline.meta.bounds.x.min,
          spline.meta.bounds.x.max,
          remapTo.x.min,
          remapTo.x.max
        ),
        2
      )
      pathY = roundTo(
        remap(
          point.y,
          spline.meta.bounds.y.min,
          spline.meta.bounds.y.max,
          remapTo.y.min,
          remapTo.y.max
        ),
        2
      )
    }

    pathCommands.push(`${index === 0 ? 'M' : 'L'} ${pathX} ${pathY}`)
  }

  return pathCommands.join(' ')
}
