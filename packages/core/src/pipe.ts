/**
 * pipe() and dual() are slightly modified versions of Effect-TS's pipe() and dual() functions.
 * https://github.com/effect-ts/core/blob/main/src/function.ts
 *
 * The original versions are licensed under the MIT license.
 * This version is licensed under the MIT license.
 */

// biome-ignore lint/suspicious/noExplicitAny: any is used to allow any argument to be passed in
type AnyFunction = (...args: Array<any>) => any

export const dual: {
  <DataLast extends AnyFunction, DataFirst extends AnyFunction>(
    arity: Parameters<DataFirst>['length'],
    body: DataFirst,
  ): DataLast & DataFirst
  <DataLast extends AnyFunction, DataFirst extends AnyFunction>(
    isDataFirst: (args: IArguments) => boolean,
    body: DataFirst,
  ): DataLast & DataFirst
} = (arity, body) => {
  if (typeof arity === 'function') {
    return function (...args: Array<unknown>) {
      if (arity(args as unknown as IArguments)) {
        // @ts-expect-error
        return body.apply(this, args)
      }
      // biome-ignore lint/suspicious/noExplicitAny: any is used to allow any argument to be passed in
      return ((self: any) => body(self, ...args)) as any
    }
  }

  switch (arity) {
    case 0:
    case 1:
      throw new RangeError(`Invalid arity ${arity}`)

    case 2:
      return (...args: Array<unknown>) => {
        const [a, b] = args
        if (args.length >= 2) {
          return body(a, b)
        }
        return (self: unknown) => body(self, a)
      }

    case 3:
      return (...args: Array<unknown>) => {
        const [a, b, c] = args
        if (args.length >= 3) {
          return body(a, b, c)
        }
        return (self: unknown) => body(self, a, b)
      }

    case 4:
      return (...args: Array<unknown>) => {
        const [a, b, c, d] = args
        if (args.length >= 4) {
          return body(a, b, c, d)
        }

        return (self: unknown) => body(self, a, b, c)
      }

    case 5:
      return (...args: Array<unknown>) => {
        const [a, b, c, d, e] = args
        if (args.length >= 5) {
          return body(a, b, c, d, e)
        }

        return (self: unknown) => body(self, a, b, c, d)
      }

    default:
      return function (...args: Array<unknown>) {
        if (args.length >= arity) {
          // @ts-expect-error
          return body.apply(this, args)
        }
        return (self: unknown) => body(self, ...args)
      }
  }
}

export function pipe<A>(a: A): A
export function pipe<A, B = never>(a: A, ab: (a: A) => B): B
export function pipe<A, B = never, C = never>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
): C
export function pipe<A, B = never, C = never, D = never>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
): D
export function pipe<A, B = never, C = never, D = never, E = never>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
): E
export function pipe<A, B = never, C = never, D = never, E = never, F = never>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
): F
export function pipe<
  A,
  B = never,
  C = never,
  D = never,
  E = never,
  F = never,
  G = never,
>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
): G
export function pipe<
  A,
  B = never,
  C = never,
  D = never,
  E = never,
  F = never,
  G = never,
  H = never,
>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
): H
export function pipe<
  A,
  B = never,
  C = never,
  D = never,
  E = never,
  F = never,
  G = never,
  H = never,
  I = never,
>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
): I
export function pipe<
  A,
  B = never,
  C = never,
  D = never,
  E = never,
  F = never,
  G = never,
  H = never,
  I = never,
  J = never,
>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
  ij: (i: I) => J,
): J
export function pipe<
  A,
  B = never,
  C = never,
  D = never,
  E = never,
  F = never,
  G = never,
  H = never,
  I = never,
  J = never,
  K = never,
>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
  ij: (i: I) => J,
  jk: (j: J) => K,
): K
export function pipe<
  A,
  B = never,
  C = never,
  D = never,
  E = never,
  F = never,
  G = never,
  H = never,
  I = never,
  J = never,
  K = never,
  L = never,
>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
  ij: (i: I) => J,
  jk: (j: J) => K,
  kl: (k: K) => L,
): L
export function pipe<
  A,
  B = never,
  C = never,
  D = never,
  E = never,
  F = never,
  G = never,
  H = never,
  I = never,
  J = never,
  K = never,
  L = never,
  M = never,
