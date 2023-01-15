/**
 * A Matrix with 4 rows and 4 columns.
 *
 * Values are column major. To access the value at X=3, Y=2, read from matrix[2][3].
 * The first index provided is the row, the second index provided is the column.
 */
export type Matrix4x4 = [
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number]
]

export type ReadonlyMatrix4x4 = readonly [
  readonly [number, number, number, number],
  readonly [number, number, number, number],
  readonly [number, number, number, number],
  readonly [number, number, number, number]
]
