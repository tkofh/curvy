import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/number.ts',
    'src/utils.ts',
    'src/vector/index.ts',
    'src/matrix/index.ts',
    'src/polynomial/index.ts',
    'src/curve/index.ts',
    'src/path/index.ts',
    'src/splines/index.ts',
    'src/piecewise/index.ts',
    'src/interval/index.ts',
    'src/monotonicity/index.ts',
    'src/solution/index.ts',
    'src/characteristic/index.ts',
    'src/transform/index.ts',
    'src/coordinates/index.ts',
  ],
  format: 'esm',
  dts: false,
  sourcemap: true,
  target: 'es2022',
  clean: true,
  outputOptions: {
    entryFileNames: '[name].mjs',
    chunkFileNames: 'shared/[name]-[hash].mjs',
  },
  tsconfig: './tsconfig.json',
})
