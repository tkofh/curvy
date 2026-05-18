import { describe, expect, test } from 'vitest'
import * as CubicCurve2d from '../src/curve/cubic2d.ts'
import * as LinearCurve2d from '../src/curve/linear2d.ts'
import * as QuadraticCurve2d from '../src/curve/quadratic2d.ts'
import * as RationalCubicCurve2d from '../src/curve/rationalCubic2d.ts'
import * as CubicPath2d from '../src/path/cubic2d.ts'
import * as LinearPath2d from '../src/path/linear2d.ts'
import * as QuadraticPath2d from '../src/path/quadratic2d.ts'
import * as RationalCubicPath2d from '../src/path/rationalCubic2d.ts'
import * as Basis2d from '../src/splines/basis2d.ts'
import * as Bezier2d from '../src/splines/bezier2d.ts'
import * as Cardinal2d from '../src/splines/cardinal2d.ts'
import * as Hermite2d from '../src/splines/hermite2d.ts'
import * as Linear2d from '../src/splines/linear2d.ts'
import * as RationalBezier2d from '../src/splines/rationalBezier2d.ts'
import * as Matrix3x3 from '../src/matrix/matrix3x3.ts'
import * as Affine2d from '../src/transform/affine2d.ts'
import * as Vector2 from '../src/vector/vector2.ts'

const samples = [0, 0.17, 0.34, 0.5, 0.67, 0.83, 1]

