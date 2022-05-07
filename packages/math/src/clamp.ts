/**
 * Clamp offers a shorthand to restrict some value to a min and max range
 *
 * @param value number to clamp
 * @param min minimum output value
 * @param max maximum output value
 */
export const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max)
