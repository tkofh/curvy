export interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface BoundedValue<T> extends Bounds {
  value: T
}
