import { describe, expect, test } from 'vitest'
import { bezier, createCurve, toBezierSegments } from '../src'
import { createLookupTable } from '../src/lut'

describe('createLookupTable', () => {
  test('it works', () => {
    // console.log(createBezierSegment([0]))
    expect(true).toEqual(true)
    console.log(
      createLookupTable(
        createCurve(bezier, toBezierSegments([0, 5, -4, 1, 6, -3, 2])),
        {
          maxError: 100,
          minSamples: 2,
        },
      ),
    )
  })
})
