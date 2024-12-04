import { describe, expect, test } from 'vitest'
import * as linearCurve2d from '../src/curve/linear2d'
import * as quadraticCurve2d from '../src/curve/quadratic2d'
import * as linearPath2d from '../src/path/linear2d'
import * as quadraticPath2d from '../src/path/quadratic2d'
import * as linearPolynomial from '../src/polynomial/linear'
import * as quadraticPolynomial from '../src/polynomial/quadratic'
import { round } from '../src/util'
import * as vector2 from '../src/vector/vector2'

describe('linear2d', () => {
  test('fromCurves', () => {
    expect(
      linearPath2d.fromCurves(
        linearCurve2d.fromPolynomials(
          linearPolynomial.make(0, 1),
          linearPolynomial.make(1, 0),
        ),
        linearCurve2d.fromPolynomials(
          linearPolynomial.make(1, 1),
          linearPolynomial.make(1, -1),
        ),
      ),
    ).toBeDefined()
  })
  test('fromCurveArray', () => {
    expect(
      linearPath2d.fromCurveArray([
        linearCurve2d.fromPolynomials(
          linearPolynomial.make(0, 1),
          linearPolynomial.make(1, 0),
        ),
        linearCurve2d.fromPolynomials(
          linearPolynomial.make(1, 1),
          linearPolynomial.make(1, -1),
        ),
      ]),
    ).toBeDefined()
  })
  test('isLinear2dPath', () => {
    expect(
      linearPath2d.isLinearPath2d(
        linearPath2d.fromCurves(
          linearCurve2d.fromPolynomials(
            linearPolynomial.make(0, 1),
            linearPolynomial.make(1, 0),
          ),
          linearCurve2d.fromPolynomials(
            linearPolynomial.make(1, 1),
            linearPolynomial.make(1, -1),
          ),
        ),
      ),
    ).toBe(true)
  })
  test('append', () => {
    const c0 = linearCurve2d.fromPolynomials(
      linearPolynomial.make(0, 1),
      linearPolynomial.make(1, 0),
    )
    const c1 = linearCurve2d.fromPolynomials(
      linearPolynomial.make(1, 1),
      linearPolynomial.make(1, -1),
    )
    const p0 = linearPath2d.fromCurves(c0)

    const p1Curves = [...p0]

    expect(p1Curves).toEqual([c0])

    const p1 = linearPath2d.append(p0, c1)

    const p2Curves = [...p1]

    expect(p2Curves).toEqual([c0, c1])
  })
  test('solve', () => {
    const p = linearPath2d.fromCurves(
      linearCurve2d.fromPolynomials(
        linearPolynomial.make(0, 1),
        linearPolynomial.make(1, 0),
      ),
      linearCurve2d.fromPolynomials(
        linearPolynomial.make(1, 1),
        linearPolynomial.make(1, -1),
      ),
    )

    expect(linearPath2d.solve(p, 0)).toEqual(vector2.make(0, 1))
    expect(linearPath2d.solve(p, 0.5)).toEqual(vector2.make(1, 1))
    expect(linearPath2d.solve(p, 1)).toEqual(vector2.make(2, 0))
  })
  test('length', () => {
    expect(
      linearPath2d.length(
        linearPath2d.fromCurves(
          linearCurve2d.fromPolynomials(
            linearPolynomial.make(0, 1),
            linearPolynomial.make(1, 0),
          ),
          linearCurve2d.fromPolynomials(
            linearPolynomial.make(1, 1),
            linearPolynomial.make(1, -1),
          ),
        ),
      ),
    ).toBe(round(1 + Math.sqrt(2)))
  })
})
describe('quadratic2d', () => {
  test('fromCurves', () => {
    expect(
      quadraticPath2d.fromCurves(
        quadraticCurve2d.fromPolynomials(
          quadraticPolynomial.make(0, 0, 1),
          quadraticPolynomial.make(0, 0, 1),
        ),
        quadraticCurve2d.fromPolynomials(
          quadraticPolynomial.make(0, 0, 1),
          quadraticPolynomial.make(0, 0, 1),
        ),
      ),
    ).toBeDefined()
  })
  test('fromCurveArray', () => {
    expect(
      quadraticPath2d.fromCurveArray([
        quadraticCurve2d.fromPolynomials(
          quadraticPolynomial.make(0, 0, 1),
          quadraticPolynomial.make(0, 0, 1),
        ),
        quadraticCurve2d.fromPolynomials(
          quadraticPolynomial.make(0, 0, 1),
          quadraticPolynomial.make(0, 0, 1),
        ),
      ]),
    ).toBeDefined()
  })
  test('isQuadratic2dPath', () => {
    expect(
      quadraticPath2d.isQuadraticPath2d(
        quadraticPath2d.fromCurves(
          quadraticCurve2d.fromPolynomials(
            quadraticPolynomial.make(0, 0, 1),
            quadraticPolynomial.make(0, 0, 1),
          ),
          quadraticCurve2d.fromPolynomials(
            quadraticPolynomial.make(0, 0, 1),
            quadraticPolynomial.make(0, 0, 1),
          ),
        ),
      ),
    ).toBe(true)
  })
  test('append', () => {
    const c0 = quadraticCurve2d.fromPolynomials(
      quadraticPolynomial.make(0, 0, 1),
      quadraticPolynomial.make(0, 0, 1),
    )
    const c1 = quadraticCurve2d.fromPolynomials(
      quadraticPolynomial.make(0, 0, 1),
      quadraticPolynomial.make(0, 0, 1),
    )
    const p0 = quadraticPath2d.fromCurves(c0)

    const p1Curves = [...p0]

    expect(p1Curves).toEqual([c0])

    const p1 = quadraticPath2d.append(p0, c1)

    const p2Curves = [...p1]

    expect(p2Curves).toEqual([c0, c1])
  })
  test('solve', () => {
    const p = quadraticPath2d.fromCurves(
      quadraticCurve2d.fromPolynomials(
        quadraticPolynomial.make(0, 0, 1),
        quadraticPolynomial.make(0, 0, 1),
      ),
      quadraticCurve2d.fromPolynomials(
        quadraticPolynomial.make(1, 0, 1),
        quadraticPolynomial.make(1, 0, 1),
      ),
    )

    expect(quadraticPath2d.solve(p, 0)).toEqual(vector2.make(0, 0))
    expect(quadraticPath2d.solve(p, 0.5)).toEqual(vector2.make(1, 1))
    expect(quadraticPath2d.solve(p, 1)).toEqual(vector2.make(2, 2))
  })
})
