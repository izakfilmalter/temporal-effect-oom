import baseConfig from '@if/eslint-config/base'

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ['dist/**', 'sst-env.d.ts'],
  },
  ...baseConfig,
]