describe('Affine2d', () => {
  test('identity is a no-op', () => {
    const p = Vector2.make(3, 5)
    expect(Affine2d.apply(Affine2d.identity, p)).toBeCloseToValue(p)
  })

  test('translate adds the offset', () => {
    expect(Affine2d.apply(Affine2d.translate(1, 2), Vector2.make(3, 4))).toBeCloseToValue(
      Vector2.make(4, 6),
    )
  })

  test('translateBy uses vector components', () => {
    expect(
      Affine2d.apply(Affine2d.translateBy(Vector2.make(1, 2)), Vector2.make(3, 4)),
    ).toBeCloseToValue(Vector2.make(4, 6))
  })

  test('scale(xy) is uniform', () => {
    expect(Affine2d.apply(Affine2d.scale(2), Vector2.make(3, 4))).toBeCloseToValue(
      Vector2.make(6, 8),
    )
  })

  test('scale(sx, sy) is non-uniform', () => {
    expect(Affine2d.apply(Affine2d.scale(2, 3), Vector2.make(3, 4))).toBeCloseToValue(
      Vector2.make(6, 12),
    )
  })

  test('scaleAround fixes the origin point', () => {
    const o = Vector2.make(10, 20)
    expect(Affine2d.apply(Affine2d.scaleAround(2, 3, o), o)).toBeCloseToValue(o)
  })

  test('scaleAround equals scale at the origin', () => {
    const p = Vector2.make(3, 4)
    expect(Affine2d.apply(Affine2d.scaleAround(2, 3, Vector2.zero), p)).toBeCloseToValue(
      Affine2d.apply(Affine2d.scale(2, 3), p),
    )
  })

  test('rotate by 2π is identity', () => {
    const p = Vector2.make(3, 4)
    expect(Affine2d.apply(Affine2d.rotate(Math.PI * 2), p)).toBeCloseToValue(p)
  })

  test('rotate by π/2', () => {
    expect(Affine2d.apply(Affine2d.rotate(Math.PI / 2), Vector2.make(1, 0))).toBeCloseToValue(
      Vector2.make(0, 1),
    )
  })

  test('rotateAround fixes the origin point', () => {
    const o = Vector2.make(5, 7)
    expect(Affine2d.apply(Affine2d.rotateAround(1.2, o), o)).toBeCloseToValue(o)
  })

  test('rotateAround equals rotate at the origin', () => {
    const p = Vector2.make(3, 4)
    expect(Affine2d.apply(Affine2d.rotateAround(1.2, Vector2.zero), p)).toBeCloseToValue(
      Affine2d.apply(Affine2d.rotate(1.2), p),
    )
  })

  test('reflectX flips y', () => {
    expect(Affine2d.apply(Affine2d.reflectX, Vector2.make(3, 4))).toBeCloseToValue(
      Vector2.make(3, -4),
    )
  })

  test('reflectY flips x', () => {
    expect(Affine2d.apply(Affine2d.reflectY, Vector2.make(3, 4))).toBeCloseToValue(
      Vector2.make(-3, 4),
    )
  })

  test('reflectAcrossLine through origin in x direction equals reflectX', () => {
    const p = Vector2.make(3, 4)
    expect(
      Affine2d.apply(Affine2d.reflectAcrossLine(Vector2.zero, Vector2.make(1, 0)), p),
    ).toBeCloseToValue(Affine2d.apply(Affine2d.reflectX, p))
  })

  test('reflectAcrossLine through origin in y direction equals reflectY', () => {
    const p = Vector2.make(3, 4)
    expect(
      Affine2d.apply(Affine2d.reflectAcrossLine(Vector2.zero, Vector2.make(0, 1)), p),
    ).toBeCloseToValue(Affine2d.apply(Affine2d.reflectY, p))
  })

  test('reflectAcrossLine twice is identity', () => {
    const line = Affine2d.reflectAcrossLine(Vector2.make(1, 1), Vector2.make(2, 3))
    const p = Vector2.make(5, 7)
    expect(Affine2d.apply(line, Affine2d.apply(line, p))).toBeCloseToValue(p)
  })

  test('shear preserves the axis it parallels', () => {
    expect(Affine2d.apply(Affine2d.shear(2, 0), Vector2.make(3, 0))).toBeCloseToValue(
      Vector2.make(3, 0),
    )
    expect(Affine2d.apply(Affine2d.shear(0, 2), Vector2.make(0, 5))).toBeCloseToValue(
      Vector2.make(0, 5),
    )
  })

  test('andThen sequences left-to-right', () => {
    // translate first, then rotate by π/2: (1, 0) → (2, 0) → (0, 2)
    const t = Affine2d.identity.pipe(
      Affine2d.andThen(Affine2d.translate(1, 0)),
      Affine2d.andThen(Affine2d.rotate(Math.PI / 2)),
    )
    expect(Affine2d.apply(t, Vector2.make(1, 0))).toBeCloseToValue(Vector2.make(0, 2))
  })

  test('inverse round-trip', () => {
    const a = Affine2d.identity.pipe(
      Affine2d.andThen(Affine2d.translate(3, 5)),
      Affine2d.andThen(Affine2d.rotate(1.2)),
      Affine2d.andThen(Affine2d.scale(2, 3)),
    )
    const inv = Affine2d.inverse(a)
    const p = Vector2.make(7, 11)
    expect(Affine2d.apply(inv, Affine2d.apply(a, p))).toBeCloseToValue(p)
  })

  test('linear returns the upper-left 2×2 block', () => {
    const a = Affine2d.translate(10, 20)
    const lin = Affine2d.linear(a)
    expect(lin).toMatchObject({ m00: 1, m01: 0, m10: 0, m11: 1 })
  })

  test('translation returns the third column', () => {
    expect(Affine2d.translation(Affine2d.translate(3, 5))).toBeCloseToValue(Vector2.make(3, 5))
  })

  test('linearPart drops translation', () => {
    const a = Affine2d.identity.pipe(
      Affine2d.andThen(Affine2d.rotate(1.2)),
      Affine2d.andThen(Affine2d.translate(10, 20)),
    )
    const lp = Affine2d.linearPart(a)
    expect(Affine2d.translation(lp)).toBeCloseToValue(Vector2.zero)
    // linear part of a translation-only transform is identity
    expect(
      Affine2d.apply(Affine2d.linearPart(Affine2d.translate(3, 5)), Vector2.make(7, 11)),
    ).toBeCloseToValue(Vector2.make(7, 11))
  })

  test('fromMatrix rejects non-affine matrices', () => {
    // last row is not [0, 0, 1] — represents a projective transform, which
    // doesn't preserve the polynomial form of a curve's coefficients
    const bad = Matrix3x3.make(1, 0, 0, 0, 1, 0, 1, 0, 1)
    expect(() => Affine2d.fromMatrix(bad)).toThrowError()
  })

  test('fromMatrix accepts canonical affine matrices', () => {
    const ok = Matrix3x3.make(1, 0, 3, 0, 1, 5, 0, 0, 1)
    expect(() => Affine2d.fromMatrix(ok)).not.toThrow()
  })
})

