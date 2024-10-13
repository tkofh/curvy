// import { PRECISION, invariant, round } from './util'
// import { Vector2, Vector3, Vector4 } from './vector'

// /**
//  * A 2x2 matrix
//  *
//  * coefficients are stored in row-major order
//  */
// export class Matrix2x2 {
//   m00: number
//   m01: number

//   m10: number
//   m11: number

//   readonly precision: number

//   constructor(m00 = 0, m01 = 0, m10 = 0, m11 = 0, precision = PRECISION) {
//     this.m00 = round(m00, precision)
//     this.m01 = round(m01, precision)
//     this.m10 = round(m10, precision)
//     this.m11 = round(m11, precision)

//     this.precision = precision
//   }

//   determinant(): number {
//     return round(this.m00 * this.m11 - this.m01 * this.m10, this.precision)
//   }

//   matrixVectorProduct(v: Vector2): Vector2 {
//     return new Vector2(
//       this.m00 * v.v0 + this.m01 * v.v1,
//       this.m10 * v.v0 + this.m11 * v.v1,
//       Math.min(this.precision, v.precision),
//     )
//   }

//   vectorMatrixProduct(v: Vector2): Vector2 {
//     return new Vector2(
//       this.m00 * v.v0 + this.m10 * v.v1,
//       this.m01 * v.v0 + this.m11 * v.v1,
//       Math.min(this.precision, v.precision),
//     )
//   }

//   clone(): Matrix2x2 {
//     return new Matrix2x2(this.m00, this.m01, this.m10, this.m11, this.precision)
//   }

//   solveSystem(v: Vector2): Vector2 {
//     const determinant = this.determinant()

//     invariant(
//       determinant !== 0,
//       'Cannot solve system of equations when coefficient matrix determinant is zero',
//     )

//     const s0 = this.clone()
//     s0.m00 = v.v0
//     s0.m10 = v.v1

//     const s1 = this.clone()
//     s1.m01 = v.v0
//     s1.m11 = v.v1

//     return new Vector2(
//       s0.determinant() / determinant,
//       s1.determinant() / determinant,
//     )
//   }
// }

// /**
//  * A 3x3 matrix
//  *
//  * coefficients are stored in row-major order
//  */
// export class Matrix3x3 {
//   m00: number
//   m01: number
//   m02: number

//   m10: number
//   m11: number
//   m12: number

//   m20: number
//   m21: number
//   m22: number

//   readonly precision: number

//   constructor(
//     m00 = 0,
//     m01 = 0,
//     m02 = 0,
//     m10 = 0,
//     m11 = 0,
//     m12 = 0,
//     m20 = 0,
//     m21 = 0,
//     m22 = 0,
//     precision = PRECISION,
//   ) {
//     this.m00 = round(m00, precision)
//     this.m01 = round(m01, precision)
//     this.m02 = round(m02, precision)
//     this.m10 = round(m10, precision)
//     this.m11 = round(m11, precision)
//     this.m12 = round(m12, precision)
//     this.m20 = round(m20, precision)
//     this.m21 = round(m21, precision)
//     this.m22 = round(m22, precision)

//     this.precision = precision
//   }

//   determinant(): number {
//     return round(
//       this.m00 *
//         new Matrix2x2(
//           this.m11,
//           this.m12,
//           this.m21,
//           this.m22,
//           this.precision,
//         ).determinant() -
//         this.m01 *
//           new Matrix2x2(
//             this.m10,
//             this.m12,
//             this.m20,
//             this.m22,
//             this.precision,
//           ).determinant() +
//         this.m02 *
//           new Matrix2x2(
//             this.m10,
//             this.m11,
//             this.m20,
//             this.m21,
//             this.precision,
//           ).determinant(),
//       this.precision,
//     )
//   }

//   matrixVectorProduct(v: Vector3): Vector3 {
//     return new Vector3(
//       this.m00 * v.v0 + this.m01 * v.v1 + this.m02 * v.v2,
//       this.m10 * v.v0 + this.m11 * v.v1 + this.m12 * v.v2,
//       this.m20 * v.v0 + this.m21 * v.v1 + this.m22 * v.v2,
//       Math.min(this.precision, v.precision),
//     )
//   }

//   vectorMatrixProduct(v: Vector3): Vector3 {
//     return new Vector3(
//       this.m00 * v.v0 + this.m10 * v.v1 + this.m20 * v.v2,
//       this.m01 * v.v0 + this.m11 * v.v1 + this.m21 * v.v2,
//       this.m02 * v.v0 + this.m12 * v.v1 + this.m22 * v.v2,
//       Math.min(this.precision, v.precision),
//     )
//   }

//   clone(): Matrix3x3 {
//     return new Matrix3x3(
//       this.m00,
//       this.m01,
//       this.m02,
//       this.m10,
//       this.m11,
//       this.m12,
//       this.m20,
//       this.m21,
//       this.m22,
//       this.precision,
//     )
//   }

//   solveSystem(v: Vector3): Vector3 {
//     const determinant = this.determinant()

//     invariant(
//       determinant !== 0,
//       'Cannot solve system of equations when coefficient matrix determinant is zero',
//     )

//     const s0 = this.clone()
//     s0.m00 = v.v0
//     s0.m10 = v.v1
//     s0.m20 = v.v2

//     const s1 = this.clone()
//     s1.m01 = v.v0
//     s1.m11 = v.v1
//     s1.m21 = v.v2

//     const s2 = this.clone()
//     s2.m02 = v.v0
//     s2.m12 = v.v1
//     s2.m22 = v.v2

//     return new Vector3(
//       s0.determinant() / determinant,
//       s1.determinant() / determinant,
//       s2.determinant() / determinant,
//     )
//   }
// }

