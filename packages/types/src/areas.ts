export interface Rect {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export type ReadonlyRect = Readonly<Rect>

export interface Range<T> {
  value: T
  start: number
  startInclusive: boolean
  end: number
  endInclusive: boolean
}

export type ReadonlyRange<T> = Readonly<Range<T>>
