export interface SplineOptions {
  /**
   * Number of samples to take of the curve.
   * A larger number yields more accurate results, but takes longer to compute.
   *
   * Default: 512
   */
  lutResolution?: number
  /**
   * The number of decimal places to which the output (curve Y value) should be calculated.
   *
   * Default: 16
   */
  precision?: number
  /**
   * The number of decimal places to consider for the curve's x component
   *
   * Default: 16
   */
  precisionX?: number
  /**
   * The number of decimal places to consider for the curve's y component
   *
   * Default: 16
   */
  precisionY?: number
}