>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
  ij: (i: I) => J,
  jk: (j: J) => K,
  kl: (k: K) => L,
  lm: (l: L) => M,
): M
export function pipe<
  A,
  B = never,
  C = never,
  D = never,
  E = never,
  F = never,
  G = never,
  H = never,
  I = never,
  J = never,
  K = never,
  L = never,
  M = never,
  N = never,
>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
  ij: (i: I) => J,
  jk: (j: J) => K,
  kl: (k: K) => L,
  lm: (l: L) => M,
  mn: (m: M) => N,
): N
export function pipe<
  A,
  B = never,
  C = never,
  D = never,
  E = never,
  F = never,
  G = never,
  H = never,
  I = never,
  J = never,
  K = never,
  L = never,
  M = never,
  N = never,
  O = never,
>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
  ij: (i: I) => J,
  jk: (j: J) => K,
  kl: (k: K) => L,
  lm: (l: L) => M,
  mn: (m: M) => N,
  no: (n: N) => O,
): O
export function pipe<
  A,
  B = never,
  C = never,
  D = never,
  E = never,
  F = never,
  G = never,
  H = never,
  I = never,
  J = never,
  K = never,
  L = never,
  M = never,
  N = never,
  O = never,
  P = never,
>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
  ij: (i: I) => J,
  jk: (j: J) => K,
  kl: (k: K) => L,
  lm: (l: L) => M,
  mn: (m: M) => N,
  no: (n: N) => O,
  op: (o: O) => P,
): P
export function pipe<
  A,
  B = never,
  C = never,
  D = never,
  E = never,
  F = never,
  G = never,
  H = never,
  I = never,
  J = never,
  K = never,
  L = never,
  M = never,
  N = never,
  O = never,
  P = never,
  Q = never,
>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
  ij: (i: I) => J,
  jk: (j: J) => K,
  kl: (k: K) => L,
  lm: (l: L) => M,
  mn: (m: M) => N,
  no: (n: N) => O,
  op: (o: O) => P,
  pq: (p: P) => Q,
): Q
export function pipe<
  A,
  B = never,
  C = never,
  D = never,
  E = never,
  F = never,
  G = never,
  H = never,
  I = never,
  J = never,
  K = never,
  L = never,
  M = never,
  N = never,
  O = never,
  P = never,
  Q = never,
  R = never,
>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
  ij: (i: I) => J,
  jk: (j: J) => K,
  kl: (k: K) => L,
  lm: (l: L) => M,
  mn: (m: M) => N,
  no: (n: N) => O,
  op: (o: O) => P,
  pq: (p: P) => Q,
  qr: (q: Q) => R,
): R
export function pipe<
  A,
  B = never,
  C = never,
  D = never,
  E = never,
  F = never,
  G = never,
  H = never,
  I = never,
  J = never,
  K = never,
  L = never,
  M = never,
  N = never,
  O = never,
  P = never,
  Q = never,
  R = never,
  S = never,
>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
  ij: (i: I) => J,
  jk: (j: J) => K,
  kl: (k: K) => L,
  lm: (l: L) => M,
  mn: (m: M) => N,
  no: (n: N) => O,
  op: (o: O) => P,
  pq: (p: P) => Q,
  qr: (q: Q) => R,
  rs: (r: R) => S,
): S
export function pipe<
  A,
  B = never,
  C = never,
  D = never,
  E = never,
  F = never,
  G = never,
  H = never,
  I = never,
  J = never,
  K = never,
  L = never,
  M = never,
  N = never,
  O = never,
  P = never,
  Q = never,
  R = never,
  S = never,
  T = never,
>(
  a: A,
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D,
  de: (d: D) => E,
  ef: (e: E) => F,
  fg: (f: F) => G,
  gh: (g: G) => H,
  hi: (h: H) => I,
  ij: (i: I) => J,
  jk: (j: J) => K,
  kl: (k: K) => L,
  lm: (l: L) => M,
  mn: (m: M) => N,
  no: (n: N) => O,
  op: (o: O) => P,
  pq: (p: P) => Q,
  qr: (q: Q) => R,
  rs: (r: R) => S,
  st: (s: S) => T,
): T
export function pipe(...args: [unknown, ...Array<AnyFunction>]): unknown {
  const [a, ab, bc, cd, de, ef, fg, gh, hi] = args as [
    unknown,
    AnyFunction,
    AnyFunction,
    AnyFunction,
    AnyFunction,
    AnyFunction,
    AnyFunction,
    AnyFunction,
    AnyFunction,
  ]

  switch (args.length) {
    case 1:
      return a
    case 2:
      return ab(a)
    case 3:
      return bc(ab(a))
    case 4:
      return cd(bc(ab(a)))
    case 5:
      return de(cd(bc(ab(a))))
    case 6:
      return ef(de(cd(bc(ab(a)))))
    case 7:
      return fg(ef(de(cd(bc(ab(a))))))
    case 8:
      return gh(fg(ef(de(cd(bc(ab(a)))))))
    case 9:
      return hi(gh(fg(ef(de(cd(bc(ab(a))))))))
    default: {
      let ret = args[0]
      for (let i = 1; i < args.length; i++) {
        ret = (args[i] as AnyFunction)(ret)
      }
      return ret
    }
  }
}

