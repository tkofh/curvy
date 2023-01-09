export type BaseAxes = 'x' | 'y' | 'z' | 'w' | (string & Record<never, never>)

export type Point<TAxis extends BaseAxes> = Record<TAxis, number>

export type ReadonlyPoint<TAxis extends BaseAxes> = Readonly<Record<TAxis, number>>

export type CubicPoints<TAxis extends BaseAxes> = [
  Point<TAxis>,
  Point<TAxis>,
  Point<TAxis>,
  Point<TAxis>
]
export type QuadraticPoints<TAxis extends BaseAxes> = [Point<TAxis>, Point<TAxis>, Point<TAxis>]

export type ReadonlyCubicPoints<TAxis extends BaseAxes> = readonly [
  ReadonlyPoint<TAxis>,
  ReadonlyPoint<TAxis>,
  ReadonlyPoint<TAxis>,
  ReadonlyPoint<TAxis>
]
export type ReadonlyQuadraticPoints<TAxis extends BaseAxes> = readonly [
  ReadonlyPoint<TAxis>,
  ReadonlyPoint<TAxis>,
  ReadonlyPoint<TAxis>
]
