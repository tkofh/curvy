/**
 * Rounds a value to a specified number of decimal digits
 *
 * @param value number to round
 * @param precision number od decimal places to round to
 */
export const roundTo = (value: number, precision: number) => {
  if (precision < 0 || Math.round(precision) !== precision) {
    throw new Error('precision must be a positive integer or zero')
  }

  let output!: number

  if (precision >= 17) {
    // don't bother rounding to more decimal places than browser javascript numbers can hold
    output = value
  } else if (precision === 0) {
    // for precision = 0, use Math.round only
    output = Math.round(value)
  } else {
    const coefficient = Math.pow(10, precision)
    output = Math.round(value * coefficient) / coefficient

    // const offsetRoundedString = Math.round(value * Math.pow(10, precision)).toString()
    //
    // // decimal offset represents how many positions the decimal must move from the start of the string
    // const decimalOffset = offsetRoundedString.length - precision
    //
    // if (decimalOffset > 0) {
    //   // when decimal offset is a positive number, the output will be greater than or equal to 1.
    //   // insert the decimal into the appropriate position in the string, and convert back to a number
    //   output = Number(
    //     `${offsetRoundedString.substring(0, decimalOffset)}.${offsetRoundedString.substring(
    //       decimalOffset
    //     )}`
    //   )
    // } else {
    //   // when the decimal offset is a negative number or 0, the output will be less than 1.
    //   // to create a string representation of the output, we need to insert zero or more leading zeros
    //   // before the rounded offset value. decimal offset might be negative, so use its absolute value
    //   // when indicating how many 0's to insert
    //   output = Number(`0.${'0'.repeat(Math.abs(decimalOffset))}${offsetRoundedString}`)
    // }
  }

  return output
}
