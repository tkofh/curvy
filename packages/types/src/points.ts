export type Point = [number, number]
export type ReadonlyPoint = Readonly<[number, number]>

export type Points = Array<Point>
export type ReadonlyPoints = ReadonlyArray<ReadonlyPoint>

export type CubicPoints = [Point, Point, Point, Point]
export type ReadonlyCubicPoints = Readonly<
  [ReadonlyPoint, ReadonlyPoint, ReadonlyPoint, ReadonlyPoint]
>