// ── splines ─────────────────────────────────────────────────────────────────

describe('spline transforms', () => {
  const t = Affine2d.identity.pipe(
    Affine2d.andThen(Affine2d.translate(3, 5)),
    Affine2d.andThen(Affine2d.rotate(0.7)),
    Affine2d.andThen(Affine2d.scale(1.5, 2)),
  )

  test('Bezier2d.transform matches transformed evaluation', () => {
    const b = Bezier2d.make(
      Vector2.make(0, 0),
      Vector2.make(1, 2),
      Vector2.make(3, 1),
      Vector2.make(4, 4),
    )
    const transformed = Bezier2d.transform(b, t)
    const original = Bezier2d.toPath(b)
    const result = Bezier2d.toPath(transformed)
    for (const u of samples) {
      expect(CubicPath2d.solve(result, u)).toBeCloseToValue(
        Affine2d.apply(t, CubicPath2d.solve(original, u)),
      )
    }
  })

  test('Linear2d.transform matches transformed evaluation', () => {
    const l = Linear2d.make(Vector2.make(0, 0), Vector2.make(2, 3), Vector2.make(5, 1))
    const transformed = Linear2d.transform(l, t)
    const original = Linear2d.toPath(l)
    const result = Linear2d.toPath(transformed)
    for (const u of samples) {
      expect(LinearPath2d.solve(result, u)).toBeCloseToValue(
        Affine2d.apply(t, LinearPath2d.solve(original, u)),
      )
    }
  })

  test('Cardinal2d.transform preserves tension and alpha (uniform parameterization)', () => {
    // alpha = 0 is uniform Catmull-Rom — chord lengths don't drive
    // parameterization, so the affine image of the control points exactly
    // describes the affine image of the curve. For alpha != 0 (centripetal
    // / chordal), non-uniform scale breaks chord-length normalization; the
    // implementation still returns a useful curve but no longer matches the
    // affine image of the original pointwise.
    const c = Cardinal2d.make(
      { alpha: 0 },
      Vector2.make(0, 0),
      Vector2.make(1, 2),
      Vector2.make(3, 1),
      Vector2.make(4, 4),
    )
    const transformed = Cardinal2d.transform(c, t)
    const original = Cardinal2d.toPath(c)
    const result = Cardinal2d.toPath(transformed)
    for (const u of samples) {
      expect(CubicPath2d.solve(result, u)).toBeCloseToValue(
        Affine2d.apply(t, CubicPath2d.solve(original, u)),
      )
    }
  })

  test('Basis2d.transform matches transformed evaluation', () => {
    const b = Basis2d.make(
      Vector2.make(0, 0),
      Vector2.make(1, 2),
      Vector2.make(3, 1),
      Vector2.make(4, 4),
    )
    const transformed = Basis2d.transform(b, t)
    const original = Basis2d.toPath(b)
    const result = Basis2d.toPath(transformed)
    for (const u of samples) {
      // looser tolerance: matrix conversion through cubic basis accumulates
      // float drift around 1e-7, well below any geometric tolerance.
      expect(CubicPath2d.solve(result, u)).toBeCloseToValue(
        Affine2d.apply(t, CubicPath2d.solve(original, u)),
        1e-6,
      )
    }
  })

  test('Hermite2d.transform handles tangents correctly under translation', () => {
    // Naive mapPoints would translate the tangent vectors too and bend the
    // curve. transform should split positions vs tangents.
    const h = Hermite2d.make(
      Vector2.make(0, 0),
      Vector2.make(1, 0),
      Vector2.make(1, 1),
      Vector2.make(0, 1),
    )
    // pure translation: the linear part is identity, so tangents must not move
    const translateOnly = Affine2d.translate(10, 20)
    const transformed = Hermite2d.transform(h, translateOnly)
    const original = Hermite2d.toPath(h)
    const result = Hermite2d.toPath(transformed)
    for (const u of samples) {
      expect(CubicPath2d.solve(result, u)).toBeCloseToValue(
        Affine2d.apply(translateOnly, CubicPath2d.solve(original, u)),
      )
    }
  })

  test('Hermite2d.transform matches transformed evaluation under full affine', () => {
    const h = Hermite2d.make(
      Vector2.make(0, 0),
      Vector2.make(1, 0),
      Vector2.make(1, 1),
      Vector2.make(0, 1),
    )
    const transformed = Hermite2d.transform(h, t)
    const original = Hermite2d.toPath(h)
    const result = Hermite2d.toPath(transformed)
    for (const u of samples) {
      expect(CubicPath2d.solve(result, u)).toBeCloseToValue(
        Affine2d.apply(t, CubicPath2d.solve(original, u)),
      )
    }
  })

  test('RationalBezier2d.transform preserves weights and matches evaluation', () => {
    const r = RationalBezier2d.make(
      Vector2.makeWeighted(0, 0, 1),
      Vector2.makeWeighted(1, 2, 0.5),
      Vector2.makeWeighted(3, 1, 2),
      Vector2.makeWeighted(4, 4, 1),
    )
    const transformed = RationalBezier2d.transform(r, t)
    const original = RationalBezier2d.toPath(r)
    const result = RationalBezier2d.toPath(transformed)
    for (const u of samples) {
      expect(RationalCubicPath2d.solve(result, u)).toBeCloseToValue(
        Affine2d.apply(t, RationalCubicPath2d.solve(original, u)),
      )
    }
  })
})

