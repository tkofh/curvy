import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src/splines.ts'],
  format: ['cjs', 'esm'],
  clean: true,
  dts: true,
})
