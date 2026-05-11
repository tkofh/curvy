import { defineConfig } from 'oxlint'

export default defineConfig({
  plugins: ['typescript', 'unicorn', 'oxc', 'import'],
  categories: {
    correctness: 'error',
    suspicious: 'warn',
    perf: 'warn',
  },
  rules: {
    'no-empty': 'off',
    'no-empty-pattern': 'off',
    'no-underscore-dangle': 'off',
    'no-case-declarations': 'warn',
    'no-unused-private-class-members': 'error',
    'no-dupe-else-if': 'warn',
    '@typescript-eslint/array-type': ['error', { default: 'generic' }],
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/consistent-type-exports': 'error',
    '@typescript-eslint/no-namespace': 'error',
    '@typescript-eslint/no-unused-vars': 'warn',
    'import/no-default-export': 'error',
    curly: 'error',
    'no-lonely-if': 'error',
    'operator-assignment': 'error',
    'require-await': 'warn',
    'unicorn/filename-case': ['error', { case: 'camelCase' }],
    'typescript/no-namespace': ['error', { allowDeclarations: true }],
  },
  env: {
    builtin: true,
  },
  overrides: [
    {
      files: ['**/*.config.ts', '**/*.bench.ts', '**/test/**/*.ts'],
      rules: {
        'import/no-default-export': 'off',
      },
    },
    {
      files: ['**/pipe.ts'],
      rules: {
        'prefer-rest-params': 'off',
      },
    },
  ],
})
