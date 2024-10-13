import { createHermiteCurve } from 'curvy'
import { test } from 'vitest'
import { spline } from '../src/tailwind/blue'

function indexArray(count: number) {
  return Array.from({ length: count }, (_, i) => i)
}
function normalizedArray(count: number) {
  return indexArray(count).map((i) => i / count)
}
function sawtoothArray(count: number, passes: number) {
  return normalizedArray(count).map((input) =>
    Math.abs(((input * passes * 2) % 2) - 1),
  )
}

function takeEvery(input: ReadonlyArray<number>, step: number) {
  return input.filter((_, i) => i % step === 0)
}

function round(value: number) {
  const result = Math.round(value * 1000) / 1000
  return result === 0 ? 0 : result
}

function sin(input: number) {
  return Math.sin(2 * Math.PI * input)
}
function cos(input: number) {
  return Math.cos(2 * Math.PI * input)
}

test('it works', () => {
  const offset = spline.positionAt(0).hue

  const startingVelocity = spline.velocityAt(0).hue

  const endingPosition = spline.positionAt(1).hue - offset

  const endingVelocity = spline.velocityAt(1).hue

  const _shadeDomain = spline.axes.shade.domain[1] - spline.axes.shade.domain[0]
  // const _interpolationShadeDistance = shade

  const _interpolateStart = createHermiteCurve([
    { hue: 0, shade: 0 },
    { hue: startingVelocity, shade: 25 },
    { hue: 0, shade: 25 },
    { hue: -startingVelocity, shade: 25 },
  ])

  const _interpolateEnd = createHermiteCurve([
    { hue: endingPosition, shade: 0 },
    { hue: endingVelocity, shade: 25 },
    { hue: endingPosition, shade: 25 },
    { hue: -endingVelocity, shade: 25 },
  ])

  const useInterpolateStart = startingVelocity !== 0
  const useInterpolateEnd = endingVelocity !== 0

  const passes = 8
  const halfPassSamples =
    64 + (useInterpolateStart ? 1 : 0) + (useInterpolateEnd ? 1 : 0)

  // const normalizedHalfPass = 1 / (passes * 2)

  const count = passes * (halfPassSamples * 2)

  // const offset = hue.solvePosition(0)

  const samples = sawtoothArray(count, passes).map(
    (input) => spline.solveAlong('shade', input).hue,
  )

  const frequencies = indexArray(count)

  const realRoots = frequencies.map((frequency) =>
    Math.cos(2 * Math.PI * (frequency / count)),
  )
  const complexRoots = frequencies.map((frequency) =>
    Math.sin(2 * Math.PI * (frequency / count)),
  )

  const transformed = frequencies
    .slice(0, Math.floor(count / 2))
    .map((frequency) => {
      let real = 0
      let complex = 0

      for (const [index, sample] of samples.entries()) {
        const root = (index * frequency) % count

        const realRoot = realRoots[root] as number
        const complexRoot = complexRoots[root] as number

        real += sample * realRoot
        complex += sample * complexRoot
      }

      return { frequency, real: round(real), complex: round(complex) }
    })
    .filter(({ real, complex }) => real !== 0 || complex !== 0)

  const polar = transformed
    .map(({ frequency, real, complex }) => {
      const magnitude = round((Math.sqrt(real ** 2 + complex ** 2) * 2) / count)
      const phase = round(Math.atan2(real, complex))
      return { frequency, magnitude, phase }
    })
    .filter(({ magnitude }) => magnitude > 0.01)

  function approximate(input: number) {
    // const passInput = normalizedHalfPass + input * normalizedHalfPass

    let output = 0
    for (const { frequency, magnitude, phase } of polar) {
      output += magnitude * Math.sin(frequency * (input * 2 * Math.PI) + phase)
    }
    return output
  }

  const _approximated = takeEvery(normalizedArray(count), 32).map((input) =>
    round(approximate(input)),
  )
  const _printedSamples = takeEvery(samples, 32).map(round)

  // console.log({
  //   transformed,
  //   polar,
  //   samples: printedSamples,
  //   approximated,
  // })

  // console.log(
  //   `[${samples
  //     .map((sample, index) => `(${index}, ${round(sample)})`)
  //     .join(', ')}]`,
  // )
})
