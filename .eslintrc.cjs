import type { Linter } from 'eslint';

const config: Linter.Config = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'supabase/functions/_shared/cors.ts'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true }
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-async-promise-executor': 'off'
  },
  overrides: [
    {
      // Configuração específica para Supabase Edge Functions (Deno)
      files: ['supabase/functions/**/*.ts'],
      env: {
        browser: false,
        node: false
      },
      globals: {
        Deno: 'readonly',
        crypto: 'readonly',
        URL: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        queueMicrotask: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly'
      },
      rules: {
        // Permitir imports .ts em Deno
        'import/extensions': 'off',
        '@typescript-eslint/no-explicit-any': 'warn'
      }
    }
  ]
};

export default config;
