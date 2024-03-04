export type CubicScalars = readonly [number, number, number, number]
export type QuadraticScalars = readonly [number, number, number]

export type Matrix4x4 = readonly [
  CubicScalars,
  CubicScalars,
  CubicScalars,
  CubicScalars,
]

export type Monotonicity = 'none' | 'increasing' | 'decreasing' | 'constant'

export type CurveSegment = {
  monotonicity: Monotonicity
  localExtrema: Map<number, number>
  points: CubicScalars
  polynomial: CubicScalars
  derivative: QuadraticScalars
  min: number
  max: number
  solve: (t: number) => number
}
