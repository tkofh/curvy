import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  rollup: {
    dts: {
      compilerOptions: {
        composite: false,
      },
    },
  },
})
