import type { Pipeable } from './internal/pipeable'
import * as internal from './interval.internal'
export interface Interval extends Pipeable {
  readonly start: number
  readonly startInclusive: boolean
  readonly end: number
  readonly endInclusive: boolean
  readonly precision: number
}

export const isInterval: (v: unknown) => v is Interval = internal.isInterval

export const make: {
  (point: number): Interval
  (start: number, end: number): Interval
  (start: number, end: number, precision: number): Interval
} = internal.make

export const makeExclusive: {
  (point: number): Interval
  (start: number, end: number): Interval
  (start: number, end: number, precision: number): Interval
} = internal.makeExclusive

export const makeStartExclusive: {
  (point: number): Interval
  (start: number, end: number): Interval
  (start: number, end: number, precision: number): Interval
} = internal.makeStartExclusive

export const makeEndExclusive: {
  (point: number): Interval
  (start: number, end: number): Interval
  (start: number, end: number, precision: number): Interval
} = internal.makeEndExclusive

export const size: (i: Interval) => number = internal.size

export const min: (i: Interval) => number = internal.min

export const max: (i: Interval) => number = internal.max

export const filter: {
  <V extends ReadonlyArray<number>>(interval: Interval, value: V): V
  <V extends ReadonlyArray<number>>(value: V): (interval: Interval) => V
} = internal.filter

export const clamp: {
  (interval: Interval, value: number): number
  (value: number): (interval: Interval) => number
  (interval: Interval, value: ReadonlyArray<number>): ReadonlyArray<number>
  (value: ReadonlyArray<number>): (interval: Interval) => ReadonlyArray<number>
} = internal.clamp

export const unit: Interval = internal.unit

export const startInclusive: (interval: Interval) => Interval =
  internal.startInclusive

export const endInclusive: (interval: Interval) => Interval =
  internal.endInclusive

export const startExclusive: (interval: Interval) => Interval =
  internal.startExclusive

export const endExclusive: (interval: Interval) => Interval =
  internal.endExclusive

// export type Interval = readonly [number, number]
//
// export type Node = {
//   interval: Interval
//   left: Node | null
//   right: Node | null
// }
//
// export type IntervalTree = {
//   root: Node
//   search: (query: number) => Interval | null
// }
//
// type TakeCenterIntervalResult = {
//   center: Interval
//   left: Array<number> | null
//   right: Array<number> | null
// }
//
// function createNode(interval: Interval): Node {
//   const node = Object.create(null)
//   node.interval = interval
//   node.left = null
//   node.right = null
//   return node
// }
//
// export function takeCenterInterval(
//   boundaries: Array<number>,
// ): TakeCenterIntervalResult {
//   const mid = Math.floor((boundaries.length - 1) / 2)
//   const left = mid > 0 ? boundaries.slice(0, mid + 1) : null
//   const right =
//     mid + 1 < boundaries.length - 1 ? boundaries.slice(mid + 1) : null
//
//   return {
//     center: [boundaries[mid] as number, boundaries[mid + 1] as number],
//     left,
//     right,
//   }
// }
//
// export function createIntervalTree(boundaries: Array<number>): IntervalTree {
//   // fake node to make recursion less annoying
//   const container = createNode([0, 0])
//
//   const branches: Array<{
//     parent: Node
//     direction: 'left' | 'right'
//     boundaries: Array<number>
//   }> = [{ parent: container, direction: 'left', boundaries }]
//
//   for (const branch of branches) {
//     const { parent, direction, boundaries } = branch
//
//     const { center, left, right } = takeCenterInterval(boundaries)
//
//     const node = createNode(center)
//
//     if (direction === 'left') {
//       parent.left = node
//     } else {
//       parent.right = node
//     }
//
//     if (left !== null) {
//       branches.push({ parent: node, direction: 'left', boundaries: left })
//     }
//     if (right !== null) {
//       branches.push({ parent: node, direction: 'right', boundaries: right })
//     }
//   }
//
//   const root = container.left as Node
//
//   function searchNode(node: Node, query: number): Interval | null {
//     if (node.interval[0] <= query && node.interval[1] >= query) {
//       return node.interval
//     }
//
//     if (node.interval[0] > query && node.left) {
//       return searchNode(node.left, query)
//     }
//
//     if (node.interval[1] < query && node.right) {
//       return searchNode(node.right, query)
//     }
//
//     return null
//   }
//
//   function search(query: number) {
//     return searchNode(root, query)
//   }
//
//   return {
//     root,
//     search,
//   }
// }
