# Change Log

## 1.0.7

### Patch Changes

- fix missing export for `Vector3.fromSpherical`

## 1.0.6

### Patch Changes

- add `Vector2.fromPolar` and `Vector3.fromSpherical`

## 1.0.5

### Patch Changes

- c1c2018: Add getters for `x`, `y`, `z`, `r`, `theta`, and `phi` in the form of `Vector3.getPhi` etc
- c1c2018: add getters for `x`, `y`, `r`, and `theta` in the form of `Vector2.getTheta` etc

## 1.0.4

### Patch Changes

- 1844bde: export pipe and utils modules

## 1.0.3

### Patch Changes

- 395dbcd: add `Basis2d.toBezier`, `Cardinal2d.toBezier`, and `Hermite2d.toBezier`
- 395dbcd: add `Bezier2d.fromSpline`

## 1.0.2

### Patch Changes

- 27ec055: add `Cardinal2d` spline
- cf4f4c0: add `Hermite2d` spline
- 27ec055: add `scale` to `Vector2`, `Vector3`, and `Vector4`
- 46e533e: add `Basis2d` spline

## 1.0.1

### Patch Changes

- 1b14680: add `curvature` for linear, quadratic, and cubic curves
- 1b14680: add `Bezier2d.appendTangentAligned` (G1 continuity), `Bezier2d.appendCurvatureAligned` (G2 continuity), `Bezier2d.appendVelocityAligned` (C1 continuity), and `Bezier2d.appendAccelerationAligned` (C2 continuity)
- 1b14680: add `LinearPolynomial.fromPoints(p1: Vector2, p2: Vector2)`
- 1b14680: add `curvature` for `CubicPolynomial`s and `QuadraticPolynomial`s
- 1b14680: add `LinearPolynomial.fromPointSlope(point: Vector2, slope: number)`
- 1b14680: add `Vector2.cross(a, b)`

## 1.0.0

### Major Changes

- aa5d726: stable release of new API

## 0.5.0

### Minor Changes

- 6bb377b: bump for npm version error

## 0.4.0

### Minor Changes

- 01b22cc: completely rework API to be functional operations on immutable data structures, modeled after the Effect library

## 0.3.3

### Patch Changes

- fix missing exports

## 0.3.2

### Patch Changes

- 748a342: add solveAlong, improve lookup table sampling
- 748a342: fix monotonicity typo
- 0627bc3: add multi spline support

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.3.0](https://github.com/tkofh/curvy/compare/curvy@0.1.1...curvy@0.3.0) (2024-03-11)

### Bug Fixes

- tests ([f030df3](https://github.com/tkofh/curvy/commit/f030df38db21919d28bb01fbd09b6d9134e27a89))

### Features

- curve ([4673bf7](https://github.com/tkofh/curvy/commit/4673bf7bb489f77fcd5d57f30b107a7fdf5e3bb3))
- solveT ([d93178a](https://github.com/tkofh/curvy/commit/d93178ac9d4423b7568f1de6eec122ec97253fb6))
- things ([8f441dc](https://github.com/tkofh/curvy/commit/8f441dc16e856958d476eae63d5c8e4ea1881599))
- works ([56aff20](https://github.com/tkofh/curvy/commit/56aff2048ec94bb34cc1ea0239728f89e79b86ad))

# [0.2.0](https://github.com/tkofh/curvy/compare/curvy@0.1.1...curvy@0.2.0) (2024-03-11)

### Bug Fixes

- tests ([f030df3](https://github.com/tkofh/curvy/commit/f030df38db21919d28bb01fbd09b6d9134e27a89))

### Features

- curve ([4673bf7](https://github.com/tkofh/curvy/commit/4673bf7bb489f77fcd5d57f30b107a7fdf5e3bb3))
- solveT ([d93178a](https://github.com/tkofh/curvy/commit/d93178ac9d4423b7568f1de6eec122ec97253fb6))
- things ([8f441dc](https://github.com/tkofh/curvy/commit/8f441dc16e856958d476eae63d5c8e4ea1881599))
- works ([56aff20](https://github.com/tkofh/curvy/commit/56aff2048ec94bb34cc1ea0239728f89e79b86ad))

## [0.1.1](https://github.com/tkofh/curvy/compare/curvy@0.1.0...curvy@0.1.1) (2024-03-08)

**Note:** Version bump only for package curvy

# [0.1.0](https://github.com/tkofh/curvy/compare/curvy@0.6.2...curvy@0.1.0) (2024-03-08)

### Features

- core works i think ([d33589a](https://github.com/tkofh/curvy/commit/d33589a93baf93ea3419500ce4acd5483437a72b))
- curve ([448378e](https://github.com/tkofh/curvy/commit/448378e456e93e74e8b84671684706610c6d1153))
- curve segment ([7e8ec11](https://github.com/tkofh/curvy/commit/7e8ec119e79c23b61f28a1d2cbe6d77d4d72c8c5))
- lut stuff ([57fcba9](https://github.com/tkofh/curvy/commit/57fcba98dc8bcee5449aa15c90754ddafcfdb249))
- sample ([a048baf](https://github.com/tkofh/curvy/commit/a048bafb2437b7d99d646436a1d20ddcabb1df63))
- split by segments ([5117e4c](https://github.com/tkofh/curvy/commit/5117e4cc68fdf14fe28f26dd0c97477a80c1e822))
