export interface Range {
  min: number
  max: number
}

export interface ValuedRange<T> extends Range {
  value: T
}

export interface DirectedRange {
  start: number
  end: number
}

export interface ValuedDirectedRange<T> extends DirectedRange {
  value: T
}

export interface Bounds {
  x: Range
  y: Range
}

export interface ValuedBounds<T> extends Bounds {
  value: T
}
