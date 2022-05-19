import { Bounds, LUTEntry, Spline } from '@curvy/types'
import { distance, remap } from '@curvy/math'

export const remapSpline = (spline: Spline, source: Bounds, target: Bounds): Spline => {
  const lut = spline.meta.lut.reduce<LUTEntry[]>((lut, entry, index) => {
    const x = remap(entry.x, source.minX, source.maxX, target.minX, target.maxX)
    const y = remap(entry.y, source.minY, source.maxY, target.minY, target.maxY)

    lut.push({
      x,
      y,
      length: index === 0 ? 0 : distance(lut[index - 1].x, lut[index - 1].y, x, y),
      t: entry.t,
    })

    return lut
  }, [])

  const meta = {
    precisionX: spline.meta.precisionX,
    precisionY: spline.meta.precisionY,
    monotonicityX: spline.meta.monotonicityX,
    monotonicityY: spline.meta.monotonicityY,
    bounds: {
      minX: remap(
        spline.meta.bounds.minX,
        source.minX,
        source.maxX,
        target.minX,
        target.maxX,
        false
      ),
      minY: remap(
        spline.meta.bounds.minY,
        source.minY,
        source.maxY,
        target.minY,
        target.maxY,
        false
      ),
      maxX: remap(
        spline.meta.bounds.maxX,
        source.minX,
        source.maxX,
        target.minX,
        target.maxX,
        false
      ),
      maxY: remap(
        spline.meta.bounds.maxY,
        source.minY,
        source.maxY,
        target.minY,
        target.maxY,
        false
      ),
    },
    extrema: spline.meta.extrema.map((extrema) => ({
      x: remap(extrema.x, source.minX, source.maxX, target.minX, target.maxX, false),
      y: remap(extrema.y, source.minY, source.maxY, target.minX, target.maxX, false),
    })),
    lut,
    length: lut[lut.length - 1].length,
  }

  return {
    meta,
    solveX: (y: number, minX?: number, maxX?: number): number | undefined => {
      const result = spline.solveX(
        remap(y, target.minY, target.maxY, source.minY, source.maxY, false, meta.precisionY),
        minX === undefined
          ? minX
          : remap(minX, target.minX, target.maxX, source.minX, source.maxX, false, meta.precisionX),
        maxX === undefined
          ? maxX
          : remap(maxX, target.minX, target.maxX, source.minX, source.maxX, false, meta.precisionX)
      )
      return result === undefined
        ? result
        : remap(result, source.minX, source.maxX, target.minX, target.maxX, false, meta.precisionX)
    },
    solveY: (x: number, minY?: number, maxY?: number): number | undefined => {
      const result = spline.solveY(
        remap(x, target.minX, target.maxX, source.minX, source.maxX, false, meta.precisionX),
        minY === undefined
          ? minY
          : remap(minY, target.minY, target.maxY, source.minY, source.maxY, false, meta.precisionX),
        maxY === undefined
          ? maxY
          : remap(maxY, target.minY, target.maxY, source.minY, source.maxY, false, meta.precisionX)
      )

      return result === undefined
        ? result
        : remap(result, source.minY, source.maxY, target.minY, target.maxY, false, meta.precisionY)
    },
    solveLength: (length: number) => {
      const result = spline.solveLength(remap(length, 0, meta.length, 0, spline.meta.length))
      return result === undefined
        ? result
        : {
            x: remap(
              result.x,
              source.minX,
              source.maxX,
              target.minX,
              target.maxX,
              false,
              meta.precisionX
            ),
            y: remap(
              result.y,
              source.minY,
              source.maxY,
              target.minY,
              target.maxY,
              false,
              meta.precisionY
            ),
          }
    },
    solveT: (t: number) => {
      const result = spline.solveT(t)
      return result === undefined
        ? undefined
        : {
            x: remap(
              result.x,
              source.minX,
              source.maxX,
              target.minX,
              target.maxX,
              false,
              meta.precisionX
            ),
            y: remap(
              result.y,
              source.minY,
              source.maxY,
              target.minY,
              target.maxY,
              false,
              meta.precisionY
            ),
          }
    },
  }
}