export class Pipeable {
  pipe<A>(this: A): A
  pipe<A, B = never>(this: A, ab: (_: A) => B): B
  pipe<A, B = never, C = never>(this: A, ab: (_: A) => B, bc: (_: B) => C): C
  pipe<A, B = never, C = never, D = never>(
    this: A,
    ab: (_: A) => B,
    bc: (_: B) => C,
    cd: (_: C) => D,
  ): D
  pipe<A, B = never, C = never, D = never, E = never>(
    this: A,
    ab: (_: A) => B,
    bc: (_: B) => C,
    cd: (_: C) => D,
    de: (_: D) => E,
  ): E
  pipe<A, B = never, C = never, D = never, E = never, F = never>(
    this: A,
    ab: (_: A) => B,
    bc: (_: B) => C,
    cd: (_: C) => D,
    de: (_: D) => E,
    ef: (_: E) => F,
  ): F
  pipe<A, B = never, C = never, D = never, E = never, F = never, G = never>(
    this: A,
    ab: (_: A) => B,
    bc: (_: B) => C,
    cd: (_: C) => D,
    de: (_: D) => E,
    ef: (_: E) => F,
    fg: (_: F) => G,
  ): G
  pipe<
    A,
    B = never,
    C = never,
    D = never,
    E = never,
    F = never,
    G = never,
    H = never,
  >(
    this: A,
    ab: (_: A) => B,
    bc: (_: B) => C,
    cd: (_: C) => D,
    de: (_: D) => E,
    ef: (_: E) => F,
    fg: (_: F) => G,
    gh: (_: G) => H,
  ): H
  pipe<
    A,
    B = never,
    C = never,
    D = never,
    E = never,
    F = never,
    G = never,
    H = never,
    I = never,
  >(
    this: A,
    ab: (_: A) => B,
    bc: (_: B) => C,
    cd: (_: C) => D,
    de: (_: D) => E,
    ef: (_: E) => F,
    fg: (_: F) => G,
    gh: (_: G) => H,
    hi: (_: H) => I,
  ): I
  pipe<
    A,
    B = never,
    C = never,
    D = never,
    E = never,
    F = never,
    G = never,
    H = never,
    I = never,
    J = never,
  >(
    this: A,
    ab: (_: A) => B,
    bc: (_: B) => C,
    cd: (_: C) => D,
    de: (_: D) => E,
    ef: (_: E) => F,
    fg: (_: F) => G,
    gh: (_: G) => H,
    hi: (_: H) => I,
    ij: (_: I) => J,
  ): J
  pipe<
    A,
    B = never,
    C = never,
    D = never,
    E = never,
    F = never,
    G = never,
    H = never,
    I = never,
    J = never,
    K = never,
  >(
    this: A,
    ab: (_: A) => B,
    bc: (_: B) => C,
    cd: (_: C) => D,
    de: (_: D) => E,
    ef: (_: E) => F,
    fg: (_: F) => G,
    gh: (_: G) => H,
    hi: (_: H) => I,
    ij: (_: I) => J,
    jk: (_: J) => K,
  ): K
  pipe<
    A,
    B = never,
    C = never,
    D = never,
    E = never,
    F = never,
    G = never,
    H = never,
    I = never,
    J = never,
    K = never,
    L = never,
  >(
    this: A,
    ab: (_: A) => B,
    bc: (_: B) => C,
    cd: (_: C) => D,
    de: (_: D) => E,
    ef: (_: E) => F,
    fg: (_: F) => G,
    gh: (_: G) => H,
    hi: (_: H) => I,
    ij: (_: I) => J,
    jk: (_: J) => K,
    kl: (_: K) => L,
  ): L
  pipe<
    A,
    B = never,
    C = never,
    D = never,
    E = never,
    F = never,
    G = never,
    H = never,
    I = never,
    J = never,
    K = never,
    L = never,
    M = never,
  >(
    this: A,
    ab: (_: A) => B,
    bc: (_: B) => C,
    cd: (_: C) => D,
    de: (_: D) => E,
    ef: (_: E) => F,
    fg: (_: F) => G,
    gh: (_: G) => H,
    hi: (_: H) => I,
    ij: (_: I) => J,
    jk: (_: J) => K,
    kl: (_: K) => L,
    lm: (_: L) => M,
  ): M
  pipe<
    A,
    B = never,
    C = never,
    D = never,
    E = never,
    F = never,
    G = never,
    H = never,
    I = never,
    J = never,
    K = never,
    L = never,
    M = never,
    N = never,
  >(
    this: A,
    ab: (_: A) => B,
    bc: (_: B) => C,
    cd: (_: C) => D,
    de: (_: D) => E,
    ef: (_: E) => F,
    fg: (_: F) => G,
    gh: (_: G) => H,
    hi: (_: H) => I,
    ij: (_: I) => J,
    jk: (_: J) => K,
    kl: (_: K) => L,
    lm: (_: L) => M,
    mn: (_: M) => N,
  ): N
  pipe<
    A,
    B = never,
    C = never,
    D = never,
    E = never,
    F = never,
    G = never,
    H = never,
    I = never,
    J = never,
    K = never,
    L = never,
    M = never,
    N = never,
    O = never,
  >(
    this: A,
    ab: (_: A) => B,
    bc: (_: B) => C,
    cd: (_: C) => D,
    de: (_: D) => E,
    ef: (_: E) => F,
    fg: (_: F) => G,
    gh: (_: G) => H,
    hi: (_: H) => I,
    ij: (_: I) => J,
    jk: (_: J) => K,
    kl: (_: K) => L,
    lm: (_: L) => M,
    mn: (_: M) => N,
    no: (_: N) => O,
  ): O
  pipe<
    A,
    B = never,
    C = never,
    D = never,
    E = never,
    F = never,
    G = never,
    H = never,
    I = never,
    J = never,
    K = never,
    L = never,
    M = never,
    N = never,
    O = never,
    P = never,
  >(
    this: A,
    ab: (_: A) => B,
    bc: (_: B) => C,
    cd: (_: C) => D,
    de: (_: D) => E,
    ef: (_: E) => F,
    fg: (_: F) => G,
    gh: (_: G) => H,
    hi: (_: H) => I,
    ij: (_: I) => J,
    jk: (_: J) => K,
    kl: (_: K) => L,
    lm: (_: L) => M,
    mn: (_: M) => N,
    no: (_: N) => O,
    op: (_: O) => P,
  ): P
  pipe<
    A,
    B = never,
    C = never,
    D = never,
    E = never,
    F = never,
    G = never,
    H = never,
    I = never,
    J = never,
    K = never,
    L = never,
    M = never,
    N = never,
    O = never,
    P = never,
    Q = never,
  >(
    this: A,
    ab: (_: A) => B,
    bc: (_: B) => C,
    cd: (_: C) => D,
    de: (_: D) => E,
    ef: (_: E) => F,
    fg: (_: F) => G,
    gh: (_: G) => H,
    hi: (_: H) => I,
    ij: (_: I) => J,
    jk: (_: J) => K,
    kl: (_: K) => L,
    lm: (_: L) => M,
    mn: (_: M) => N,
    no: (_: N) => O,
    op: (_: O) => P,
    pq: (_: P) => Q,
  ): Q
  pipe<
    A,
    B = never,
    C = never,
    D = never,
    E = never,
    F = never,
    G = never,
    H = never,
    I = never,
    J = never,
    K = never,
    L = never,
    M = never,
    N = never,
    O = never,
    P = never,
    Q = never,
    R = never,
  >(
    this: A,
    ab: (_: A) => B,
    bc: (_: B) => C,
    cd: (_: C) => D,
    de: (_: D) => E,
    ef: (_: E) => F,
    fg: (_: F) => G,
    gh: (_: G) => H,
    hi: (_: H) => I,
    ij: (_: I) => J,
    jk: (_: J) => K,
    kl: (_: K) => L,
    lm: (_: L) => M,
    mn: (_: M) => N,
    no: (_: N) => O,
    op: (_: O) => P,
    pq: (_: P) => Q,
    qr: (_: Q) => R,
  ): R
  pipe<
    A,
    B = never,
    C = never,
    D = never,
    E = never,
    F = never,
    G = never,
    H = never,
    I = never,
    J = never,
    K = never,
    L = never,
    M = never,
    N = never,
    O = never,
    P = never,
    Q = never,
    R = never,
    S = never,
  >(
    this: A,
    ab: (_: A) => B,
    bc: (_: B) => C,
    cd: (_: C) => D,
    de: (_: D) => E,
    ef: (_: E) => F,
    fg: (_: F) => G,
    gh: (_: G) => H,
    hi: (_: H) => I,
    ij: (_: I) => J,
    jk: (_: J) => K,
    kl: (_: K) => L,
    lm: (_: L) => M,
    mn: (_: M) => N,
    no: (_: N) => O,
    op: (_: O) => P,
    pq: (_: P) => Q,
    qr: (_: Q) => R,
    rs: (_: R) => S,
  ): S
  pipe<
    A,
    B = never,
    C = never,
    D = never,
    E = never,
    F = never,
    G = never,
    H = never,
    I = never,
    J = never,
    K = never,
    L = never,
    M = never,
    N = never,
    O = never,
    P = never,
    Q = never,
    R = never,
    S = never,
    T = never,
  >(
    this: A,
    ab: (_: A) => B,
    bc: (_: B) => C,
    cd: (_: C) => D,
    de: (_: D) => E,
    ef: (_: E) => F,
    fg: (_: F) => G,
    gh: (_: G) => H,
    hi: (_: H) => I,
    ij: (_: I) => J,
    jk: (_: J) => K,
    kl: (_: K) => L,
    lm: (_: L) => M,
    mn: (_: M) => N,
    no: (_: N) => O,
    op: (_: O) => P,
    pq: (_: P) => Q,
    qr: (_: Q) => R,
    rs: (_: R) => S,
    st: (_: S) => T,
  ): T
  pipe<
    A,
    B = never,
    C = never,
    D = never,
    E = never,
    F = never,
    G = never,
    H = never,
    I = never,
    J = never,
    K = never,
    L = never,
    M = never,
    N = never,
    O = never,
    P = never,
    Q = never,
    R = never,
    S = never,
    T = never,
    U = never,
  >(
    this: A,
    ab: (_: A) => B,
    bc: (_: B) => C,
    cd: (_: C) => D,
    de: (_: D) => E,
    ef: (_: E) => F,
    fg: (_: F) => G,
    gh: (_: G) => H,
    hi: (_: H) => I,
    ij: (_: I) => J,
    jk: (_: J) => K,
    kl: (_: K) => L,
    lm: (_: L) => M,
    mn: (_: M) => N,
    no: (_: N) => O,
    op: (_: O) => P,
    pq: (_: P) => Q,
    qr: (_: Q) => R,
    rs: (_: R) => S,
    st: (_: S) => T,
    tu: (_: T) => U,
  ): U
  pipe<
    A,
    B = never,
    C = never,
    D = never,
    E = never,
    F = never,
    G = never,
    H = never,
    I = never,
    J = never,
    K = never,
    L = never,
    M = never,
    N = never,
    O = never,
    P = never,
    Q = never,
    R = never,
    S = never,
    T = never,
    U = never,
  >(
    this: A,
    ab: (_: A) => B,
    bc: (_: B) => C,
    cd: (_: C) => D,
    de: (_: D) => E,
    ef: (_: E) => F,
    fg: (_: F) => G,
    gh: (_: G) => H,
    hi: (_: H) => I,
    ij: (_: I) => J,
    jk: (_: J) => K,
    kl: (_: K) => L,
    lm: (_: L) => M,
    mn: (_: M) => N,
    no: (_: N) => O,
    op: (_: O) => P,
    pq: (_: P) => Q,
    qr: (_: Q) => R,
    rs: (_: R) => S,
    st: (_: S) => T,
    tu: (_: T) => U,
  ): U
  pipe(...args: Array<AnyFunction>) {
    // the assertion is probably wrong but makes typescript let us spread the args into pipe()
    return pipe(this, ...(args as [AnyFunction]))
  }
}
