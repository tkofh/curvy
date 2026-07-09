import type { Bounds, Closed, Interval, Open, OpenEnd, OpenStart } from './interval.ts'
import { dual, Pipeable } from '../utils.ts'
import { EPSILON, coincident } from '../number.ts'

const TypeId: unique symbol = Symbol.for('curvy/interval')
type TypeId = typeof TypeId

abstract class IntervalImpl extends Pipeable {
  readonly [TypeId]: TypeId = TypeId

  abstract readonly kind: 'closed' | 'open-start' | 'open-end' | 'open'

  readonly start: number
  readonly end: number

  constructor(start: number, end: number) {
    super()

    if (end < start) {
      throw new Error('Interval end must be greater than or equal to start')
    }

    this.start = start
    this.end = end
  }

  get [Symbol.toStringTag]() {
    const open = this.kind === 'open-start' || this.kind === 'open' ? '(' : '['
    const close = this.kind === 'open-end' || this.kind === 'open' ? ')' : ']'
    return `Interval ${open}${this.start}, ${this.end}${close}`
  }

  get [Symbol.for('nodejs.util.inspect.custom')]() {
    return this[Symbol.toStringTag]
  }
}

class ClosedImpl extends IntervalImpl implements Closed {
  readonly kind = 'closed' as const
}

class OpenStartImpl extends IntervalImpl implements OpenStart {
  readonly kind = 'open-start' as const
}

class OpenEndImpl extends IntervalImpl implements OpenEnd {
  readonly kind = 'open-end' as const
}

class OpenImpl extends IntervalImpl implements Open {
  readonly kind = 'open' as const
}

/** @internal */
export const isInterval = (v: unknown): v is Interval =>
  typeof v === 'object' && v !== null && TypeId in v

/** @internal */
export const equals = dual<
  (b: Interval) => (a: Interval) => boolean,
  (a: Interval, b: Interval) => boolean
>(
  2,
  (a: Interval, b: Interval) =>
    a.kind === b.kind && coincident(a.start, b.start) && coincident(a.end, b.end),
)

/** @internal */
export const aligned = dual<
  (b: Bounds) => (a: Bounds) => boolean,
  (a: Bounds, b: Bounds) => boolean
>(2, (a: Bounds, b: Bounds) => coincident(a.start, b.start) && coincident(a.end, b.end))

/** @internal */
export const make = (start: number, end?: number): Closed => new ClosedImpl(start, end ?? start)

/** @internal */
export const makeOpenStart = (start: number, end?: number): OpenStart =>
  new OpenStartImpl(start, end ?? start)

/** @internal */
export const makeOpenEnd = (start: number, end?: number): OpenEnd =>
  new OpenEndImpl(start, end ?? start)

/** @internal */
export const makeOpen = (start: number, end?: number): Open => new OpenImpl(start, end ?? start)

/** @internal */
export const fromSize = (a: number, b?: number): Closed => {
  if (b === undefined) {
    return new ClosedImpl(0, a)
  }
  return new ClosedImpl(a, a + b)
}

/** @internal */
export const fromMinMax = (...values: ReadonlyArray<number>): Closed =>
  new ClosedImpl(Math.min(...values), Math.max(...values))

/** @internal */
export const size = (i: Bounds): number => Math.abs(i.end - i.start)

/** @internal */
export const contains = dual<
  (value: number) => (interval: Interval) => boolean,
  (interval: Interval, value: number) => boolean
>(2, (interval: Interval, value: number): boolean => {
  switch (interval.kind) {
    case 'closed':
      return value >= interval.start && value <= interval.end
    case 'open-start':
      return value > interval.start && value <= interval.end
    case 'open-end':
      return value >= interval.start && value < interval.end
    case 'open':
      return value > interval.start && value < interval.end
  }
})

// Approximate containment: value is in the interval *or* within eps of either
// boundary. Endpoint inclusivity is ignored — at the EPSILON scale the
// open/closed distinction loses meaning, and the use case is float-tolerant
// containment checks (e.g. "is this query in the segment's range?"). Use
// `contains` if you need kind-strict semantics.
/** @internal */
export const containsApprox = (interval: Interval, value: number, eps = EPSILON): boolean =>
  value >= interval.start - eps && value <= interval.end + eps

