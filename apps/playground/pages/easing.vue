<script setup lang="ts">
import { computed, ref } from 'vue'
import { RationalCubicCurve2d } from 'curvy/curve'
import { CubicPath2d } from 'curvy/path'
import { Solution } from 'curvy/solution'

const startSlope = ref(0)
const endSlope = ref(0)
const startCurvature = ref(6)
const endCurvature = ref(-6)
const scrubX = ref(0.5)
const tolerance = ref(0.005)

const PLOT = 400
const PAD = 36

// Math (x,y) ∈ [0,1]² → SVG with y flipped so 0 sits at the bottom.
const toSvgX = (x: number) => PAD + x * PLOT
const toSvgY = (y: number) => PAD + (1 - y) * PLOT
const viewSize = PLOT + PAD * 2

// SVG transform that takes a child element drawn in math space (x,y ∈ [0,1],
// y-up) and maps it into the plot area (y-down). Applied to the approximation
// `<path>` so its coordinates can come straight from `CubicPath2d.toPathData`.
const plotTransform = `translate(${PAD} ${PAD + PLOT}) scale(${PLOT} ${-PLOT})`

// `fromSlopesAndCurvatures` throws on singular constraint systems and on
// inputs that drive the denominator to zero on [0, 1] — keep the page
// interactive by capturing the error rather than letting it tear down render.
const curve = computed(() => {
  try {
    return {
      value: RationalCubicCurve2d.fromSlopesAndCurvatures(
        startSlope.value,
        endSlope.value,
        startCurvature.value,
        endCurvature.value,
      ),
      error: null as string | null,
    }
  } catch (e) {
    return { value: null, error: (e as Error).message }
  }
})

// Approximate the rational easing as a sequence of polynomial cubic Béziers
// and hand the resulting path straight to `toPathData` — no manual sampling.
const approximation = computed(() => {
  const c = curve.value.value
  if (!c) return null
  return CubicPath2d.fromArray(RationalCubicCurve2d.approximateAsCubicCurves(c, tolerance.value))
})

const curvePathData = computed(() =>
  approximation.value ? CubicPath2d.toPathData(approximation.value) : '',
)

const segmentCount = computed(() => (approximation.value ? [...approximation.value].length : 0))

const scrubY = computed(() => {
  const c = curve.value.value
  if (!c) return null
  return Solution.valueOrUndefined(RationalCubicCurve2d.solveAtX(c, scrubX.value)) ?? null
})
</script>

