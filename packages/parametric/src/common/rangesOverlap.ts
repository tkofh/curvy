export const rangesOverlap = (startA: number, endA: number, startB: number, endB: number) =>
  Math.min(startA, endA) <= Math.max(startB, endB) &&
  Math.min(startB, endB) <= Math.max(startA, endA)