const includesStart = (i: Interval): boolean => i.kind === 'closed' || i.kind === 'open-end'
const includesEnd = (i: Interval): boolean => i.kind === 'closed' || i.kind === 'open-start'

// Whether `outer` is a superset of `inner`. For each endpoint pair (start/start
// and end/end), the inner endpoint must be inside outer; when the endpoints
// are numerically equal, the outer must include that boundary or the inner
// must exclude it. Both shapes (closed-on-closed, open-on-open with matched
// endpoints, etc.) are handled by this kind-aware comparison.
/** @internal */
export const containsInterval = dual<
  (inner: Interval) => (outer: Interval) => boolean,
  (outer: Interval, inner: Interval) => boolean
>(2, (outer: Interval, inner: Interval): boolean => {
  const outerStart = includesStart(outer)
  const innerStart = includesStart(inner)
  const outerEnd = includesEnd(outer)
  const innerEnd = includesEnd(inner)

  const startOk =
    inner.start > outer.start || (inner.start === outer.start && (outerStart || !innerStart))
  const endOk = inner.end < outer.end || (inner.end === outer.end && (outerEnd || !innerEnd))

  return startOk && endOk
})

// Smallest interval enclosing both inputs. Each endpoint of the result is the
// extremum of (a.start, b.start) / (a.end, b.end), and its inclusivity follows
// whichever input contributed it. When endpoints tie, the result is closed at
// that point if EITHER input includes it.
/** @internal */
export const union = dual<
  (b: Interval) => (a: Interval) => Interval,
  (a: Interval, b: Interval) => Interval
>(2, (a: Interval, b: Interval): Interval => {
  let startVal: number
  let startInc: boolean
  if (a.start < b.start) {
    startVal = a.start
    startInc = includesStart(a)
  } else if (a.start > b.start) {
    startVal = b.start
    startInc = includesStart(b)
  } else {
    startVal = a.start
    startInc = includesStart(a) || includesStart(b)
  }

  let endVal: number
  let endInc: boolean
  if (a.end > b.end) {
    endVal = a.end
    endInc = includesEnd(a)
  } else if (a.end < b.end) {
    endVal = b.end
    endInc = includesEnd(b)
  } else {
    endVal = a.end
    endInc = includesEnd(a) || includesEnd(b)
  }

  if (startInc && endInc) {
    return make(startVal, endVal)
  }
  if (!startInc && endInc) {
    return makeOpenStart(startVal, endVal)
  }
  if (startInc && !endInc) {
    return makeOpenEnd(startVal, endVal)
  }
  return makeOpen(startVal, endVal)
})

/** @internal */
export const filter = dual<
  <V extends ReadonlyArray<number>>(value: V) => (interval: Interval) => V,
  <V extends ReadonlyArray<number>>(interval: Interval, value: V) => V
>(
  2,
  <V extends ReadonlyArray<number>>(interval: Interval, value: V): V =>
    value.filter((v) => contains(interval, v)) as unknown as V,
)

/** @internal */
export const clamp = dual<
  <V extends number | ReadonlyArray<number>>(value: V) => (interval: Bounds) => V,
  <V extends number | ReadonlyArray<number>>(interval: Bounds, value: V) => V
>(2, <V extends number | ReadonlyArray<number>>(interval: Bounds, value: V): V => {
  if (Array.isArray(value)) {
    return value.map((v) => clamp(interval, v)) as unknown as V
  }
  const v = value as number
  if (v < interval.start) {
    return interval.start as V
  }
  if (v > interval.end) {
    return interval.end as V
  }
  return v as V
})

/** @internal */
export const toStartOpen = ((i: Interval): OpenStart | Open => {
  switch (i.kind) {
    case 'closed':
      return new OpenStartImpl(i.start, i.end)
    case 'open-end':
      return new OpenImpl(i.start, i.end)
    case 'open-start':
    case 'open':
      return i
  }
}) as {
  (i: Closed | OpenStart): OpenStart
  (i: OpenEnd | Open): Open
}

