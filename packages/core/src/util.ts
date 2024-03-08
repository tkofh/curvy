const finePrecision = 12
const fineScale = 10 ** finePrecision
export function round(value: number): number {
  return Math.round(value * fineScale) / fineScale
}

const coarsePrecision = 8
const coarseScale = 10 ** coarsePrecision
export function coarseRound(value: number): number {
  return Math.round(value * coarseScale) / coarseScale
}

export function remap(
  x: number,
  x1: number,
  x2: number,
  y1: number,
  y2: number,
): number {
  return round(y1 + ((x - x1) / (x2 - x1)) * (y2 - y1))
}