// ── curves & paths ──────────────────────────────────────────────────────────

describe('curve transforms', () => {
  const t = Affine2d.identity.pipe(
    Affine2d.andThen(Affine2d.translate(3, 5)),
    Affine2d.andThen(Affine2d.rotate(0.7)),
    Affine2d.andThen(Affine2d.scale(1.5, 2)),
  )

  test('LinearCurve2d.transform', () => {
    const c = LinearCurve2d.fromEndpoints(Vector2.make(1, 2), Vector2.make(4, 6))
    const tc = LinearCurve2d.transform(c, t)
    for (const u of samples) {
      expect(LinearCurve2d.solve(tc, u)).toBeCloseToValue(
        Affine2d.apply(t, LinearCurve2d.solve(c, u)),
      )
    }
  })

  test('QuadraticCurve2d.transform', () => {
    const c = QuadraticCurve2d.fromCoefficients(
      Vector2.make(0, 0),
      Vector2.make(1, 2),
      Vector2.make(3, 1),
    )
    const tc = QuadraticCurve2d.transform(c, t)
    for (const u of samples) {
      expect(QuadraticCurve2d.solve(tc, u)).toBeCloseToValue(
        Affine2d.apply(t, QuadraticCurve2d.solve(c, u)),
      )
    }
  })

  test('CubicCurve2d.transform', () => {
    const c = CubicCurve2d.fromBezierPoints(
      Vector2.make(0, 0),
      Vector2.make(1, 2),
      Vector2.make(3, 1),
      Vector2.make(4, 4),
    )
    const tc = CubicCurve2d.transform(c, t)
    for (const u of samples) {
      expect(CubicCurve2d.solve(tc, u)).toBeCloseToValue(
        Affine2d.apply(t, CubicCurve2d.solve(c, u)),
      )
    }
  })

  test('RationalCubicCurve2d.transform preserves projection identity', () => {
    const c = RationalCubicCurve2d.fromBezierPoints(
      Vector2.makeWeighted(0, 0, 1),
      Vector2.makeWeighted(1, 2, 0.5),
      Vector2.makeWeighted(3, 1, 2),
      Vector2.makeWeighted(4, 4, 1),
    )
    const tc = RationalCubicCurve2d.transform(c, t)
    for (const u of samples) {
      expect(RationalCubicCurve2d.solve(tc, u)).toBeCloseToValue(
        Affine2d.apply(t, RationalCubicCurve2d.solve(c, u)),
      )
    }
  })

  test('inverse transform round-trips on a cubic curve', () => {
    const c = CubicCurve2d.fromBezierPoints(
      Vector2.make(0, 0),
      Vector2.make(1, 2),
      Vector2.make(3, 1),
      Vector2.make(4, 4),
    )
    const round = CubicCurve2d.transform(CubicCurve2d.transform(c, t), Affine2d.inverse(t))
    for (const u of samples) {
      expect(CubicCurve2d.solve(round, u)).toBeCloseToValue(CubicCurve2d.solve(c, u))
    }
  })
})

