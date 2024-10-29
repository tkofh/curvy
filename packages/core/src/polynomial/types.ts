export type ZeroOrOneSolution = number | null

export type ZeroToTwoSolutions =
  | readonly []
  | readonly [number]
  | readonly [number, number]

export type ZeroToThreeSolutions =
  | readonly []
  | readonly [number]
  | readonly [number, number]
  | readonly [number, number, number]
