export const GL32_X0 = 0.9972638618494816
export const GL32_X1 = 0.9856115115452684
export const GL32_X2 = 0.9647622555875064
export const GL32_X3 = 0.9349060759377397
export const GL32_X4 = 0.8963211557660521
export const GL32_X5 = 0.84936761373257
export const GL32_X6 = 0.7944837959679424
export const GL32_X7 = 0.7321821187402897
export const GL32_X8 = 0.6630442669302152
export const GL32_X9 = 0.5877157572407623
export const GL32_X10 = 0.5068999089322294
export const GL32_X11 = 0.42135127613063533
export const GL32_X12 = 0.33186860228212767
export const GL32_X13 = 0.23928736225213706
export const GL32_X14 = 0.1444719615827965
export const GL32_X15 = 0.04830766568773831
export const GL32_W0 = 0.007018610009470136
export const GL32_W1 = 0.01627439473090571
export const GL32_W2 = 0.02539206530926214
export const GL32_W3 = 0.03427386291302141
export const GL32_W4 = 0.042835898022226704
export const GL32_W5 = 0.050998059262376154
export const GL32_W6 = 0.05868409347853558
export const GL32_W7 = 0.06582222277636195
export const GL32_W8 = 0.07234579410884862
export const GL32_W9 = 0.07819389578707044
export const GL32_W10 = 0.08331192422694672
export const GL32_W11 = 0.08765209300440374
export const GL32_W12 = 0.0911738786957639
export const GL32_W13 = 0.09384439908080454
export const GL32_W14 = 0.09563872007927485
export const GL32_W15 = 0.09654008851472785

// The nodes in [0, 1] and their weights, in the order above. Each node `x`
// stands for the pair `-x` and `x` in [-1, 1], which share its weight.
const GL32_NODES: ReadonlyArray<number> = [
  GL32_X0,
  GL32_X1,
  GL32_X2,
  GL32_X3,
  GL32_X4,
  GL32_X5,
  GL32_X6,
  GL32_X7,
  GL32_X8,
  GL32_X9,
  GL32_X10,
  GL32_X11,
  GL32_X12,
  GL32_X13,
  GL32_X14,
  GL32_X15,
]

const GL32_WEIGHTS: ReadonlyArray<number> = [
  GL32_W0,
  GL32_W1,
  GL32_W2,
  GL32_W3,
  GL32_W4,
  GL32_W5,
  GL32_W6,
  GL32_W7,
  GL32_W8,
  GL32_W9,
  GL32_W10,
  GL32_W11,
  GL32_W12,
  GL32_W13,
  GL32_W14,
  GL32_W15,
]

/**
 * The 32-point Gauss-Legendre estimate of the integral of `f` over the
 * interval that `t = shift + scale * u` maps `u in [-1, 1]` onto.
 *
 * The terms add left to right, `-x` before `x` for each node, so the sum
 * rounds the same as writing the 32 terms out in that order.
 *
 * @internal
 */
export const gl32 = (scale: number, shift: number, f: (t: number) => number): number => {
  let sum = 0
  for (let k = 0; k < 16; k++) {
    const x = GL32_NODES[k]!
    const w = GL32_WEIGHTS[k]!
    sum += w * f(shift + scale * -x)
    sum += w * f(shift + scale * x)
  }
  return sum * scale
}
