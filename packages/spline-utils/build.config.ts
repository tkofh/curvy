import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [{ input: './src/index', format: 'esm' }],
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: true,
  },
})
