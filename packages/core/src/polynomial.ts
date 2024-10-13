import { PRECISION, minMax, round } from './util'

class LinearSolver {
  constructor(
    readonly c0: number,
    readonly c1: number,
    readonly precision = PRECISION,
  ) {}

  solve(x: number): number {
    return round(this.c0 + x * this.c1, this.precision)
  }
}

class InverseLinearSolver {
  constructor(
    readonly c0: number,
    readonly c1: number,
    readonly precision = PRECISION,
  ) {}

  solve(y: number): number {
    return round(this.c1 === 0 ? 0 : (y - this.c0) / this.c1, this.precision)
  }
}

class LinearPolynomial {
  private _root: number | null | undefined

  constructor(
    readonly c0: number,
    readonly c1: number,
    readonly precision = PRECISION,
  ) {}

  private _monotonicity: Monotonicity | undefined

  get monotonicity(): Monotonicity {
    this._monotonicity ||=
      this.c1 === 0 ? 'constant' : this.c1 > 0 ? 'increasing' : 'decreasing'

    return this._monotonicity
  }

  private _solver: LinearSolver | undefined

  private get solver(): LinearSolver {
    this._solver ||= new LinearSolver(this.c0, this.c1, this.precision)
    return this._solver
  }

  private _inverseSolver: InverseLinearSolver | undefined

  private get inverseSolver(): InverseLinearSolver {
    this._inverseSolver ||= new InverseLinearSolver(
      this.c0,
      this.c1,
      this.precision,
    )
    return this._inverseSolver
  }

  root(
    start: number = Number.NEGATIVE_INFINITY,
    end: number = Number.POSITIVE_INFINITY,
  ): number | null {
    this._root ||=
      this.c1 === 0 ? null : round(-this.c0 / this.c1, this.precision)

    if (this._root === null) {
      return null
    }

    const [min, max] = minMax(start, end)

    return this._root >= min && this._root <= max ? this._root : null
  }

  antiderivative(
    integrationConstant: number,
  ): readonly [number, number, number] {
    return [integrationConstant, this.c0, this.c1 / 2]
  }

  solve(x: number): number
  solve(x: number, rangeStart?: number, rangeEnd?: number): number | null
  solve(
    x: number,
    rangeStart = Number.NEGATIVE_INFINITY,
    rangeEnd = Number.POSITIVE_INFINITY,
  ): number | null {
    const solution = this.solver.solve(x)
    const [min, max] = minMax(rangeStart, rangeEnd)
    return solution >= min && solution <= max ? solution : null
  }

  solveInverse(y: number): number
  solveInverse(y: number, rangeStart?: number, rangeEnd?: number): number | null
  solveInverse(
    y: number,
    rangeStart = Number.NEGATIVE_INFINITY,
    rangeEnd = Number.POSITIVE_INFINITY,
  ): number | null {
    const solution = this.inverseSolver.solve(y)
    const [min, max] = minMax(rangeStart, rangeEnd)
    return solution >= min && solution <= max ? solution : null
  }
}

class QuadraticSolver {
  constructor(
    readonly c0: number,
    readonly c1: number,
    readonly c2: number,
    readonly precision = PRECISION,
  ) {}

  solve(x: number): number {
    return round(this.c0 + x * this.c1 + x ** 2 * this.c2, this.precision)
  }
}

class QuadraticInverseSolver {
  private readonly root: number

  constructor(
    readonly c0: number,
    readonly c1: number,
    readonly c2: number,
    readonly precision = PRECISION,
  ) {
    this.root = round(-this.c1 / (2 * this.c2), this.precision)
  }

  solve(
    y: number,
  ): readonly [] | readonly [number] | readonly [number, number] {
    const discriminant = this.c1 ** 2 - 4 * this.c2 * (this.c0 - y)

    if (discriminant < 0) {
      return []
    }

    if (discriminant === 0) {
      return [this.root]
    }

    const sqrtDiscriminant = Math.sqrt(discriminant)

    return [
      round((-this.c1 + sqrtDiscriminant) / (2 * this.c2), this.precision),
      round((-this.c1 - sqrtDiscriminant) / (2 * this.c2), this.precision),
    ].toSorted((a, b) => a - b) as [number, number]
  }
}

