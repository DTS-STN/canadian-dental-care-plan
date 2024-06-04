/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
  root: true,
  extends: ['eslint:recommended'],
  env: {
    browser: true,
    commonjs: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    project: ['./tsconfig.json'],
  },
  overrides: [
    {
      // React sources
      files: ['**/*.{js,jsx,ts,tsx}'],
      excludedFiles: ['./tmp/**'],
      plugins: ['react', 'jsx-a11y'],
      extends: ['plugin:react/recommended', 'plugin:react/jsx-runtime', 'plugin:react-hooks/recommended', 'plugin:jsx-a11y/recommended', 'prettier'],
      settings: {
        react: { version: 'detect' },
        formComponents: ['Form'],
        linkComponents: [
          { name: 'Link', linkAttribute: 'to' },
          { name: 'NavLink', linkAttribute: 'to' },
        ],
        'import/resolver': {
          typescript: {},
        },
      },
      rules: {
        'react/no-unknown-property': ['error', { ignore: ['property', 'resource', 'typeof', 'vocab'] }],
        'react/prop-types': 'off',
      },
    },
    {
      // Typescript sources
      files: ['**/*.{ts,tsx}'],
      excludedFiles: ['./tmp/**'],
      plugins: ['@typescript-eslint', 'import'],
      parser: '@typescript-eslint/parser',
      settings: {
        'import/internal-regex': '^~/',
        'import/resolver': {
          node: {
            extensions: ['.ts', '.tsx'],
          },
          typescript: {
            alwaysTryTypes: true,
          },
        },
      },
      extends: ['plugin:@typescript-eslint/recommended', 'plugin:import/recommended', 'plugin:import/typescript', 'prettier'],
      rules: {
        '@typescript-eslint/no-unnecessary-condition': 'error',
        // Note: you must disable the base rule as it can report incorrect errors
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
        '@typescript-eslint/prefer-nullish-coalescing': 'error',
        '@typescript-eslint/prefer-optional-chain': 'error',
        '@typescript-eslint/no-floating-promises': 'error',
        'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      },
    },
    {
      // Node sources
      files: ['.eslintrc.js'],
      excludedFiles: ['./tmp/**'],
      env: { node: true },
      settings: {
        'import/resolver': {
          typescript: {},
        },
      },
    },
  ],
};
