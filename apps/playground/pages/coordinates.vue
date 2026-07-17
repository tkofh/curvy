<script setup lang="ts">
import { computed, ref } from 'vue'
import { CoordinateSystem, Dimension } from 'curvy/coordinates'
import { CubicPath2d } from 'curvy/path'
import { Cardinal2d } from 'curvy/splines'
import { Vector2 } from 'curvy/vector'

// Chart space: x is the angular coordinate in turns, y the chart radius.
const THETA_MAX = 1.25
const R_MAX = 100

// Chart panel geometry (px in the chart svg's viewBox).
const PAD_L = 40
const PAD_T = 20
const PAD_B = 36
const PAD_R = 20
const PLOT_W = 400
const PLOT_H = 320
const CHART_W = PAD_L + PLOT_W + PAD_R
const CHART_H = PAD_T + PLOT_H + PAD_B

// Cartesian panel geometry: viewBox centered on the polar center, sized
// so the largest reachable mapped radius (r scale 1.5, r offset 60) fits.
const HALF = 215
const VIEW = HALF * 2

const points = ref([
  { x: 0.0, y: 15 },
  { x: 0.15, y: 60 },
  { x: 0.35, y: 30 },
  { x: 0.55, y: 80 },
  { x: 0.75, y: 50 },
  { x: 1.0, y: 95 },
])

const tension = ref(0.5)
const alpha = ref(0.5)

const winding = ref<'clockwise' | 'counterclockwise'>('clockwise')
const thetaOrigin = ref(-0.25)
const radiusScale = ref(1)
const radiusOffset = ref(30)
const tolerance = ref(1)

const showNaive = ref(true)
const showSector = ref(true)

// The system's angular unit is turns, so `thetaOrigin` and every chart x
// coordinate below are measured in turns. Slider ranges keep the config
// inside `polar`'s domain (finite origin, positive scale).
const system = computed(() =>
  CoordinateSystem.polar({
    theta: Dimension.turns,
    winding: winding.value,
    thetaOrigin: thetaOrigin.value,
    radius: Dimension.linear(radiusScale.value, radiusOffset.value),
  }),
)

// A cardinal spline treats its first and last control points as tangent
// handles off the curve; pad with `withInterpolatedEndpoints` so every
// draggable point is on the curve.
const spline = computed(() =>
  Cardinal2d.withInterpolatedEndpoints(
    Cardinal2d.fromArray(
      points.value.map((p) => Vector2.make(p.x, p.y)),
      { tension: tension.value, alpha: alpha.value },
    ),
  ),
)

const chartPath = computed(() => Cardinal2d.toPath(spline.value))
const chartPathData = computed(() => CubicPath2d.toPathData(chartPath.value))

// The polar map is nonlinear, so the true image is transcendental; `image`
// subdivides until the result is within `tolerance` of it.
const imagePath = computed(() =>
  CoordinateSystem.image(system.value, chartPath.value, tolerance.value),
)
const imagePathData = computed(() => CubicPath2d.toPathData(imagePath.value))
const chartSegments = computed(() => [...chartPath.value].length)
const imageSegments = computed(() => [...imagePath.value].length)

// The wrong way, kept on screen as a foil: convert the control points with
// `toCartesian` and respline in cartesian space.
const naivePathData = computed(() =>
  CubicPath2d.toPathData(
    Cardinal2d.toPath(
      Cardinal2d.withInterpolatedEndpoints(
        Cardinal2d.fromArray(
          points.value.map((p) =>
            CoordinateSystem.toCartesian(system.value, Vector2.make(p.x, p.y)),
          ),
          { tension: tension.value, alpha: alpha.value },
        ),
      ),
    ),
  ),
)

// The spline's chart-space bounding box, as the axis-aligned chart rect
// whose polar image `sector` describes. The spline can overshoot its
// control points below r = 0; a negative mapped radius is outside
// `sector`'s domain, so clamp the radial span at 0.
const chartBounds = computed(() => CubicPath2d.boundingBox(chartPath.value))
const sectorTheta = computed(() => chartBounds.value.x)
const sectorR = computed(() => ({
  start: Math.max(0, chartBounds.value.y.start),
  end: Math.max(0, chartBounds.value.y.end),
}))
const sectorData = computed(() =>
  CoordinateSystem.sectorPathData(system.value, sectorTheta.value, sectorR.value),
)