class QuadraticPolynomial {
  private _roots:
    | readonly []
    | readonly [number]
    | readonly [number, number]
    | undefined
  private _extrema: number | null | undefined

  constructor(
    readonly c0: number,
    readonly c1: number,
    readonly c2: number,
    readonly precision = PRECISION,
  ) {}

  private _derivative: LinearPolynomial | undefined

  get derivative(): LinearPolynomial {
    this._derivative ||= new LinearPolynomial(
      this.c1,
      2 * this.c2,
      this.precision,
    )
    return this._derivative
  }

  private _solver: QuadraticSolver | undefined

  private get solver(): QuadraticSolver {
    this._solver ||= new QuadraticSolver(
      this.c0,
      this.c1,
      this.c2,
      this.precision,
    )
    return this._solver
  }

  private _inverseSolver: QuadraticInverseSolver | undefined

  private get inverseSolver(): QuadraticInverseSolver {
    this._inverseSolver ||= new QuadraticInverseSolver(
      this.c0,
      this.c1,
      this.c2,
      this.precision,
    )
    return this._inverseSolver
  }

  roots(
    start: number = Number.NEGATIVE_INFINITY,
    end: number = Number.POSITIVE_INFINITY,
  ): readonly [] | readonly [number] | readonly [number, number] {
    this._roots ||= this.solveInverse(0)

    const result: Array<number> = []

    const [min, max] = minMax(start, end)

    if (this._roots.length > 1) {
      const first = this._roots[0] as number
      const second = this._roots[1] as number

      if (first >= min && first <= max) {
        result.push(first)
      }

      if (second >= min && second <= max) {
        result.push(second)
      }
    } else if (this._roots.length > 0) {
      const root = this._roots[0] as number

      if (root >= min && root <= max) {
        result.push(root)
      }
    }

    return result as never
  }

  extrema(
    start: number = Number.NEGATIVE_INFINITY,
    end: number = Number.POSITIVE_INFINITY,
  ): number | null {
    this._extrema ||= this.derivative.root() ?? (this.c2 === 0 ? null : 0)

    if (this._extrema === null) {
      return null
    }

    const [min, max] = minMax(start, end)

    return this._extrema >= min && this._extrema <= max ? this._extrema : null
  }

  monotonicity(
    start: number = Number.NEGATIVE_INFINITY,
    end: number = Number.POSITIVE_INFINITY,
  ): Monotonicity {
    if (this.c1 === 0 && this.c2 === 0) {
      return 'constant'
    }

    const [min, max] = minMax(start, end)

    const root = this.derivative.root(min, max)

    if (root === null || root === min || root === max) {
      const sign =
        root === min
          ? Math.sign(this.derivative.solve(max))
          : Math.sign(this.derivative.solve(min))

      if (sign === 0) {
        return 'constant'
      }
      return sign > 0 ? 'increasing' : 'decreasing'
    }

    return 'none'
  }

  antiderivative(
    integrationConstant: number,
  ): readonly [number, number, number, number] {
    return [integrationConstant, this.c0, this.c1 / 2, this.c2 / 3]
  }

  solve(x: number): number
  solve(x: number, rangeStart?: number, rangeEnd?: number): number | null
  solve(
    x: number,
    rangeStart = Number.NEGATIVE_INFINITY,
    rangeEnd = Number.POSITIVE_INFINITY,
  ): number | null {
    const solution = this.solver.solve(x)
    const [min, max] = minMax(rangeStart, rangeEnd)
    return solution >= min && solution <= max ? solution : null
  }

  solveInverse(
    y: number,
    rangeStart = Number.NEGATIVE_INFINITY,
    rangeEnd = Number.POSITIVE_INFINITY,
  ): readonly [] | readonly [number] | readonly [number, number] {
    const raw = this.inverseSolver.solve(y)
    const solution: Array<number> = []

    if (raw.length > 0) {
      const [min, max] = minMax(rangeStart, rangeEnd)

      const first = raw[0] as number
      if (first >= min && first <= max) {
        solution.push(first)
      }

      if (raw.length > 1) {
        const second = raw[1] as number
        if (second >= min && second <= max) {
          solution.push(second)
        }
      }
    }

    return solution as never
  }
}

class CubicSolver {
  constructor(
    readonly c0: number,
    readonly c1: number,
    readonly c2: number,
    readonly c3: number,
    readonly precision = PRECISION,
  ) {}

