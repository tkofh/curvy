// import { Bounds, Spline } from '@curvy/types'
// import { remap } from '@curvy/math'
//
// export const mapSpline = (spline: Spline, source: Bounds, target: Bounds): Spline => ({
//   meta: {
//     precisionX: spline.meta.precisionX,
//     precisionY: spline.meta.precisionY,
//     monotonicityX: spline.meta.monotonicityX,
//     monotonicityY: spline.meta.monotonicityY,
//     bounds: {
//       minX: remap(
//         spline.meta.bounds.minX,
//         source.minX,
//         source.maxX,
//         target.minX,
//         target.maxX,
//         false
//       ),
//       minY: remap(
//         spline.meta.bounds.minY,
//         source.minY,
//         source.maxY,
//         target.minY,
//         target.maxY,
//         false
//       ),
//       maxX: remap(
//         spline.meta.bounds.maxX,
//         source.minX,
//         source.maxX,
//         target.minX,
//         target.maxX,
//         false
//       ),
//       maxY: remap(
//         spline.meta.bounds.maxY,
//         source.minY,
//         source.maxY,
//         target.minY,
//         target.maxY,
//         false
//       ),
//     },
//     extrema: spline.meta.extrema.map((extrema) => ({
//       x: remap(extrema.x, source.minX, source.maxX, target.minX, target.maxX, false),
//       y: remap(extrema.y, source.minY, source.maxY, target.minX, target.maxX, false),
//     })),
//   },
// })
