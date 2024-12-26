/// <reference types="./types.d.ts" />

import eslint from '@eslint/js'
import importPlugin from 'eslint-plugin-import'
import turboPlugin from 'eslint-plugin-turbo'
import tseslint from 'typescript-eslint'

/**
 * All packages that leverage t3-env should use this rule
 */
export const restrictEnvAccess = tseslint.config({
  files: ['**/*.js', '**/*.ts', '**/*.tsx'],
  rules: {
    'no-restricted-properties': [
      'error',
      {
        object: 'process',
        property: 'env',
        message:
          "Use `import { env } from '@if/be-edge'` instead to ensure validated types.",
      },
    ],
    'no-restricted-imports': [
      'error',
      {
        name: 'process',
        importNames: ['env'],
        message:
          "Use `import { env } from '@if/be-edge'` instead to ensure validated types.",
      },
    ],
  },
})

export default tseslint.config(
  {
    // Globally ignored files
    ignores: ['**/*.config.*'],
  },
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    plugins: {
      import: importPlugin,
      turbo: turboPlugin,
    },
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      ...turboPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-misused-promises': [
        2,
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/no-unnecessary-condition': [
        'error',
        {
          allowConstantLoopConditions: true,
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'error',
      'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      'arrow-body-style': ['warn', 'as-needed'],
      'turbo/no-undeclared-env-vars': 'off',
      '@typescript-eslint/no-shadow': ['error'],
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/array-type': ['error', { default: 'generic' }],
      'no-restricted-imports': [
        'error',
        {
          name: 'jotai/index',
          message: "Please use 'jotai' instead",
        },
      ],
    },
  },
  {
    linterOptions: { reportUnusedDisableDirectives: true },
    languageOptions: { parserOptions: { projectService: true } },
  },
)

// const config = {
//   extends: [
//     'turbo',
//     'eslint:recommended',
//     'plugin:@typescript-eslint/recommended-type-checked',
//     'plugin:@typescript-eslint/stylistic-type-checked',
//     'prettier',
//   ],
//   env: {
//     es2022: true,
//     node: true,
//   },
//   parser: '@typescript-eslint/parser',
//   parserOptions: {
//     project: true,
//   },
//   plugins: ['@typescript-eslint', 'import'],
//   rules: {
//     'arrow-body-style': ['warn', 'as-needed'],
//     'turbo/no-undeclared-env-vars': 'off',
//     '@typescript-eslint/no-shadow': ['error'],
//     '@typescript-eslint/no-unused-vars': [
//       'error',
//       { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
//     ],
//     '@typescript-eslint/consistent-type-imports': [
//       'warn',
//       { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
//     ],
//     '@typescript-eslint/consistent-type-definitions': 'off',
//     '@typescript-eslint/no-misused-promises': [
//       2,
//       { checksVoidReturn: { attributes: false } },
//     ],
//     'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
//     '@typescript-eslint/array-type': ['error', { default: 'generic' }],
//     'no-restricted-imports': [
//       'error',
//       {
//         name: 'jotai/index',
//         message: "Please use 'jotai' instead",
//       },
//     ],
//   },
//   ignorePatterns: [
//     '**/.eslintrc.cjs',
//     '**/*.config.js',
//     '**/*.config.cjs',
//     '.next',
//     'dist',
//     'yarn-lock.yaml',
//   ],
//   reportUnusedDisableDirectives: true,
// }
//
// module.exports = config
