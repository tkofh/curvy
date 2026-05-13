<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { RationalCubicCurve2d } from 'curvy/curve'
import { CubicPath2d, RationalCubicPath2d } from 'curvy/path'
import { Vector2 } from 'curvy/vector'

interface ControlPoint {
  x: number
  y: number
  weight: number
}

// Pixel-space coordinates. SVG y goes down, so the curve looks "right side up"
// when y is small at the top and large at the bottom — same as DOM layout.
const points = reactive<Array<ControlPoint>>([
  { x: 0, y: 300, weight: 1 },
  { x: 150, y: 50, weight: 1 },
  { x: 250, y: 50, weight: 1 },
  { x: 400, y: 0, weight: 1 },
])

const tolerance = ref(1)
const sampleCount = 500

const curve = computed<RationalCubicCurve2d>(() =>
  RationalCubicCurve2d.fromBezierPoints(
    Vector2.makeWeighted(points[0]!.x, points[0]!.y, points[0]!.weight),
    Vector2.makeWeighted(points[1]!.x, points[1]!.y, points[1]!.weight),
    Vector2.makeWeighted(points[2]!.x, points[2]!.y, points[2]!.weight),
    Vector2.makeWeighted(points[3]!.x, points[3]!.y, points[3]!.weight),
  ),
)

const rationalPath = computed(() => RationalCubicPath2d.make(curve.value))

// Sample-and-stringify the rational curve as an SVG polyline. Dense enough
// that any visible deviation from the approximation is "real" (not aliasing).
const sampledPolyline = computed(() => {
  const out: Array<string> = []
  for (let i = 0; i <= sampleCount; i++) {
    const p = RationalCubicCurve2d.solve(curve.value, i / sampleCount)
    out.push(`${p.x},${p.y}`)
  }
  return out.join(' ')
})

const approximation = computed(() =>
  RationalCubicPath2d.approximateAsCubicPath(rationalPath.value, tolerance.value),
)

const approximationPathData = computed(() => CubicPath2d.toPathData(approximation.value))

const segmentCount = computed(() => [...approximation.value].length)

const controlPolygon = computed(() => points.map((p) => `${p.x},${p.y}`).join(' '))
</script>

<template>
  <section class="scene">
    <div class="canvas-wrap">
      <svg viewBox="0 0 400 300" class="canvas" preserveAspectRatio="xMidYMid meet">
        <polyline :points="controlPolygon" class="control-polygon" />
        <polyline :points="sampledPolyline" class="rational" />
        <path :d="approximationPathData" class="approximation" />
        <circle v-for="(p, i) in points" :key="i" :cx="p.x" :cy="p.y" r="5" class="cp" />
      </svg>
      <div class="legend">
        <div><span class="swatch rational" /> Rational (dense sample)</div>
        <div><span class="swatch approximation" /> Polynomial approximation</div>
        <div><span class="swatch control-polygon" /> Control polygon</div>
      </div>
    </div>

    <aside class="controls">
      <h2>Control points</h2>
      <div class="cp-grid">
        <span /><label>x</label><label>y</label><label>weight</label>
        <template v-for="(p, i) in points" :key="i">
          <label>P{{ i }}</label>
          <input type="number" step="1" v-model.number="p.x" />
          <input type="number" step="1" v-model.number="p.y" />
          <input type="number" step="0.1" min="0.01" v-model.number="p.weight" />
        </template>
      </div>

      <h2>Approximation</h2>
      <div class="tol-row">
        <label for="tol">Tolerance</label>
        <input id="tol" type="number" step="0.1" min="0.01" v-model.number="tolerance" />
      </div>
      <p class="readout">
        Output segments: <strong>{{ segmentCount }}</strong>
      </p>
    </aside>
  </section>
</template>

<style scoped>
.scene {
  display: grid;
  grid-template-columns: 1fr 20rem;
  gap: 1.5rem;
  align-items: start;
}

.canvas-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.canvas {
  width: 100%;
  max-width: 800px;
  aspect-ratio: 4 / 3;
  background: white;
  border: 1px solid var(--border);
  border-radius: 4px;
}

.control-polygon {
  fill: none;
  stroke: #cccccc;
  stroke-width: 1;
  stroke-dasharray: 4 3;
}

.rational {
  fill: none;
  stroke: var(--accent);
  stroke-width: 2;
}

.approximation {
  fill: none;
  stroke: var(--warn);
  stroke-width: 1.5;
  stroke-dasharray: 5 3;
}

.cp {
  fill: #333;
  stroke: white;
  stroke-width: 1.5;
}

.legend {
  display: flex;
  gap: 1.5rem;
  font-size: 0.85rem;
  color: var(--muted);
}

.legend .swatch {
  display: inline-block;
  width: 1.5rem;
  height: 0.2rem;
  vertical-align: middle;
  margin-right: 0.4rem;
}

.legend .swatch.rational {
  background: var(--accent);
}

.legend .swatch.approximation {
  background: repeating-linear-gradient(
    to right,
    var(--warn) 0,
    var(--warn) 4px,
    transparent 4px,
    transparent 7px
  );
}

.legend .swatch.control-polygon {
  background: repeating-linear-gradient(
    to right,
    #cccccc 0,
    #cccccc 3px,
    transparent 3px,
    transparent 6px
  );
}

.controls {
  display: flex;
  flex-direction: column;
}

.cp-grid {
  display: grid;
  grid-template-columns: 2rem repeat(3, 1fr);
  gap: 0.4rem;
  align-items: center;
}

.cp-grid input[type='number'] {
  width: 100%;
  min-width: 0;
}

.tol-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.readout {
  margin-top: 0.75rem;
  font-size: 0.9rem;
  color: var(--muted);
}
</style>