// Polar grid: full-turn arcs at fixed chart radii, spokes every 1/8 turn
// running from the r = 0 circle (the hole edge) out to r = R_MAX.
const gridRadii = [0, 25, 50, 75, 100]
const gridCircles = computed(() =>
  gridRadii.map((r) => CoordinateSystem.arcPathData(system.value, { start: 0, end: 1 }, r)),
)
const spokes = computed(() =>
  Array.from({ length: 8 }, (_, i) => {
    const t = i / 8
    return {
      from: CoordinateSystem.toCartesian(system.value, Vector2.make(t, 0)),
      to: CoordinateSystem.toCartesian(system.value, Vector2.make(t, R_MAX)),
      zero: i === 0,
    }
  }),
)

const maxMappedRadius = computed(() => R_MAX * radiusScale.value + radiusOffset.value)

// Chart panel mapping between chart coordinates and svg px.
const toChartPxX = (theta: number) => PAD_L + (theta / THETA_MAX) * PLOT_W
const toChartPxY = (r: number) => PAD_T + (1 - r / R_MAX) * PLOT_H
const chartTransform = `translate(${PAD_L} ${PAD_T + PLOT_H}) scale(${PLOT_W / THETA_MAX} ${-PLOT_H / R_MAX})`

const thetaTicks = [0, 0.25, 0.5, 0.75, 1, 1.25]
const rTicks = [0, 25, 50, 75, 100]

const controlPolygon = computed(() =>
  points.value.map((p) => `${toChartPxX(p.x)},${toChartPxY(p.y)}`).join(' '),
)

const sectorRect = computed(() => {
  const t = sectorTheta.value
  const r = sectorR.value
  return {
    x: toChartPxX(t.start),
    y: toChartPxY(r.end),
    width: ((t.end - t.start) / THETA_MAX) * PLOT_W,
    height: ((r.end - r.start) / R_MAX) * PLOT_H,
  }
})

// Dragging control points in the chart panel.
const chartSvg = ref<SVGSVGElement | null>(null)
const dragIndex = ref<number | null>(null)

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

function chartPointFromEvent(e: PointerEvent) {
  const svg = chartSvg.value
  if (!svg) return null
  const rect = svg.getBoundingClientRect()
  const sx = ((e.clientX - rect.left) / rect.width) * CHART_W
  const sy = ((e.clientY - rect.top) / rect.height) * CHART_H
  return {
    x: clamp(((sx - PAD_L) / PLOT_W) * THETA_MAX, 0, THETA_MAX),
    y: clamp((1 - (sy - PAD_T) / PLOT_H) * R_MAX, 0, R_MAX),
  }
}

function onPointDown(i: number, e: PointerEvent) {
  dragIndex.value = i
  ;(e.target as Element).setPointerCapture(e.pointerId)
}

function onPointMove(i: number, e: PointerEvent) {
  if (dragIndex.value !== i) return
  const p = chartPointFromEvent(e)
  if (p) points.value[i] = p
}

function onPointUp() {
  dragIndex.value = null
}

// Pointer readout in the cartesian panel: `fromCartesian` recovers the
// chart coordinates, `containsPoint` hit-tests the sector.
const cartSvg = ref<SVGSVGElement | null>(null)
const pointer = ref<{ x: number; y: number } | null>(null)

function onCartMove(e: PointerEvent) {
  const svg = cartSvg.value
  if (!svg) return
  const rect = svg.getBoundingClientRect()
  pointer.value = {
    x: ((e.clientX - rect.left) / rect.width) * VIEW - HALF,
    y: ((e.clientY - rect.top) / rect.height) * VIEW - HALF,
  }
}

function onCartLeave() {
  pointer.value = null
}

const pointerChart = computed(() => {
  if (!pointer.value) return null
  return CoordinateSystem.fromCartesian(
    system.value,
    Vector2.make(pointer.value.x, pointer.value.y),
  )
})

const pointerInSector = computed(() => {
  if (!pointer.value) return false
  return CoordinateSystem.containsPoint(
    system.value,
    sectorTheta.value,
    sectorR.value,
    Vector2.make(pointer.value.x, pointer.value.y),
  )
})
</script>

