export const createCubicBezierSolver =
  (p0: number, p1: number, p2: number, p3: number) =>
  (t: number): number =>
    p0 * (-(t * t * t) + 3 * t * t - 3 * t + 1) +
    p1 * (3 * t * t * t - 6 * t * t + 3 * t) +
    p2 * (-3 * t * t * t + 3 * t * t) +
    p3 * t * t * t
