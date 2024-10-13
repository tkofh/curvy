import type { Curve } from 'curvy'

export function createHslGetter(
  spline: Curve<'shade' | 'hue' | 'saturation' | 'lightness'>,
) {
  return (shade: number, alpha: string | number = 1) => {
    const { hue, saturation, lightness } = spline.solveWhere('shade', shade, 0)
    return `hsl(${hue}, ${saturation}%, ${lightness}% / ${alpha})`
  }
}