<template>
  <section class="scene">
    <div class="panel">
      <h2>Chart space (θ, r)</h2>
      <svg ref="chartSvg" :viewBox="`0 0 ${CHART_W} ${CHART_H}`" class="canvas">
        <line
          v-for="t in thetaTicks"
          :key="`v${t}`"
          :x1="toChartPxX(t)"
          :y1="toChartPxY(0)"
          :x2="toChartPxX(t)"
          :y2="toChartPxY(R_MAX)"
          :class="t === 1 ? 'seam' : 'grid'"
        />
        <line
          v-for="r in rTicks"
          :key="`h${r}`"
          :x1="toChartPxX(0)"
          :y1="toChartPxY(r)"
          :x2="toChartPxX(THETA_MAX)"
          :y2="toChartPxY(r)"
          class="grid"
        />

        <rect
          v-if="showSector"
          v-bind="sectorRect"
          class="sector"
          :class="{ hit: pointerInSector }"
        />

        <polyline :points="controlPolygon" class="polygon" />
        <g :transform="chartTransform">
          <path :d="chartPathData" class="curve" vector-effect="non-scaling-stroke" />
        </g>

        <circle
          v-for="(p, i) in points"
          :key="i"
          :cx="toChartPxX(p.x)"
          :cy="toChartPxY(p.y)"
          r="6"
          class="handle"
          :class="{ dragging: dragIndex === i }"
          @pointerdown="onPointDown(i, $event)"
          @pointermove="onPointMove(i, $event)"
          @pointerup="onPointUp"
          @pointercancel="onPointUp"
        />

        <text
          v-for="t in thetaTicks"
          :key="`vt${t}`"
          :x="toChartPxX(t)"
          :y="toChartPxY(0) + 16"
          class="tick"
          text-anchor="middle"
        >
          {{ t === 1 ? '1 turn' : t }}
        </text>
        <text
          v-for="r in rTicks"
          :key="`ht${r}`"
          :x="toChartPxX(0) - 6"
          :y="toChartPxY(r) + 4"
          class="tick"
          text-anchor="end"
        >
          {{ r }}
        </text>
      </svg>
      <div class="legend">
        <div><span class="swatch accent" /> Spline (drag the points)</div>
        <div v-if="showSector"><span class="swatch sector-swatch" /> Bounding box</div>
      </div>
    </div>

    <div class="panel">
      <h2>Cartesian image</h2>
      <svg
        ref="cartSvg"
        :viewBox="`${-HALF} ${-HALF} ${VIEW} ${VIEW}`"
        class="canvas"
        @pointermove="onCartMove"
        @pointerleave="onCartLeave"
      >
        <path v-for="(d, i) in gridCircles" :key="i" :d="d" class="grid" fill="none" />
        <line
          v-for="(s, i) in spokes"
          :key="`s${i}`"
          :x1="s.from.x"
          :y1="s.from.y"
          :x2="s.to.x"
          :y2="s.to.y"
          :class="s.zero ? 'zero-spoke' : 'grid'"
        />
        <circle :cx="0" :cy="0" r="2.5" class="center-dot" />

        <path v-if="showSector" :d="sectorData" class="sector" :class="{ hit: pointerInSector }" />

        <path v-if="showNaive" :d="naivePathData" class="naive" />
        <path :d="imagePathData" class="curve" />
      </svg>
      <div class="legend">
        <div><span class="swatch accent" /> image()</div>
        <div v-if="showNaive"><span class="swatch naive-swatch" /> Mapped control points</div>
        <div v-if="showSector"><span class="swatch sector-swatch" /> sector()</div>
      </div>
      <p class="readout pointer-readout">
        <template v-if="pointerChart">
          fromCartesian: θ = <strong>{{ pointerChart.x.toFixed(3) }}</strong> turns, r =
          <strong>{{ pointerChart.y.toFixed(1) }}</strong>
          <span v-if="pointerInSector" class="badge">inside sector</span>
        </template>
        <template v-else>Hover the image to read chart coordinates back.</template>
      </p>
    </div>

    <aside class="controls">
      <h2>Spline</h2>
      <div class="row">
        <label for="tension">Tension</label>
        <input id="tension" type="range" min="0" max="1" step="0.05" v-model.number="tension" />
        <input type="number" min="0" max="1" step="0.05" v-model.number="tension" />
      </div>
      <div class="row">
        <label for="alpha">Alpha</label>
        <input id="alpha" type="range" min="0" max="1" step="0.05" v-model.number="alpha" />
        <input type="number" min="0" max="1" step="0.05" v-model.number="alpha" />
      </div>

      <h2>Projection</h2>
      <div class="row">
        <label for="winding">Winding</label>
        <select id="winding" v-model="winding" class="wide">
          <option value="clockwise">clockwise</option>
          <option value="counterclockwise">counterclockwise</option>
        </select>
      </div>
      <div class="row">
        <label for="origin">θ origin</label>
        <input
          id="origin"
          type="range"
          min="-0.5"
          max="0.5"
          step="0.01"
          v-model.number="thetaOrigin"
        />
        <input type="number" min="-0.5" max="0.5" step="0.01" v-model.number="thetaOrigin" />
      </div>
      <div class="row">
        <label for="rscale">r scale</label>
        <input
          id="rscale"
          type="range"
          min="0.25"
          max="1.5"
          step="0.05"
          v-model.number="radiusScale"
        />
        <input type="number" min="0.25" max="1.5" step="0.05" v-model.number="radiusScale" />
      </div>
      <div class="row">
        <label for="roffset">r offset</label>
        <input id="roffset" type="range" min="0" max="60" step="1" v-model.number="radiusOffset" />
        <input type="number" min="0" max="60" step="1" v-model.number="radiusOffset" />
      </div>
      <p class="readout">
        Chart r = {{ R_MAX }} maps to <strong>{{ maxMappedRadius.toFixed(0) }}px</strong>
      </p>

      <h2>Image</h2>
      <div class="row">
        <label for="tol">Tolerance</label>
        <input id="tol" type="range" min="0.1" max="8" step="0.1" v-model.number="tolerance" />
        <input type="number" min="0.1" step="0.1" v-model.number="tolerance" />
      </div>
      <p class="readout">
        {{ chartSegments }} chart segments → <strong>{{ imageSegments }}</strong> image segments
      </p>

      <h2>Overlays</h2>
      <label class="check"
        ><input type="checkbox" v-model="showNaive" /> Mapped control points (the wrong way)</label
      >
      <label class="check"
        ><input type="checkbox" v-model="showSector" /> Bounding-box sector + hit test</label
      >

      <p class="hint">
        The left panel is chart space: x is the angle in turns, y the chart radius. The solid curve
        on the right is <code>CoordinateSystem.image</code>, certified to stay within tolerance of
        the true image. The dashed curve converts the control points with
        <code>toCartesian</code> and re-splines them — the polar map is nonlinear, so mapping
        control points bends the wrong curve. The shaded region is <code>sectorPathData</code> over
        the spline's chart bounding box, and hovering it runs <code>containsPoint</code> on the
        pointer.
      </p>
    </aside>
  </section>