<template>
  <section class="scene">
    <div class="canvas-wrap">
      <svg :viewBox="`0 0 ${viewSize} ${viewSize}`" class="canvas">
        <rect :x="toSvgX(0)" :y="toSvgY(1)" :width="PLOT" :height="PLOT" class="unit-box" />
        <line :x1="toSvgX(0)" :y1="toSvgY(0)" :x2="toSvgX(1)" :y2="toSvgY(1)" class="diagonal" />
        <g :transform="plotTransform">
          <path
            v-if="curvePathData"
            :d="curvePathData"
            class="curve"
            vector-effect="non-scaling-stroke"
          />
        </g>

        <template v-if="scrubY !== null">
          <line
            :x1="toSvgX(scrubX)"
            :y1="toSvgY(0)"
            :x2="toSvgX(scrubX)"
            :y2="toSvgY(scrubY)"
            class="scrub"
          />
          <line
            :x1="toSvgX(0)"
            :y1="toSvgY(scrubY)"
            :x2="toSvgX(scrubX)"
            :y2="toSvgY(scrubY)"
            class="scrub"
          />
          <circle :cx="toSvgX(scrubX)" :cy="toSvgY(scrubY)" r="4" class="scrub-dot" />
        </template>

        <text :x="toSvgX(0) - 6" :y="toSvgY(0) + 4" class="tick" text-anchor="end">0</text>
        <text :x="toSvgX(0) - 6" :y="toSvgY(1) + 4" class="tick" text-anchor="end">1</text>
        <text :x="toSvgX(0)" :y="toSvgY(0) + 18" class="tick" text-anchor="middle">0</text>
        <text :x="toSvgX(1)" :y="toSvgY(0) + 18" class="tick" text-anchor="middle">1</text>
      </svg>
      <div class="legend">
        <div><span class="swatch curve" /> Easing y = f(x)</div>
        <div><span class="swatch diagonal" /> Linear reference</div>
        <div><span class="swatch scrub" /> Scrub readout</div>
      </div>
    </div>

    <aside class="controls">
      <h2>Slopes</h2>
      <div class="row">
        <label for="m0">Start (m₀)</label>
        <input id="m0" type="range" min="0" max="3" step="0.05" v-model.number="startSlope" />
        <input type="number" step="0.05" v-model.number="startSlope" />
      </div>
      <div class="row">
        <label for="m1">End (m₁)</label>
        <input id="m1" type="range" min="0" max="3" step="0.05" v-model.number="endSlope" />
        <input type="number" step="0.05" v-model.number="endSlope" />
      </div>

      <h2>Curvatures</h2>
      <div class="row">
        <label for="k0">Start (κ₀)</label>
        <input id="k0" type="range" min="-12" max="12" step="0.1" v-model.number="startCurvature" />
        <input type="number" step="0.1" v-model.number="startCurvature" />
      </div>
      <div class="row">
        <label for="k1">End (κ₁)</label>
        <input id="k1" type="range" min="-12" max="12" step="0.1" v-model.number="endCurvature" />
        <input type="number" step="0.1" v-model.number="endCurvature" />
      </div>

      <h2>Approximation</h2>
      <div class="row">
        <label for="tol">Tolerance</label>
        <input
          id="tol"
          type="range"
          min="0.0005"
          max="0.1"
          step="0.0005"
          v-model.number="tolerance"
        />
        <input type="number" step="0.001" min="0.0005" v-model.number="tolerance" />
      </div>
      <p class="readout">
        Segments: <strong>{{ segmentCount }}</strong>
      </p>

      <h2>Scrub</h2>
      <div class="row">
        <label for="sx">x</label>
        <input id="sx" type="range" min="0" max="1" step="0.005" v-model.number="scrubX" />
        <input type="number" step="0.01" min="0" max="1" v-model.number="scrubX" />
      </div>
      <p v-if="scrubY !== null" class="readout">
        f({{ scrubX.toFixed(3) }}) = <strong>{{ scrubY.toFixed(4) }}</strong>
      </p>

      <p v-if="curve.error" class="error">{{ curve.error }}</p>
      <p class="hint">
        Signed differential curvature κ = y″/(1+y′²)^(3/2). Smoothstep is (0, 0, 6, −6); linear is
        (1, 1, 0, 0). Construction throws when the constraint system is singular or when the
        resulting denominator crosses zero on [0, 1].
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
  max-width: 520px;
  aspect-ratio: 1 / 1;
  background: white;
  border: 1px solid var(--border);
  border-radius: 4px;
}

.unit-box {
  fill: none;
  stroke: var(--border);
  stroke-width: 1;
}

.diagonal {
  stroke: #cccccc;
  stroke-width: 1;
  stroke-dasharray: 4 3;
}

.curve {
  fill: none;
  stroke: var(--accent);
  stroke-width: 2;
}

.scrub {
  stroke: #d946ef;
  stroke-width: 1;
  stroke-dasharray: 3 2;
}

.scrub-dot {
  fill: #d946ef;
  stroke: white;
  stroke-width: 1.5;
}

.tick {
  font-size: 11px;
  fill: var(--muted);
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

.legend .swatch.curve {
  background: var(--accent);
}

.legend .swatch.diagonal {
  background: repeating-linear-gradient(
    to right,
    #cccccc 0,
    #cccccc 3px,
    transparent 3px,
    transparent 6px
  );
}

.legend .swatch.scrub {
  background: #d946ef;
}

.controls {
  display: flex;
  flex-direction: column;
}

.row {
  display: grid;
  grid-template-columns: 5rem 1fr 4rem;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.4rem;
}

.row input[type='range'] {
  width: 100%;
  min-width: 0;
}

.row input[type='number'] {
  width: 100%;
  min-width: 0;
}

.readout {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: var(--muted);
}

.error {
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  border: 1px solid var(--warn);
  border-radius: 3px;
  color: var(--warn);
  background: #fef3f3;
}

.hint {
  margin-top: 1rem;
  font-size: 0.8rem;
  color: var(--muted);
  line-height: 1.4;
}
</style>
