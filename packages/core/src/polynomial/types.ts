import type { Interval } from '../interval'

export type ZeroOrOneSolution = number | null

export type ZeroOrOneInterval = Interval | null

export type ZeroToTwoSolutions =
  | readonly []
  | readonly [number]
  | readonly [number, number]

export type ZeroToTwoIntervals =
  | readonly []
  | readonly [Interval]
  | readonly [Interval, Interval]

export type ZeroToThreeSolutions =
  | readonly []
  | readonly [number]
  | readonly [number, number]
  | readonly [number, number, number]

export type ZeroToThreeIntervals =
  | readonly []
  | readonly [Interval]
  | readonly [Interval, Interval]
  | readonly [Interval, Interval, Interval]
