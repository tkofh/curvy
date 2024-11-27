import { dual } from './internal/function'

export const PRECISION = 8

export function round(value: number, precision = PRECISION): number {
  const scale = 10 ** precision
  const result = Math.round(value * scale) / scale
  if (result === 0) {
    return 0
  }
  return result
}

export const remap: {
  (x: number, x1: number, x2: number, y1: number, y2: number): number
  (x1: number, x2: number, y1: number, y2: number): (x: number) => number
} = dual(
  5,
  (x: number, x1: number, x2: number, y1: number, y2: number): number => {
    return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1)
  },
)

export const clamp: {
  (value: number, min: number, max: number): number
  (min: number, max: number): (value: number) => number
} = dual(3, (value: number, min: number, max: number) => {
  return value < min ? min : value > max ? max : value
})

export const clip: {
  <T>(value: number, min: number, max: number, onClip: T): T | number
  <T>(min: number, max: number, onClip: T): (value: number) => T | number
} = dual(4, (value: number, min: number, max: number, onClip: unknown) => {
  return value < min ? onClip : value > max ? onClip : value
})

export function minMax(a: number, b: number): [number, number] {
  return a < b ? [a, b] : [b, a]
}

export function objectKeys<T extends object>(
  object: T,
): ReadonlyArray<keyof T> {
  return Object.keys(object) as Array<keyof T>
}

export function objectEntries<T extends object>(
  object: T,
): ReadonlyArray<[keyof T, T[keyof T]]> {
  return Object.entries(object) as Array<[keyof T, T[keyof T]]>
}

export function invariant(
  condition: boolean,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}