</template>

<style scoped>
.scene {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 18rem;
  gap: 1.5rem;
  align-items: start;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.panel h2 {
  margin-top: 0;
}

.canvas {
  width: 100%;
  background: white;
  border: 1px solid var(--border);
  border-radius: 4px;
  touch-action: none;
}

.grid {
  stroke: #eeeeee;
  stroke-width: 1;
}

.seam {
  stroke: #cccccc;
  stroke-width: 1;
  stroke-dasharray: 4 3;
}

.zero-spoke {
  stroke: #bbbbbb;
  stroke-width: 1.5;
}

.center-dot {
  fill: #bbbbbb;
}

.curve {
  fill: none;
  stroke: var(--accent);
  stroke-width: 2;
}

.naive {
  fill: none;
  stroke: var(--warn);
  stroke-width: 1.5;
  stroke-dasharray: 5 4;
}

.sector {
  fill: rgba(30, 136, 229, 0.06);
  stroke: rgba(30, 136, 229, 0.35);
  stroke-width: 1;
  transition: fill 0.1s;
}

.sector.hit {
  fill: rgba(30, 136, 229, 0.18);
}

.polygon {
  fill: none;
  stroke: #dddddd;
  stroke-width: 1;
  stroke-dasharray: 2 3;
}

.handle {
  fill: white;
  stroke: var(--accent);
  stroke-width: 2;
  cursor: grab;
}

.handle.dragging {
  fill: var(--accent);
  cursor: grabbing;
}

.tick {
  font-size: 11px;
  fill: var(--muted);
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
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

.legend .swatch.accent {
  background: var(--accent);
}

.legend .swatch.naive-swatch {
  background: repeating-linear-gradient(
    to right,
    var(--warn) 0,
    var(--warn) 4px,
    transparent 4px,
    transparent 7px
  );
}

.legend .swatch.sector-swatch {
  height: 0.7rem;
  background: rgba(30, 136, 229, 0.15);
  border: 1px solid rgba(30, 136, 229, 0.35);
}

.controls {
  display: flex;
  flex-direction: column;
}

.row {
  display: grid;
  grid-template-columns: 4.5rem 1fr 4rem;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.4rem;
}

.row input[type='range'],
.row input[type='number'] {
  width: 100%;
  min-width: 0;
}

.row select.wide {
  grid-column: span 2;
  font: inherit;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: white;
}

.check {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.85rem;
}

.readout {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  color: var(--muted);
}

.pointer-readout {
  min-height: 1.3rem;
}

.badge {
  margin-left: 0.5rem;
  padding: 0.1rem 0.4rem;
  font-size: 0.75rem;
  border-radius: 3px;
  background: rgba(30, 136, 229, 0.15);
  color: var(--accent);
}

.hint {
  margin-top: 1rem;
  font-size: 0.8rem;
  color: var(--muted);
  line-height: 1.4;
}

.hint code {
  font-size: 0.95em;
}

@media (max-width: 1100px) {
  .scene {
    grid-template-columns: 1fr;
  }
}
</style>
