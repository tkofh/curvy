import * as Bezier2d from 'curvy/splines/bezier2d'
import * as Vector2 from 'curvy/vector2'
import { describe, expect, test } from 'vitest'
import * as Path from '../src/path'

describe('path', () => {
  test('it renders a path from a bezier', () => {
    expect(
      Bezier2d.make(Vector2.zero, Vector2.make(1, 0), Vector2.make(1, 1), Vector2.make(0, 1)).pipe(
        Path.fromBezier2d,
        Path.render,
      ),
    ).toEqual('M 0,0 C 1,0 1,1 0,1')
  })
})
