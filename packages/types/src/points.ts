export type BaseAxes = 'x' | 'y' | 'z' | 'w' | (string & Record<never, never>)

export type Point<Axis extends BaseAxes> = Record<Axis, number>

export type ReadonlyPoint<Axis extends BaseAxes> = Readonly<
  Record<Axis, number>
>

export type CubicPoints<Axis extends BaseAxes> = [
  Point<Axis>,
  Point<Axis>,
  Point<Axis>,
  Point<Axis>,
]
export type QuadraticPoints<Axis extends BaseAxes> = [
  Point<Axis>,
  Point<Axis>,
  Point<Axis>,
]

export type ReadonlyCubicPoints<Axis extends BaseAxes> = readonly [
  ReadonlyPoint<Axis>,
  ReadonlyPoint<Axis>,
  ReadonlyPoint<Axis>,
  ReadonlyPoint<Axis>,
]
export type ReadonlyQuadraticPoints<Axis extends BaseAxes> = readonly [
  ReadonlyPoint<Axis>,
  ReadonlyPoint<Axis>,
  ReadonlyPoint<Axis>,
]