  solve(x: number): number {
    return round(
      this.c0 + x * this.c1 + x ** 2 * this.c2 + x ** 3 * this.c3,
      this.precision,
    )
  }
}

const TWO_THIRDS_PI = (2 * Math.PI) / 3

class CubicInverseSolver {
  readonly invC3: number
  readonly a0: number
  readonly a1: number

  readonly a2OverThree: number

  readonly q: number
  readonly r0: number

  constructor(
    readonly c0: number,
    readonly c1: number,
    readonly c2: number,
    readonly c3: number,
    readonly precision = PRECISION,
  ) {
    this.invC3 = 1 / c3

    this.a0 = c2 * this.invC3
    this.a1 = c1 * this.invC3

    this.a2OverThree = this.a0 / 3

    this.q = this.a1 / 3 - this.a0 ** 2 / 9
    this.r0 = (this.a1 * this.a0) / 6 - this.a0 ** 3 / 27
  }

  solve(
    y: number,
  ):
    | readonly []
    | readonly [number]
    | readonly [number, number]
    | readonly [number, number, number] {
    const a0 = (this.c0 - y) * this.invC3

    const r = this.r0 - a0 * 0.5

    const discriminant = this.q ** 3 + r ** 2

    if (discriminant > 0) {
      const a = Math.cbrt(Math.abs(r) + Math.sqrt(discriminant))

      return [(r < 0 ? this.q / a - a : a - this.q / a) - this.a2OverThree]
    }

    const theta = Math.acos(r / Math.sqrt((-this.q) ** 3)) / 3
    const twoRootQ = 2 * Math.sqrt(-this.q)

    const root1 = round(
      twoRootQ * Math.cos(theta - TWO_THIRDS_PI) - this.a2OverThree,
      this.precision,
    )
    const root2 = round(
      twoRootQ * Math.cos(theta) - this.a2OverThree,
      this.precision,
    )
    const root3 = round(
      twoRootQ * Math.cos(theta + TWO_THIRDS_PI) - this.a2OverThree,
      this.precision,
    )

    const roots = [root1]

    if (root2 !== root1) {
      roots.push(root2)
    }

    if (root3 !== root2 && root3 !== root1) {
      roots.push(root3)
    }

    roots.sort((a, b) => a - b)

    return roots as never
  }
}

class CubicPolynomial {
  private _roots:
    | readonly []
    | readonly [number]
    | readonly [number, number]
    | readonly [number, number, number]
    | undefined

  constructor(
    readonly c0: number,
    readonly c1: number,
    readonly c2: number,
    readonly c3: number,
    readonly precision = PRECISION,
  ) {}

  private _inverseSolver:
    | CubicInverseSolver
    | QuadraticInverseSolver
    | undefined

  get inverseSolver(): CubicInverseSolver | QuadraticInverseSolver {
    this._inverseSolver ||=
      this.c3 === 0
        ? new QuadraticInverseSolver(this.c0, this.c1, this.c2, this.precision)
        : new CubicInverseSolver(
            this.c0,
            this.c1,
            this.c2,
            this.c3,
            this.precision,
          )
    return this._inverseSolver
  }

  private _derivative: QuadraticPolynomial | undefined

  get derivative(): QuadraticPolynomial {
    this._derivative ||= new QuadraticPolynomial(
      3 * this.c3,
      2 * this.c2,
      this.c1,
      this.precision,
    )
    return this._derivative
  }

  private _solver: CubicSolver | undefined

  private get solver(): CubicSolver {
    this._solver ||= new CubicSolver(
      this.c0,
      this.c1,
      this.c2,
      this.c3,
      this.precision,
    )
    return this._solver
  }

