import { describe, expect, test } from 'vitest'
import { Matrix4x4 } from '../src/matrix'
import { Vector4 } from '../src/vector'

describe('Matrix4x4', () => {
  test('solves', () => {
    // biome-ignore format: visual representation of the matrix
    const bezier = new Matrix4x4(
      1, 0, 0, 0,
      -3, 3, 0, 0,
      3, -6, 3, 0,
      -1, 3, -3, 1,
    )

    // biome-ignore format: visual representation of the matrix
    const catmullRom = new Matrix4x4(
      0, 1, 0, 0,
      -0.5, 0, 0.5, 0,
      1, -2.5, 2, -0.5,
      -0.5, 1.5, -1.5, 0.5,
    )

    // bezier input points
    const bezierPoints = new Vector4(0, 1, 0, 1)

    const coefficients = bezier.matrixVectorProduct(bezierPoints)

    expect(
      catmullRom.matrixVectorProduct(catmullRom.solveSystem(coefficients)),
    ).toEqual(coefficients)
  })
})
