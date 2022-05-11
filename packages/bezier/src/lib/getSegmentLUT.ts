import { distance } from '@curvy/math'
import { createCubicBezierSolver } from './createCubicBezierSolver'

interface LUT {
  x: number[]
  y: number[]
  length: number[]
}

export const getSegmentLUT = (
  samples: number,
  p0x: number,
  p0y: number,
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
  p3x: number,
  p3y: number
): LUT => {
  const solveXForT = createCubicBezierSolver(p0x, p1x, p2x, p3x)
  const solveYForT = createCubicBezierSolver(p0y, p1y, p2y, p3y)

  const lut: LUT = {
    x: [p0x],
    y: [p0y],
    length: [0],
  }

  let prevX = p0x
  let prevY = p0y
  let prevLength = 0

  for (let s = 1; s < samples - 1; s++) {
    const t = s / (samples - 1)

    const currentX = solveXForT(t)
    const currentY = solveYForT(t)

    const currentLength = prevLength + distance(prevX, prevY, currentX, currentY)

    lut.x.push(currentX)
    lut.y.push(currentY)
    lut.length.push(currentLength)

    prevX = currentX
    prevY = currentY
    prevLength = currentLength
  }

  lut.x.push(p3x)
  lut.y.push(p3y)
  lut.length.push(prevLength + distance(prevX, prevY, p3x, p3y))

  return lut
}