  extrema(
    start: number = Number.NEGATIVE_INFINITY,
    end: number = Number.POSITIVE_INFINITY,
  ): readonly [] | readonly [number] | readonly [number, number] {
    return this.derivative.roots(start, end)
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: favoring efficiency & collocation over complexity
  roots(
    start: number = Number.NEGATIVE_INFINITY,
    end: number = Number.POSITIVE_INFINITY,
  ): readonly [] | readonly [number] | readonly [number, number] {
    this._roots ||= this.solveInverse(0)

    const result: Array<number> = []

    if (this._roots.length > 2) {
      const first = this._roots[0] as number
      const second = this._roots[1] as number
      const third = this._roots[2] as number

      if (first >= start && first <= end) {
        result.push(first)
      }

      if (second >= start && second <= end) {
        result.push(second)
      }

      if (third >= start && third <= end) {
        result.push(third)
      }
    } else if (this._roots.length > 1) {
      const first = this._roots[0] as number
      const second = this._roots[1] as number

      if (first >= start && first <= end) {
        result.push(first)
      }

      if (second >= start && second <= end) {
        result.push(second)
      }
    } else if (this._roots.length > 0) {
      const root = this._roots[0] as number

      if (root >= start && root <= end) {
        result.push(root)
      }
    }

    return result as never
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: favoring efficiency & collocation over complexity
  monotonicity(
    start: number = Number.NEGATIVE_INFINITY,
    end: number = Number.POSITIVE_INFINITY,
  ): Monotonicity {
    if (this.c1 === 0 && this.c2 === 0 && this.c3 === 0) {
      return 'constant'
    }

    const [min, max] = minMax(start, end)

    const roots = this.derivative.roots(min, max)

    if (roots.length === 2 && min === roots[0] && max === roots[1]) {
      return this.derivative.solve((min + max) / 2) > 0
        ? 'decreasing'
        : 'increasing'
    }

    if (roots.length === 1) {
      if (min === roots[0]) {
        return Math.sign(this.derivative.solve(max)) > 0
          ? 'decreasing'
          : 'increasing'
      }
      if (max === roots[0]) {
        return Math.sign(this.derivative.solve(min)) > 0
          ? 'decreasing'
          : 'increasing'
      }
    }

    return 'none'
  }

  antiderivative(
    integrationConstant: number,
  ): readonly [number, number, number, number, number] {
    return [integrationConstant, this.c0, this.c1 / 2, this.c2 / 3, this.c3 / 4]
  }

  solve(x: number): number
  solve(x: number, rangeStart?: number, rangeEnd?: number): number | null
  solve(
    x: number,
    rangeStart = Number.NEGATIVE_INFINITY,
    rangeEnd = Number.POSITIVE_INFINITY,
  ): number | null {
    const solution = this.solver.solve(x)
    const [min, max] = minMax(rangeStart, rangeEnd)
    return solution >= min && solution <= max ? solution : null
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: favoring efficiency & collocation over complexity
  solveInverse(
    y: number,
    rangeStart = Number.NEGATIVE_INFINITY,
    rangeEnd = Number.POSITIVE_INFINITY,
  ):
    | readonly []
    | readonly [number]
    | readonly [number, number]
    | readonly [number, number, number] {
    const raw = this.inverseSolver.solve(y)
    const solution: Array<number> = []

    if (raw.length > 0) {
      const [min, max] = minMax(rangeStart, rangeEnd)

      {
        const value = raw[0] as number
        if (value >= min && value <= max) {
          solution.push(value)
        }
      }

      if (raw.length > 1) {
        const value = raw[1] as number
        if (value >= min && value <= max) {
          solution.push(value)
        }
      }

      if (raw.length > 2) {
        const value = raw[2] as number
        if (value >= min && value <= max) {
          solution.push(value)
        }
      }
    }

    return solution as never
  }
}

export type Monotonicity = 'none' | 'increasing' | 'decreasing' | 'constant'

export type { LinearPolynomial, QuadraticPolynomial, CubicPolynomial }

export type CubicCoefficients = readonly [number, number, number, number]
export type QuadraticCoefficients = readonly [number, number, number]
export type LinearCoefficients = readonly [number, number]

export function createLinearPolynomial(
  c0: number,
  c1: number,
  precision = PRECISION,
): LinearPolynomial {
  return new LinearPolynomial(c0, c1, precision)
}

export function createQuadraticPolynomial(
  c0: number,
  c1: number,
  c2: number,
  precision = PRECISION,
): QuadraticPolynomial {
  return new QuadraticPolynomial(c0, c1, c2, precision)
}

export function createCubicPolynomial(
  c0: number,
  c1: number,
  c2: number,
  c3: number,
  precision = PRECISION,
): CubicPolynomial {
  return new CubicPolynomial(c0, c1, c2, c3, precision)
}