describe('path transforms', () => {
  const t = Affine2d.identity.pipe(
    Affine2d.andThen(Affine2d.translate(3, 5)),
    Affine2d.andThen(Affine2d.rotate(0.7)),
    Affine2d.andThen(Affine2d.scale(1.5, 2)),
  )

  test('LinearPath2d.transform', () => {
    const p = Linear2d.toPath(
      Linear2d.make(Vector2.make(0, 0), Vector2.make(2, 3), Vector2.make(5, 1)),
    )
    const tp = LinearPath2d.transform(p, t)
    for (const u of samples) {
      expect(LinearPath2d.solve(tp, u)).toBeCloseToValue(
        Affine2d.apply(t, LinearPath2d.solve(p, u)),
      )
    }
  })

  test('QuadraticPath2d.transform', () => {
    const c = QuadraticCurve2d.fromCoefficients(
      Vector2.make(0, 0),
      Vector2.make(1, 2),
      Vector2.make(3, 1),
    )
    const p = QuadraticPath2d.make(c)
    const tp = QuadraticPath2d.transform(p, t)
    for (const u of samples) {
      expect(QuadraticPath2d.solve(tp, u)).toBeCloseToValue(
        Affine2d.apply(t, QuadraticPath2d.solve(p, u)),
      )
    }
  })

  test('CubicPath2d.transform', () => {
    const p = Bezier2d.toPath(
      Bezier2d.make(
        Vector2.make(0, 0),
        Vector2.make(1, 2),
        Vector2.make(3, 1),
        Vector2.make(4, 4),
      ).pipe(Bezier2d.append(Vector2.make(5, 6), Vector2.make(6, 5), Vector2.make(7, 7))),
    )
    const tp = CubicPath2d.transform(p, t)
    for (const u of samples) {
      expect(CubicPath2d.solve(tp, u)).toBeCloseToValue(Affine2d.apply(t, CubicPath2d.solve(p, u)))
    }
  })

  test('RationalCubicPath2d.transform', () => {
    const p = RationalBezier2d.toPath(
      RationalBezier2d.make(
        Vector2.makeWeighted(0, 0, 1),
        Vector2.makeWeighted(1, 2, 0.5),
        Vector2.makeWeighted(3, 1, 2),
        Vector2.makeWeighted(4, 4, 1),
      ),
    )
    const tp = RationalCubicPath2d.transform(p, t)
    for (const u of samples) {
      expect(RationalCubicPath2d.solve(tp, u)).toBeCloseToValue(
        Affine2d.apply(t, RationalCubicPath2d.solve(p, u)),
      )
    }
  })
})
