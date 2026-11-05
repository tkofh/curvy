/**
 * Throws an `Error` carrying `message` when `condition` is false.
 *
 * Declared `asserts condition`, so after a call that returns, TypeScript
 * narrows by whatever `condition` proved.
 *
 * @param condition - The claim being asserted.
 * @param message - The message of the thrown error.
 * @throws `Error` with `message` when `condition` is false.
 * @example
 * ```ts
 * invariant(1 + 1 === 2, 'Math is broken!') // passes
 * invariant(1 + 1 === 3, 'Math is broken!') // throws Error: Math is broken!
 * ```
 * @since 1.0.4
 */
export function invariant(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}
