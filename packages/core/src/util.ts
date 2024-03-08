const precision = 12
const scale = 10 ** precision
export function round(value: number): number {
  return Math.round(value * scale) / scale
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
