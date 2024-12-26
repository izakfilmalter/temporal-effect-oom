import baseConfig from '@if/eslint-config/base'

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ['node_modules', 'lib', '@types', 'sst-env.d.ts'],
  },
  ...baseConfig,
]
