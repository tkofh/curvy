import { Point, Points } from '@curvy/types'
import { cubicPolynomial, roundTo } from '@curvy/math'
import { collapseExtrema } from '../../common'

export const getExtrema = (
  primeRootsX: number[],
  primeRootsY: number[],
  precisionX: number,
  precisionY: number,
  xba: number,
  xbb: number,
  xbc: number,
  xbd: number,
  yba: number,
  ybb: number,
  ybc: number,
  ybd: number
): Points => {
  const orderedRoots = Array.from(new Set<number>([0, 1, ...primeRootsX, ...primeRootsY])).sort(
    (a, b) => a - b
  )

  const candidates = orderedRoots.map(
    (root) =>
      [
        roundTo(cubicPolynomial(root, xba, xbb, xbc, xbd), precisionX),
        roundTo(cubicPolynomial(root, yba, ybb, ybc, ybd), precisionY),
      ] as Point
  )

  return collapseExtrema(candidates)
}
