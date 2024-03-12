import invariant from 'tiny-invariant'

export type Monotonicity = 'none' | 'increasing' | 'decreasing' | 'constant'

export type Interval = readonly [number, number]

export const UNIT_INTERVAL: Interval = [0, 1]

export type LinearCoefficients = readonly [number, number]
export type LinearPolynomial = {
  readonly domain: Interval
  readonly range: Interval
  readonly monotonicity: Monotonicity
  readonly coefficients: LinearCoefficients
  readonly root: number | null
  readonly solve: (x: number) => number
  readonly solveInverse: (y: number) => number
}

export function createLinearPolynomial(
  coefficients: LinearCoefficients,
  domain: Interval = UNIT_INTERVAL,
): LinearPolynomial {
  const [a, b] = coefficients

  invariant(domain[0] <= domain[1], 'invalid domain')

  let root = a === 0 ? null : b === 0 ? 0 : -b / a
  if (root !== null && (root < domain[0] || root > domain[1])) {
    root = null
  }

  const range: Interval =
    a >= 0
      ? [a * domain[0] + b, a * domain[1] + b]
      : [a * domain[1] + b, a * domain[0] + b]

  const solve = (x: number) => {
    invariant(x >= domain[0] && x <= domain[1], 'x out of domain')
    return a * x + b
  }

  const solveInverse = (y: number) => {
    invariant(y >= range[0] && y <= range[1], 'y out of range')
    return a === 0 ? 0 : (y - b) / a
  }

  return {
    domain,
    range,
    monotonicity: a === 0 ? 'constant' : a > 0 ? 'increasing' : 'decreasing',
    coefficients,
    root,
    solve,
    solveInverse,
  }
}

export type QuadraticCoefficients = readonly [number, number, number]
export type QuadraticPolynomial = {
  readonly domain: Interval
  readonly range: Interval
  readonly monotonicity: Monotonicity
  readonly coefficients: QuadraticCoefficients
  readonly extreme: number | null
  readonly roots: ReadonlyArray<number>
  readonly derivative: LinearPolynomial
  readonly solve: (x: number) => number
  readonly solveInverse: (y: number, domain?: Interval) => ReadonlyArray<number>
}

function createQuadraticRootSolver(
  coefficients: QuadraticCoefficients,
  defaultDomain: Interval,
  range: Interval,
): (y: number, domain?: Interval) => ReadonlyArray<number> {
  const [a, b, c] = coefficients

  if (a !== 0) {
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: favoring efficiency over complexity
    return function solveInverse(y, domain = defaultDomain) {
      invariant(domain[0] <= domain[1], 'invalid domain')
      invariant(y >= range[0] && y <= range[1], 'y out of range')

      const discriminant = b ** 2 - 4 * a * (c - y)

      if (discriminant < 0) {
        return []
      }

      if (discriminant === 0) {
        const root = -b / (2 * a)
        return root < domain[0] || root > domain[1] ? [] : [root]
      }

      const sqrtDiscriminant = Math.sqrt(discriminant)
      const denominator = 2 * a

      const left = (-b - sqrtDiscriminant) / denominator
      const right = (-b + sqrtDiscriminant) / denominator

      const leftInDomain = left >= domain[0] && left <= domain[1]
      const rightInDomain = right >= domain[0] && right <= domain[1]

      if (leftInDomain && rightInDomain) {
        return left < right ? [left, right] : [right, left]
      }
      if (leftInDomain) {
        return [left]
      }
      if (rightInDomain) {
        return [right]
      }
      return []
    }
  }
  if (b !== 0) {
    return function solveInverse(y, domain = defaultDomain) {
      invariant(domain[0] <= domain[1], 'invalid domain')
      invariant(y >= range[0] && y <= range[1], 'y out of range')

      const root = -(c - y) / b

      return root < domain[0] || root > domain[1] ? [] : [root]
    }
  }
  return function solveInverse() {
    return []
  }
}

export function createQuadraticPolynomial(
  coefficients: QuadraticCoefficients,
  domain: Interval = UNIT_INTERVAL,
): QuadraticPolynomial {
  const [a, b, c] = coefficients

  invariant(domain[0] <= domain[1], 'invalid domain')

  const derivative = createLinearPolynomial([2 * a, b], domain)
  const extreme = derivative.root

  const solve = (x: number) => {
    invariant(x >= domain[0] && x <= domain[1], 'x out of domain')
    return a * x ** 2 + b * x + c
  }

  const rangeCandidates =
    extreme === null
      ? [solve(domain[0]), solve(domain[1])]
      : [solve(domain[0]), solve(extreme), solve(domain[1])]
  const range: Interval = [
    Math.min(...rangeCandidates),
    Math.max(...rangeCandidates),
  ]

  const solveInverse = createQuadraticRootSolver(coefficients, domain, range)
  const roots = range[0] > 0 || range[1] < 0 ? [] : solveInverse(0)

  return {
    domain,
    range,
    coefficients,
    monotonicity:
      a !== 0
        ? 'none'
        : b === 0
          ? 'constant'
          : b > 0
            ? 'increasing'
            : 'decreasing',
    extreme,
    roots,
    derivative,
    solve,
    solveInverse,
  }
}
export type CubicCoefficients = readonly [number, number, number, number]
export type CubicPolynomial = {
  readonly domain: Interval
  readonly range: Interval
  readonly monotonicity: Monotonicity
  readonly coefficients: CubicCoefficients
  readonly extrema: ReadonlyArray<number>
  readonly roots: ReadonlyArray<number>
  readonly derivative: QuadraticPolynomial
  readonly solve: (x: number) => number
  readonly solveInverse: (y: number, domain?: Interval) => ReadonlyArray<number>
}

