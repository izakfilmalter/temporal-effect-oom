import reactPlugin from 'eslint-plugin-react'
import reactCompilerPlugin from 'eslint-plugin-react-compiler'
import hooksPlugin from 'eslint-plugin-react-hooks'

/** @type {Awaited<import('typescript-eslint').Config>} */
export default [
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mdx'],
    plugins: {
      react: reactPlugin,
      'react-hooks': hooksPlugin,
      'react-compiler': reactCompilerPlugin,
    },
    rules: {
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...hooksPlugin.configs.recommended.rules,
      'react-compiler/react-compiler': 'error',
      'react/jsx-curly-brace-presence': ['warn', { props: 'always' }],
      'react-hooks/exhaustive-deps': [
        'error',
        {
          additionalHooks:
            '(useStableEffect|useStableLayoutEffect|useStableCallback|useStableMemo)',
        },
      ],
    },
    languageOptions: {
      globals: {
        React: 'writable',
      },
    },
  },
]
