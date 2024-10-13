// import { PRECISION, round } from './util'

// export class Vector2 {
//   v0: number
//   v1: number

//   readonly precision: number

//   constructor(v0 = 0, v1 = 0, precision = PRECISION) {
//     this.v0 = round(v0, precision)
//     this.v1 = round(v1, precision)

//     this.precision = precision
//   }

//   private _magnitude: number | undefined

//   get magnitude(): number {
//     this._magnitude ??= round(Math.hypot(this.v0, this.v1), this.precision)

//     return this._magnitude
//   }

//   dot(v: Vector2): number {
//     return round(this.v0 * v.v0 + this.v1 * v.v1, this.precision)
//   }
// }

// export class Vector3 {
//   v0: number
//   v1: number
//   v2: number

//   readonly precision: number

//   constructor(v0 = 0, v1 = 0, v2 = 0, precision = PRECISION) {
//     this.v0 = round(v0, precision)
//     this.v1 = round(v1, precision)
//     this.v2 = round(v2, precision)

//     this.precision = precision
//   }

//   private _magnitude: number | undefined

//   get magnitude(): number {
//     this._magnitude ??= round(
//       Math.hypot(this.v0, this.v1, this.v2),
//       this.precision,
//     )

//     return this._magnitude
//   }

//   dot(v: Vector3): number {
//     return round(
//       this.v0 * v.v0 + this.v1 * v.v1 + this.v2 * v.v2,
//       this.precision,
//     )
//   }
// }

// export class Vector4 {
//   v0: number
//   v1: number
//   v2: number
//   v3: number

//   readonly precision: number

//   constructor(v0 = 0, v1 = 0, v2 = 0, v3 = 0, precision = PRECISION) {
//     this.v0 = round(v0, precision)
//     this.v1 = round(v1, precision)
//     this.v2 = round(v2, precision)
//     this.v3 = round(v3, precision)

//     this.precision = precision
//   }

//   private _magnitude: number | undefined

//   get magnitude(): number {
//     this._magnitude ??= round(
//       Math.hypot(this.v0, this.v1, this.v2, this.v3),
//       this.precision,
//     )

//     return this._magnitude
//   }

//   dot(v: Vector4): number {
//     return round(
//       this.v0 * v.v0 + this.v1 * v.v1 + this.v2 * v.v2 + this.v3 * v.v3,
//       Math.min(this.precision, v.precision),
//     )
//   }
// }
