/* c8 ignore start */
export type CubicScalars = readonly [number, number, number, number]
export type QuadraticScalars = readonly [number, number, number]

export type Matrix4x4 = readonly [
  CubicScalars,
  CubicScalars,
  CubicScalars,
  CubicScalars,
]

export type Monotonicity = 'none' | 'increasing' | 'decreasing' | 'constant'

export type Extrema = ReadonlyMap<number, number>

export type CurveSegment = {
  readonly monotonicity: Monotonicity
  readonly localExtrema: Extrema
  readonly points: CubicScalars
  readonly polynomial: CubicScalars
  readonly derivative: QuadraticScalars
  readonly min: number
  readonly max: number
  readonly solve: (t: number) => number
}

export type Curve = {
  readonly monotonicity: Monotonicity
  readonly extrema: Extrema
  readonly segments: ReadonlyArray<CurveSegment>
  readonly min: number
  readonly max: number
  readonly solve: (t: number) => number
}
/* c8 ignore end */
