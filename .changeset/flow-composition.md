---
'curvy': minor
---

**`flow` — left-to-right function composition, the point-free companion to `pipe`.** Exported from `curvy/utils`.

Where `pipe(x, f, g)` threads a starting value through functions immediately (`g(f(x))`), `flow(f, g)` composes the functions into a new one and waits for the value (`x => g(f(x))`). That lets you name a reusable pipeline and apply it later — or hand it straight to `.map`. It carries the same 1-through-9 overload ladder as `pipe`, fully typed so each step's input is checked against the previous step's output.

It fits curvy's data-last overloads, whose partially-applied forms are exactly the unary functions `flow` composes:

```ts
import { flow } from 'curvy/utils'
import { Vector2 } from 'curvy/vector'

// Build the transform once, apply it many times.
const nudge = flow(Vector2.scale(2), Vector2.add(Vector2.make(1, 0)))

nudge(Vector2.make(3, 4)) // Vector2 { x: 7, y: 8 }
points.map(nudge) // reuse across a collection
```

curvy does not use `flow` internally; it ships alongside `pipe` for consumers assembling their own operation pipelines.
