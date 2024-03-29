export function round(value: number, precision = 12): number {
  const scale = 10 ** precision
  const result = Math.round(value * scale) / scale
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
  return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1)
}
