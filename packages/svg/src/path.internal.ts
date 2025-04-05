import { Pipeable } from 'curvy/pipe'
import type * as Bezier2d from 'curvy/splines/bezier2d'
import type * as Vector2 from 'curvy/vector2'
import type { Path } from './path'

export const PathTypeId: unique symbol = Symbol.for('@curvy/svg/path')
export type PathTypeId = typeof PathTypeId

export class PathImpl extends Pipeable {
  readonly [PathTypeId]: PathTypeId = PathTypeId

  readonly commands: ReadonlyArray<PathCommand>

  constructor(commands: ReadonlyArray<PathCommand>) {
    super()
    this.commands = commands
  }
}

interface MoveCommand {
  type: 'M'
  p: Vector2.Vector2
}

interface CubicBezierCommand {
  type: 'C'
  cs: Vector2.Vector2
  ce: Vector2.Vector2
  e: Vector2.Vector2
}

type PathCommand = MoveCommand | CubicBezierCommand

export const fromBezier2d = (bezier: Bezier2d.Bezier2d): Path => {
  const points = bezier[Symbol.iterator]()

  const commands: Array<PathCommand> = []

  let cursor = points.next()

  commands.push({
    type: 'M',
    p: cursor.value as Vector2.Vector2,
  })

  cursor = points.next()

  while (!cursor.done) {
    const cs = cursor.value as Vector2.Vector2
    cursor = points.next()
    const ce = cursor.value as Vector2.Vector2
    cursor = points.next()
    const e = cursor.value as Vector2.Vector2
    cursor = points.next()
    commands.push({
      type: 'C',
      cs,
      ce,
      e,
    })
  }

  return new PathImpl(commands)
}

export const render = (path: Path): string => {
  if (!(path instanceof PathImpl)) {
    throw new Error('Custom path implementations are not supported at this time')
  }

  const commands = path.commands

  let result = ''

  for (const command of commands) {
    if (command.type === 'M') {
      result += ` M ${command.p.x},${command.p.y}`
    } else {
      result += ` C ${command.cs.x},${command.cs.y} ${command.ce.x},${command.ce.y} ${command.e.x},${command.e.y}`
    }
  }

  return result.slice(1)
}