const TWO_THIRDS_PI = (2 * Math.PI) / 3

function createCubicRootSolver(
  coefficients: CubicCoefficients,
  defaultDomain: Interval,
  range: Interval,
): (y: number, domain?: Interval) => ReadonlyArray<number> {
  if (coefficients[0] === 0) {
    return createQuadraticRootSolver(
      [coefficients[1], coefficients[2], coefficients[3]],
      defaultDomain,
      range,
    )
  }

  const oneOverA = 1 / coefficients[0]

  const a0 = coefficients[1] * oneOverA
  const a1 = coefficients[2] * oneOverA

  const a2OverThree = a0 / 3

  const q = a1 / 3 - a0 ** 2 / 9
  const r0 = (a1 * a0) / 6 - a0 ** 3 / 27

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: favoring efficiency over complexity
  return function solveInverse(y, domain = defaultDomain) {
    invariant(domain[0] <= domain[1], 'invalid domain')
    invariant(y >= range[0] && y <= range[1], 'y out of range')

    const a0 = (coefficients[3] - y) * oneOverA

    const r = r0 - a0 * 0.5

    const discriminant = q ** 3 + r ** 2

    if (discriminant > 0) {
      const a = Math.cbrt(Math.abs(r) + Math.sqrt(discriminant))

      /* c8 ignore next */
      const root = (r < 0 ? q / a - a : a - q / a) - a2OverThree
      return root < domain[0] || root > domain[1] ? [] : [root]
    }
    const theta = Math.acos(r / Math.sqrt((-q) ** 3)) / 3
    const twoRootQ = 2 * Math.sqrt(-q)

    const root1 = twoRootQ * Math.cos(theta - TWO_THIRDS_PI) - a2OverThree
    const root2 = twoRootQ * Math.cos(theta) - a2OverThree
    const root3 = twoRootQ * Math.cos(theta + TWO_THIRDS_PI) - a2OverThree

    const candidates = [root1, root2, root3]
    const roots: Array<number> = []

    for (const candidate of candidates) {
      if (
        candidate >= domain[0] &&
        candidate <= domain[1] &&
        !roots.includes(candidate)
      ) {
        roots.push(candidate)
      }
    }

    roots.sort((a, b) => a - b)

    return roots
  }
}

function getMonotonicity(
  extrema: ReadonlyArray<number>,
  derivative: QuadraticPolynomial,
  domain: Interval,
): Monotonicity {
  if (
    derivative.coefficients[0] === 0 &&
    derivative.coefficients[1] === 0 &&
    derivative.coefficients[2] === 0
  ) {
    return 'constant'
  }

  let hasInnerExtrema = false
  for (const extreme of extrema) {
    if (extreme > domain[0] && extreme > domain[1]) {
      hasInnerExtrema = true
      break
    }
  }

  if (hasInnerExtrema) {
    return 'none'
  }

  let test = derivative.solve(domain[0])
  if (test === 0) {
    test = derivative.solve((domain[0] + domain[1]) * 0.5)
  }

  return Math.sign(test) > 0 ? 'increasing' : 'decreasing'
}

export function createCubicPolynomial(
  coefficients: CubicCoefficients,
  domain: Interval = UNIT_INTERVAL,
): CubicPolynomial {
  invariant(domain[0] <= domain[1], 'invalid domain')

  const [a, b, c, d] = coefficients

  const derivative = createQuadraticPolynomial([3 * a, 2 * b, c], domain)

  // a single root for the derivative means an inflection point
  const extrema =
    derivative.roots.length === 1 && derivative.coefficients[0] !== 0
      ? []
      : derivative.roots

  const solve = (x: number) => {
    invariant(x >= domain[0] && x <= domain[1], 'x out of domain')
    return a * x ** 3 + b * x ** 2 + c * x + d
  }

  const rangeCandidates = [
    solve(domain[0]),
    ...extrema.map((extreme) => solve(extreme)),
    solve(domain[1]),
  ]
  const range: Interval = [
    Math.min(...rangeCandidates),
    Math.max(...rangeCandidates),
  ]

  const solveInverse = createCubicRootSolver(coefficients, domain, range)
  const roots = range[0] > 0 || range[1] < 0 ? [] : solveInverse(0, domain)

  const monotonicity = getMonotonicity(extrema, derivative, domain)

  return {
    domain,
    range,
    monotonicity,
    coefficients,
    extrema,
    roots,
    derivative,
    solve,
    solveInverse,
  }
}

export function computeLinearAntiderivative(
  coefficients: LinearCoefficients,
  integrationConstant: number,
): QuadraticCoefficients {
  return [coefficients[0] / 2, coefficients[1], integrationConstant]
}

export function computeQuadraticAntiderivative(
  coefficients: QuadraticCoefficients,
  integrationConstant: number,
): CubicCoefficients {
  return [
    coefficients[0] / 3,
    coefficients[1] / 2,
    coefficients[2],
    integrationConstant,
  ]
}

export function computeCubicAntiderivative(
  coefficients: CubicCoefficients,
  integrationConstant: number,
): Readonly<[number, number, number, number, number]> {
  return [
    coefficients[0] / 4,
    coefficients[1] / 3,
    coefficients[2] / 2,
    coefficients[3],
    integrationConstant,
  ]
}
