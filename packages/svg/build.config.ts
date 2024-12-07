import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  declaration: true,
  sourcemap: true,
  rollup: {
    emitCJS: false,
    esbuild: {
      target: 'ES2022',
      tsconfigRaw: {
        compilerOptions: {
          useDefineForClassFields: false,
        },
      },
    },
  },
})
