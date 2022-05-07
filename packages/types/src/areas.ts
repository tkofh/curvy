export interface Rect {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface Range<T> {
  value: T
  start: number
  startInclusive: boolean
  end: number
  endInclusive: boolean
}
