const finePrecision = 12
const fineScale = 10 ** finePrecision
export function round(value: number): number {
  const result = Math.round(value * fineScale) / fineScale
  if (result === 0) {
    return 0
  }
  return result
}

const coarsePrecision = 8
const coarseScale = 10 ** coarsePrecision
export function coarseRound(value: number): number {
  const result = Math.round(value * coarseScale) / coarseScale
  if (result === 0) {
    return 0
  }
  return result
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
