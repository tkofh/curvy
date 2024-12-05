import { describe, expect, test } from 'vitest'
import * as CubicPath2d from '../src/path/cubic2d'
import * as CubicBezier2d from '../src/splines/bezier2d'
import * as Vector2 from '../src/vector/vector2'

describe('bezier', () => {
  test('makes a path', () => {
    const path = CubicBezier2d.make(
      Vector2.make(0, 0),
      Vector2.make(0, 1),
      Vector2.make(1, 0),
      Vector2.make(1, 1),
    ).pipe(
      CubicBezier2d.append(
        Vector2.make(1, 2),
        Vector2.make(2, 1),
        Vector2.make(2, 2),
      ),
      CubicBezier2d.toPath,
    )

    expect(CubicPath2d.solve(path, 0)).toMatchObject(Vector2.make(0, 0))
    expect(CubicPath2d.solve(path, 0.5)).toMatchObject(Vector2.make(1, 1))
    expect(CubicPath2d.solve(path, 1)).toMatchObject(Vector2.make(2, 2))

    // for (let i = 0; i <= 100; i++) {
    //   const t = i / 100
    //   console.log(CubicPath2d.solve(path, t).toString())
    // }
  })
})
