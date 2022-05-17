import { Rect, Spline } from '@curvy/types'

export const getBoundingBox = (curves: Spline[]): Rect => {
  const boundingBox: Rect = curves[0].boundingBox as Rect

  for (const curve of curves.slice(1)) {
    if (curve.boundingBox.minX < boundingBox.minX) {
      boundingBox.minX = curve.boundingBox.minX
    }
    if (curve.boundingBox.maxX > boundingBox.maxX) {
      boundingBox.maxX = curve.boundingBox.maxX
    }
    if (curve.boundingBox.minY < boundingBox.minY) {
      boundingBox.minY = curve.boundingBox.minY
    }
    if (curve.boundingBox.maxY > boundingBox.maxY) {
      boundingBox.maxY = curve.boundingBox.maxY
    }
  }

  return boundingBox
}
