export type ZeroOrOne<T = number> = T | null

export type ZeroToTwo<T = number> = readonly [] | readonly [T] | readonly [T, T]

export type ZeroToThree<T = number> =
  | readonly []
  | readonly [T]
  | readonly [T, T]
  | readonly [T, T, T]