/** @internal */
export const toStartClosed = ((i: Interval): Closed | OpenEnd => {
  switch (i.kind) {
    case 'open-start':
      return new ClosedImpl(i.start, i.end)
    case 'open':
      return new OpenEndImpl(i.start, i.end)
    case 'closed':
    case 'open-end':
      return i
  }
}) as {
  (i: Closed | OpenEnd): Closed
  (i: OpenStart | Open): OpenEnd
}

/** @internal */
export const toEndOpen = ((i: Interval): OpenEnd | Open => {
  switch (i.kind) {
    case 'closed':
      return new OpenEndImpl(i.start, i.end)
    case 'open-start':
      return new OpenImpl(i.start, i.end)
    case 'open-end':
    case 'open':
      return i
  }
}) as {
  (i: Closed | OpenEnd): OpenEnd
  (i: OpenStart | Open): Open
}

/** @internal */
export const toEndClosed = ((i: Interval): Closed | OpenStart => {
  switch (i.kind) {
    case 'open-end':
      return new ClosedImpl(i.start, i.end)
    case 'open':
      return new OpenStartImpl(i.start, i.end)
    case 'closed':
    case 'open-start':
      return i
  }
}) as {
  (i: Closed | OpenEnd): Closed
  (i: OpenStart | Open): OpenStart
}

/** @internal */
export const toClosed = (i: Interval): Closed => {
  if (i.kind === 'closed') {
    return i
  }
  return new ClosedImpl(i.start, i.end)
}

/** @internal */
export const toOpen = (i: Interval): Open => {
  if (i.kind === 'open') {
    return i
  }
  return new OpenImpl(i.start, i.end)
}

/** @internal */
export const isClosed = (i: Interval): i is Closed => i.kind === 'closed'
/** @internal */
export const isOpen = (i: Interval): i is Open => i.kind === 'open'
/** @internal */
export const isOpenStart = (i: Interval): i is OpenStart => i.kind === 'open-start'
/** @internal */
export const isOpenEnd = (i: Interval): i is OpenEnd => i.kind === 'open-end'

/** @internal */
export const isOpenAtStart = (i: Interval): i is OpenStart | Open =>
  i.kind === 'open-start' || i.kind === 'open'
/** @internal */
export const isOpenAtEnd = (i: Interval): i is OpenEnd | Open =>
  i.kind === 'open-end' || i.kind === 'open'
/** @internal */
export const isClosedAtStart = (i: Interval): i is Closed | OpenEnd =>
  i.kind === 'closed' || i.kind === 'open-end'
/** @internal */
export const isClosedAtEnd = (i: Interval): i is Closed | OpenStart =>
  i.kind === 'closed' || i.kind === 'open-start'

/** @internal */
export const unit: Closed = make(0, 1)

/** @internal */
export const unitOpen: Open = new OpenImpl(0, 1)

/** @internal */
export const biunit: Closed = make(-1, 1)

/** @internal */
export const lerp = (interval: Bounds, t: number): number =>
  (1 - t) * interval.start + t * interval.end

/** @internal */
export const toLerpFn =
  (interval: Bounds) =>
  (t: number): number =>
    lerp(interval, t)

/** @internal */
export const normalize = (interval: Bounds, x: number): number =>
  (x - interval.start) / size(interval)

/** @internal */
export const toNormalizeFn =
  (interval: Bounds) =>
  (x: number): number =>
    normalize(interval, x)

/** @internal */
export const remap = (source: Bounds, target: Bounds, x: number): number =>
  target.start + ((x - source.start) * size(target)) / size(source)

/** @internal */
export const toRemapFn =
  (source: Bounds, target: Bounds) =>
  (x: number): number =>
    remap(source, target, x)

/** @internal */
export const scaleShift = (source: Bounds, target: Bounds) => {
  const scale = size(target) / size(source)

  return {
    scale,
    shift: target.start - source.start * scale,
  }
}
