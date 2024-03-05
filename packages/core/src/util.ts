const precision = 12
const scale = 10 ** precision
export function round(value: number): number {
  return Math.round(value * scale) / scale
}
