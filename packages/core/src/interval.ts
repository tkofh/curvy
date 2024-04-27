export type Interval = readonly [number, number]

export type Node = {
  interval: Interval
  left: Node | null
  right: Node | null
}

export type IntervalTree = {
  root: Node
  search: (query: number) => Interval | null
}

type TakeCenterIntervalResult = {
  center: Interval
  left: Array<number> | null
  right: Array<number> | null
}

function createNode(interval: Interval): Node {
  const node = Object.create(null)
  node.interval = interval
  node.left = null
  node.right = null
  return node
}

export function takeCenterInterval(
  boundaries: Array<number>,
): TakeCenterIntervalResult {
  const mid = Math.floor((boundaries.length - 1) / 2)
  const left = mid > 0 ? boundaries.slice(0, mid + 1) : null
  const right =
    mid + 1 < boundaries.length - 1 ? boundaries.slice(mid + 1) : null

  return {
    center: [boundaries[mid] as number, boundaries[mid + 1] as number],
    left,
    right,
  }
}

export function createIntervalTree(boundaries: Array<number>): IntervalTree {
  // fake node to make recursion less annoying
  const container = createNode([0, 0])

  const branches: Array<{
    parent: Node
    direction: 'left' | 'right'
    boundaries: Array<number>
  }> = [{ parent: container, direction: 'left', boundaries }]

  for (const branch of branches) {
    const { parent, direction, boundaries } = branch

    const { center, left, right } = takeCenterInterval(boundaries)

    const node = createNode(center)

    if (direction === 'left') {
      parent.left = node
    } else {
      parent.right = node
    }

    if (left !== null) {
      branches.push({ parent: node, direction: 'left', boundaries: left })
    }
    if (right !== null) {
      branches.push({ parent: node, direction: 'right', boundaries: right })
    }
  }

  const root = container.left as Node

  function searchNode(node: Node, query: number): Interval | null {
    if (node.interval[0] <= query && node.interval[1] >= query) {
      return node.interval
    }

    if (node.interval[0] > query && node.left) {
      return searchNode(node.left, query)
    }

    if (node.interval[1] < query && node.right) {
      return searchNode(node.right, query)
    }

    return null
  }

  function search(query: number) {
    return searchNode(root, query)
  }

  return {
    root,
    search,
  }
}
