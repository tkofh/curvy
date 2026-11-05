import { describe, expect, test } from 'vitest'
import * as Interval from '../src/interval/interval.ts'
import { pipe } from '../src/utils/function.ts'
import { Value } from '../src/utils/value.ts'
import * as Vector2 from '../src/vector/vector2.ts'

class Point extends Value('~geometry/Point') {
  readonly x: number
  readonly y: number

  constructor(x: number, y: number) {
    super()
    this.x = x
    this.y = y
  }

  override toString() {
    return `Point(${this.x}, ${this.y})`
  }
}

class Space extends Value('~geometry/Shape/Space') {
  override toString() {
    return 'Space'
  }
}

const isPoint = (u: unknown): u is Point =>
  typeof u === 'object' && u !== null && '~geometry/Point' in u

// The hook Node's `util.inspect` calls. The package has no Node types, so
// the test calls the hook rather than `inspect` itself.
const inspect = (v: object): unknown =>
  (v as Record<symbol, () => unknown>)[Symbol.for('nodejs.util.inspect.custom')]?.()

describe('Value', () => {
  test('prints through toString in inspect, String, and template literals', () => {
    const p = new Point(1, 2)
    expect(inspect(p)).toBe('Point(1, 2)')
    expect(String(p)).toBe('Point(1, 2)')
    expect(`${p}`).toBe('Point(1, 2)')
  })

  test('tags with the id after its package segment, dots for slashes', () => {
    expect(Object.prototype.toString.call(new Point(1, 2))).toBe('[object Point]')
    expect(Object.prototype.toString.call(new Space())).toBe('[object Shape.Space]')
    expect(Object.prototype.toString.call(Vector2.make(0, 0))).toBe('[object Vector2]')
  })

  test('keeps the id off instances', () => {
    const p = new Point(1, 2)
    expect(Object.keys(p)).toEqual(['x', 'y'])
    expect(Object.getOwnPropertySymbols(p)).toEqual([])
    expect(JSON.stringify(p)).toBe('{"x":1,"y":2}')
    expect({ ...p }).toEqual({ x: 1, y: 2 })
    expect(p['~geometry/Point']).toBe('~geometry/Point')
  })

  test('pipes', () => {
    expect(new Point(1, 2).pipe(String)).toBe('Point(1, 2)')
    expect(pipe(new Point(3, 4), (p) => p.x + p.y)).toBe(7)
  })
})

describe('id guards', () => {
  test('accept values carrying the id', () => {
    expect(isPoint(new Point(1, 2))).toBe(true)
  })

  test('reject other values and non-objects', () => {
    expect(isPoint(new Space())).toBe(false)
    expect(isPoint(Vector2.make(1, 2))).toBe(false)
    expect(isPoint({ x: 1, y: 2 })).toBe(false)
    expect(isPoint(null)).toBe(false)
    expect(isPoint('~geometry/Point')).toBe(false)
  })

  test('accept every member of a family that shares one id', () => {
    expect(Interval.isInterval(Interval.make(0, 1))).toBe(true)
    expect(Interval.isInterval(Interval.makeOpenStart(0, 1))).toBe(true)
    expect(Interval.isInterval(Vector2.make(0, 1))).toBe(false)
  })
})
