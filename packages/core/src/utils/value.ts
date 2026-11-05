import { Pipeable } from './pipeable.ts'

export declare namespace Value {
  /**
   * A value whose class was built with `Value`. Every curvy value is one.
   *
   * As a type, it accepts any curvy value and any value from a library
   * that builds its types with `Value`.
   *
   * @since 2.0.0
   */
  interface Instance extends Pipeable {
    /**
     * The type's name: its id after the package segment, with `.` for `/`.
     * `Object.prototype.toString` reads it, giving `[object Vector2]`.
     *
     * @since 2.0.0
     */
    readonly [Symbol.toStringTag]: string

    /**
     * Renders this value as text. Template literals and `String(value)` use
     * it, and so does `console.log` in Node, Bun, and Deno.
     *
     * @returns The rendering. Curvy's own values render like a constructor
     * call: `Vector2(3, 4)`.
     * @since 2.0.0
     */
    toString(): string
  }
}

// The type of the class `Value` returns, which has no runtime counterpart
// of its own. It is a declared abstract class because only an abstract
// member makes a subclass that omits `toString` fail to compile, and an
// interface can't mark a member abstract. Its members repeat
// `Value.Instance`'s docs: a subclass's hover reads them through `extends`,
// and without them falls through to `Object.prototype.toString`'s.
declare abstract class AbstractValue extends Pipeable implements Value.Instance {
  /**
   * The type's name: its id after the package segment, with `.` for `/`.
   * `Object.prototype.toString` reads it, giving `[object Vector2]`.
   *
   * @since 2.0.0
   */
  readonly [Symbol.toStringTag]: string

  /**
   * Renders this value as text. Template literals and `String(value)` use
   * it, and so does `console.log` in Node, Bun, and Deno.
   *
   * @returns The rendering. Curvy's own values render like a constructor
   * call: `Vector2(3, 4)`.
   * @since 2.0.0
   */
  abstract override toString(): string
}

// The rest-`any` construct signature makes this a mixin constructor type,
// which TypeScript folds into `AbstractValue`'s own signature instead of
// reporting two base constructors (TS2510).
type ValueClass<Id extends string> = typeof AbstractValue &
  (abstract new (...args: Array<any>) => { readonly [K in Id]: Id })

// Node's custom inspect hook, shared by every value prototype. Node, Bun,
// and Deno call it from `console.log` and the REPL.
function inspect(this: { toString(): string }): string {
  return this.toString()
}

/**
 * Builds the base class for a value type from its type id.
 *
 * The id is `~<package>/<Name>`: the package that owns the type, then the
 * name consumers know it by, with `/` for `.` in a namespaced name
 * (`~curvy/Vector2/Weighted` for `Vector2.Weighted`). The package segment
 * keeps two libraries' same-named types apart, and leaving it out is a type
 * error.
 *
 * The returned class extends `Pipeable`, and its instances are
 * `Value.Instance`s whose type also carries the id as a key whose value is
 * the id itself (`{ readonly [id]: id }`). Its prototype holds three
 * properties:
 *
 * - the id, as a non-enumerable key, so a type guard is `id in value`.
 *   Being a string, it matches values from every installed copy of the
 *   defining package, where `instanceof` would not.
 * - `Symbol.toStringTag`, the id after its package segment with `.` for
 *   `/`, so `Object.prototype.toString` gives `[object Point]`.
 * - Node's custom inspect hook, which prints `toString()`, so `console.log`
 *   and the REPL in Node, Bun, and Deno show the value's rendering instead
 *   of a field dump.
 *
 * Instances hold only their own fields, so `JSON.stringify`, `Object.keys`,
 * and object spread see nothing extra. A subclass must implement
 * `toString`.
 *
 * Several types can share one id by extending one `Value(id)` base, as
 * curvy's interval kinds share `~curvy/Interval`.
 *
 * @param id - The type id, `~<package>/<Name>`.
 * @returns An abstract class to extend.
 * @example
 * ```ts
 * class Point extends Value('~geometry/Point') {
 *   readonly x: number
 *   readonly y: number
 *
 *   constructor(x: number, y: number) {
 *     super()
 *     this.x = x
 *     this.y = y
 *   }
 *
 *   override toString() {
 *     return `Point(${this.x}, ${this.y})`
 *   }
 * }
 *
 * const isPoint = (u: unknown): u is Point =>
 *   typeof u === 'object' && u !== null && '~geometry/Point' in u
 *
 * console.log(new Point(1, 2)) // Point(1, 2)
 * Object.prototype.toString.call(new Point(1, 2)) // '[object Point]'
 * isPoint(new Point(1, 2)) // true
 * ```
 * @since 2.0.0
 */
export const Value = <const Id extends `~${string}/${string}`>(id: Id): ValueClass<Id> => {
  class Base extends Pipeable {}
  Object.defineProperties(Base.prototype, {
    [id]: { value: id },
    [Symbol.toStringTag]: { value: id.slice(id.indexOf('/') + 1).replaceAll('/', '.') },
    [Symbol.for('nodejs.util.inspect.custom')]: { value: inspect },
  })
  return Base as unknown as ValueClass<Id>
}
