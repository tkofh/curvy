import { Bounds, LUTEntry, Spline } from '@curvy/types'
import { distance, remap } from '@curvy/math'

export const remapSpline = (spline: Spline, source: Bounds, target: Bounds): Spline => {
  const lut = spline.meta.lut.reduce<LUTEntry[]>((lut, entry, index) => {
    const x = remap(entry.x, source.x.min, source.x.max, target.x.min, target.x.max)
    const y = remap(entry.y, source.y.min, source.y.max, target.y.min, target.y.max)

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
      x: {
        min: remap(
          spline.meta.bounds.x.min,
          source.x.min,
          source.x.max,
          target.x.min,
          target.x.max,
          false
        ),

        max: remap(
          spline.meta.bounds.x.max,
          source.x.min,
          source.x.max,
          target.x.min,
          target.x.max,
          false
        ),
      },
      y: {
        min: remap(
          spline.meta.bounds.y.min,
          source.y.min,
          source.y.max,
          target.y.min,
          target.y.max,
          false
        ),

        max: remap(
          spline.meta.bounds.y.max,
          source.y.min,
          source.y.max,
          target.y.min,
          target.y.max,
          false
        ),
      },
    },
    extrema: spline.meta.extrema.map((extrema) => ({
      x: remap(extrema.x, source.x.min, source.x.max, target.x.min, target.x.max, false),
      y: remap(extrema.y, source.y.min, source.y.max, target.y.min, target.y.max, false),
    })),
    lut,
    length: lut[lut.length - 1].length,
  }

  return {
    meta,
    solveX: (y: number, minX?: number, maxX?: number): number | undefined => {
      const result = spline.solveX(
        remap(y, target.y.min, target.y.max, source.y.min, source.y.max, false, meta.precisionY),
        minX === undefined
          ? minX
          : remap(
              minX,
              target.x.min,
              target.x.max,
              source.x.min,
              source.x.max,
              false,
              meta.precisionX
            ),
        maxX === undefined
          ? maxX
          : remap(
              maxX,
              target.x.min,
              target.x.max,
              source.x.min,
              source.x.max,
              false,
              meta.precisionX
            )
      )
      return result === undefined
        ? result
        : remap(
            result,
            source.x.min,
            source.x.max,
            target.x.min,
            target.x.max,
            false,
            meta.precisionX
          )
    },
    solveY: (x: number, minY?: number, maxY?: number): number | undefined => {
      const result = spline.solveY(
        remap(x, target.x.min, target.x.max, source.x.min, source.x.max, false, meta.precisionX),
        minY === undefined
          ? minY
          : remap(
              minY,
              target.y.min,
              target.y.max,
              source.y.min,
              source.y.max,
              false,
              meta.precisionX
            ),
        maxY === undefined
          ? maxY
          : remap(
              maxY,
              target.y.min,
              target.y.max,
              source.y.min,
              source.y.max,
              false,
              meta.precisionX
            )
      )

      return result === undefined
        ? result
        : remap(
            result,
            source.y.min,
            source.y.max,
            target.y.min,
            target.y.max,
            false,
            meta.precisionY
          )
    },
    solveLength: (length: number) => {
      const result = spline.solveLength(remap(length, 0, meta.length, 0, spline.meta.length))
      return result === undefined
        ? result
        : {
            x: remap(
              result.x,
              source.x.min,
              source.x.max,
              target.x.min,
              target.x.max,
              false,
              meta.precisionX
            ),
            y: remap(
              result.y,
              source.y.min,
              source.y.max,
              target.y.min,
              target.y.max,
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
              source.x.min,
              source.x.max,
              target.x.min,
              target.x.max,
              false,
              meta.precisionX
            ),
            y: remap(
              result.y,
              source.y.min,
              source.y.max,
              target.y.min,
              target.y.max,
              false,
              meta.precisionY
            ),
          }
    },
  }
}
