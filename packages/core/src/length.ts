// import type * as Interval from './interval'
//
// const GL9_W0 = 0.3302393550012598
// const GL9_W1 = 0.31234707704000253
// const GL9_W2 = 0.26061069640293544
// const GL9_W3 = 0.1806481606948574
// const GL9_W4 = 0.08127438836157441
//
// const GL9_X0 = 0
// const GL9_X1 = 0.3242534234038089
// const GL9_X2 = 0.6133714327005904
// const GL9_X3 = 0.8360311073266358
// const GL9_X4 = 0.9681602395076261
//
// // source: https://dlmf.nist.gov/3.5#T2
// const GL10_W0 = 0.066671344308688138
// const GL10_W1 = 0.14945134915058059
// const GL10_W2 = 0.21908636251598204
// const GL10_W3 = 0.2692667193099964
// const GL10_W4 = 0.29552422471475287
// const GL10_W5 = GL10_W4
// const GL10_W6 = GL10_W3
// const GL10_W7 = GL10_W2
// const GL10_W8 = GL10_W1
// const GL10_W9 = GL10_W0
//
// const GL10_X0 = -0.9739065285171717
// const GL10_X1 = -0.8650633666889845
// const GL10_X2 = -0.6794095682990244
// const GL10_X3 = -0.43339539412924721
// const GL10_X4 = -0.1488743389816312
// const GL10_X5 = -GL10_X4
// const GL10_X6 = -GL10_X3
// const GL10_X7 = -GL10_X2
// const GL10_X8 = -GL10_X1
// const GL10_X9 = -GL10_X0
//
// const GL20_W0 = 0.017614007139152118312
// const GL20_W1 = 0.040601429800386941331
// const GL20_W2 = 0.06267204833410906357
// const GL20_W3 = 0.083276741576704748725
// const GL20_W4 = 0.101930119817240435037
// const GL20_W5 = 0.118194531961518417312
// const GL20_W6 = 0.131688638449176626898
// const GL20_W7 = 0.142096109318382051329
// const GL20_W8 = 0.149172986472603746788
// const GL20_W9 = 0.152753387130725850698
//
// const GL20_X0 = 0.993128599185094924786
// const GL20_X1 = 0.963971927277913791268
// const GL20_X2 = 0.912234428251325905868
// const GL20_X3 = 0.839116971822218823395
// const GL20_X4 = 0.746331906460150792614
// const GL20_X5 = 0.636053680726515025453
// const GL20_X6 = 0.510867001950827098004
// const GL20_X7 = 0.373706088715419560673
// const GL20_X8 = 0.22778585114164507808
// const GL20_X9 = 0.076526521133497333755
//
// export const gaussLegendreLength = (
//   integrand: (t: number) => number,
//   interval: Interval.Interval,
//   p: '9' | '10' | '20' = '10',
// ) => {
//   const scale = (interval.end - interval.start) / 2
//   const shift = (interval.end + interval.start) / 2
//
//   if (p === '9') {
//     return (
//       (GL9_W0 * integrand(scale * GL9_X0 + shift) +
//         GL9_W1 * integrand(scale * GL9_X1 + shift) +
//         GL9_W1 * integrand(scale * -GL9_X1 + shift) +
//         GL9_W2 * integrand(scale * GL9_X2 + shift) +
//         GL9_W2 * integrand(scale * -GL9_X2 + shift) +
//         GL9_W3 * integrand(scale * GL9_X3 + shift) +
//         GL9_W3 * integrand(scale * -GL9_X3 + shift) +
//         GL9_W4 * integrand(scale * GL9_X4 + shift) +
//         GL9_W4 * integrand(scale * -GL9_X4 + shift)) *
//       scale
//     )
//   }
//
//   if (p === '10') {
//     return (
//       (GL10_W0 * integrand(scale * GL10_X0 + shift) +
//         GL10_W1 * integrand(scale * GL10_X1 + shift) +
//         GL10_W2 * integrand(scale * GL10_X2 + shift) +
//         GL10_W3 * integrand(scale * GL10_X3 + shift) +
//         GL10_W4 * integrand(scale * GL10_X4 + shift) +
//         GL10_W5 * integrand(scale * GL10_X5 + shift) +
//         GL10_W6 * integrand(scale * GL10_X6 + shift) +
//         GL10_W7 * integrand(scale * GL10_X7 + shift) +
//         GL10_W8 * integrand(scale * GL10_X8 + shift) +
//         GL10_W9 * integrand(scale * GL10_X9 + shift)) *
//       scale
//     )
//   }
//
//   return (
//     (GL20_W0 * integrand(scale * GL20_X0 + shift) +
//       GL20_W0 * integrand(scale * -GL20_X0 + shift) +
//       GL20_W1 * integrand(scale * GL20_X1 + shift) +
//       GL20_W1 * integrand(scale * -GL20_X1 + shift) +
//       GL20_W2 * integrand(scale * GL20_X2 + shift) +
//       GL20_W2 * integrand(scale * -GL20_X2 + shift) +
//       GL20_W3 * integrand(scale * GL20_X3 + shift) +
//       GL20_W3 * integrand(scale * -GL20_X3 + shift) +
//       GL20_W4 * integrand(scale * GL20_X4 + shift) +
//       GL20_W4 * integrand(scale * -GL20_X4 + shift) +
//       GL20_W5 * integrand(scale * GL20_X5 + shift) +
//       GL20_W5 * integrand(scale * -GL20_X5 + shift) +
//       GL20_W6 * integrand(scale * GL20_X6 + shift) +
//       GL20_W6 * integrand(scale * -GL20_X6 + shift) +
//       GL20_W7 * integrand(scale * GL20_X7 + shift) +
//       GL20_W7 * integrand(scale * -GL20_X7 + shift) +
//       GL20_W8 * integrand(scale * GL20_X8 + shift) +
//       GL20_W8 * integrand(scale * -GL20_X8 + shift) +
//       GL20_W9 * integrand(scale * GL20_X9 + shift) +
//       GL20_W9 * integrand(scale * -GL20_X9 + shift)) *
//     scale
//   )
// }
