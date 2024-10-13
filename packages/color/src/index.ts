import { createCatmullRomAxis } from 'curvy/axis'

const hue = createCatmullRomAxis([
  214, 214, 213, 212, 213, 217, 221, 224, 226, 224, 226,
])

function round(value: number) {
  return Math.round(value * 100000) / 100000
}

const passSamples = 8
const passes = 4

const count = passSamples * 2 * passes

const _offset = hue.solvePosition(0)

const _inputs = Array.from({ length: count }, (_, i) =>
  Math.abs((((i / count) * passes * 2) % 2) - 1),
)

// console.log(inputs)

const samples = Array.from({ length: count }, (_, input) =>
  // hue.solvePosition(input) - offset,
  round(
    // Math.cos(2 * (2 * Math.PI * (input / count))) +
    Math.sin(2 * Math.PI * (input / count)),
  ),
)

console.log(samples, samples.length)

const theta = (-2 * Math.PI) / count

const frequencyBases = Array.from({ length: count }, (_, i) => i * theta)

console.log(frequencyBases)

const frequencies: Array<{
  f: number
  x: number
  y: number
  magnitude: number
  phase: number
}> = []

for (let index = 0; index < count / 2; index++) {
  let real = 0
  let imaginary = 0

  for (let power = 0; power < count; power++) {
    const sample = samples[power] as number

    if (power === 1) {
      console.log({
        sample,
        power,
        index,
        real: Math.cos(theta * power * index),
        imaginary: Math.sin(theta * power * index),
      })
    }

    real += sample * Math.cos(theta * power * index)
    imaginary += sample * Math.sin(theta * power * index)
  }

  console.log({ real, imaginary })

  const magnitude = round(Math.sqrt(real ** 2 + imaginary ** 2))
  const phase = round(Math.atan2(real, imaginary))

  if (magnitude > 0.1) {
    frequencies.push({
      f: index,
      x: round(real),
      y: round(imaginary),
      magnitude,
      phase,
    })
  }
}

console.log(frequencies)

// console.log(frequencies.length)

function getOutput(input: number) {
  let output = 0
  for (const { f, magnitude, phase } of frequencies) {
    output += (magnitude / count) * Math.cos(f * (input * 2 * Math.PI) + phase)
  }
  return output
}

for (const [index, _value] of samples.entries()) {
  const _approximated = getOutput(index / count)

  // console.log(`sample: ${round(value)}, approximated: ${round(approximated)}`)
}
//
// const points: Array<string> = []
//
// for (const [index, value] of expected.entries()) {
//   points.push(`(${index}, ${round(value)})`)
// }
//
// console.log(`[${points.join(', ')}]`)
// // for(const