// /**
//  * A 4x4 matrix
//  *
//  * coefficients are stored in row-major order
//  */
// export class Matrix4x4 {
//   m00: number
//   m01: number
//   m02: number
//   m03: number

//   m10: number
//   m11: number
//   m12: number
//   m13: number

//   m20: number
//   m21: number
//   m22: number
//   m23: number

//   m30: number
//   m31: number
//   m32: number
//   m33: number

//   readonly precision: number

//   constructor(
//     m00 = 0,
//     m01 = 0,
//     m02 = 0,
//     m03 = 0,
//     m10 = 0,
//     m11 = 0,
//     m12 = 0,
//     m13 = 0,
//     m20 = 0,
//     m21 = 0,
//     m22 = 0,
//     m23 = 0,
//     m30 = 0,
//     m31 = 0,
//     m32 = 0,
//     m33 = 0,
//     precision = PRECISION,
//   ) {
//     this.m00 = round(m00, precision)
//     this.m01 = round(m01, precision)
//     this.m02 = round(m02, precision)
//     this.m03 = round(m03, precision)
//     this.m10 = round(m10, precision)
//     this.m11 = round(m11, precision)
//     this.m12 = round(m12, precision)
//     this.m13 = round(m13, precision)
//     this.m20 = round(m20, precision)
//     this.m21 = round(m21, precision)
//     this.m22 = round(m22, precision)
//     this.m23 = round(m23, precision)
//     this.m30 = round(m30, precision)
//     this.m31 = round(m31, precision)
//     this.m32 = round(m32, precision)
//     this.m33 = round(m33, precision)

//     this.precision = precision
//   }

//   determinant(): number {
//     return round(
//       this.m00 *
//         new Matrix3x3(
//           this.m11,
//           this.m12,
//           this.m13,
//           this.m21,
//           this.m22,
//           this.m23,
//           this.m31,
//           this.m32,
//           this.m33,
//           this.precision,
//         ).determinant() -
//         this.m01 *
//           new Matrix3x3(
//             this.m10,
//             this.m12,
//             this.m13,
//             this.m20,
//             this.m22,
//             this.m23,
//             this.m30,
//             this.m32,
//             this.m33,
//             this.precision,
//           ).determinant() +
//         this.m02 *
//           new Matrix3x3(
//             this.m10,
//             this.m11,
//             this.m13,
//             this.m20,
//             this.m21,
//             this.m23,
//             this.m30,
//             this.m31,
//             this.m33,
//             this.precision,
//           ).determinant() -
//         this.m03 *
//           new Matrix3x3(
//             this.m10,
//             this.m11,
//             this.m12,
//             this.m20,
//             this.m21,
//             this.m22,
//             this.m30,
//             this.m31,
//             this.m32,
//             this.precision,
//           ).determinant(),
//       this.precision,
//     )
//   }

//   matrixVectorProduct(v: Vector4): Vector4 {
//     const { v0, v1, v2, v3 } = v
//     return new Vector4(
//       this.m00 * v0 + this.m01 * v1 + this.m02 * v2 + this.m03 * v3,
//       this.m10 * v0 + this.m11 * v1 + this.m12 * v2 + this.m13 * v3,
//       this.m20 * v0 + this.m21 * v1 + this.m22 * v2 + this.m23 * v3,
//       this.m30 * v0 + this.m31 * v1 + this.m32 * v2 + this.m33 * v3,
//       Math.min(this.precision, v.precision),
//     )
//   }

//   vectorMatrixProduct(v: Vector4): Vector4 {
//     const { v0, v1, v2, v3 } = v
//     return new Vector4(
//       this.m00 * v0 + this.m10 * v1 + this.m20 * v2 + this.m30 * v3,
//       this.m01 * v0 + this.m11 * v1 + this.m21 * v2 + this.m31 * v3,
//       this.m02 * v0 + this.m12 * v1 + this.m22 * v2 + this.m32 * v3,
//       this.m03 * v0 + this.m13 * v1 + this.m23 * v2 + this.m33 * v3,
//       Math.min(this.precision, v.precision),
//     )
//   }

//   clone(): Matrix4x4 {
//     return new Matrix4x4(
//       this.m00,
//       this.m01,
//       this.m02,
//       this.m03,
//       this.m10,
//       this.m11,
//       this.m12,
//       this.m13,
//       this.m20,
//       this.m21,
//       this.m22,
//       this.m23,
//       this.m30,
//       this.m31,
//       this.m32,
//       this.m33,
//       this.precision,
//     )
//   }

//   solveSystem(v: Vector4): Vector4 {
//     const determinant = this.determinant()

//     invariant(
//       determinant !== 0,
//       'Cannot solve system of equations when coefficient matrix determinant is zero',
//     )

//     const { v0, v1, v2, v3 } = v

//     const s0 = this.clone()
//     s0.m00 = v0
//     s0.m10 = v1
//     s0.m20 = v2
//     s0.m30 = v3

//     const s1 = this.clone()
//     s1.m01 = v0
//     s1.m11 = v1
//     s1.m21 = v2
//     s1.m31 = v3

//     const s2 = this.clone()
//     s2.m02 = v0
//     s2.m12 = v1
//     s2.m22 = v2
//     s2.m32 = v3

//     const s3 = this.clone()
//     s3.m03 = v0
//     s3.m13 = v1
//     s3.m23 = v2
//     s3.m33 = v3

//     return new Vector4(
//       s0.determinant() / determinant,
//       s1.determinant() / determinant,
//       s2.determinant() / determinant,
//       s3.determinant() / determinant,
//     )
//   }
// }
