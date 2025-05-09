import eslint from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import unicornPlugin from 'eslint-plugin-unicorn';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      '**/.react-router/', //
      '**/build/',
      '**/coverage/',
      '**/playwright-report/',
      '**/tmp/',
    ],
  },
  eslint.configs.recommended,
  {
    //
    // base config
    //
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2023,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        // type linting: https://typescript-eslint.io/getting-started/typed-linting/
        projectService: true,
        tsconfigRootDir: import.meta.name,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    //
    // non-typescript
    //
    files: ['**/*.{js,cjs,mjs}'],
    extends: [eslint.configs.recommended],
  },
  {
    //
    // typescript
    //
    files: ['**/*.{ts,tsx}'],
    extends: [
      eslint.configs.recommended, //
      tseslint.configs.strict,
      importPlugin.flatConfigs.recommended,
    ],
    rules: {
      'no-param-reassign': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-deprecated': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      // Rule: @typescript-eslint/require-await
      // Note: you must disable the base rule as it can report incorrect errors
      // https://typescript-eslint.io/rules/require-await/#how-to-use
      'require-await': 'off',
      '@typescript-eslint/require-await': 'error',
      // Rule: @typescript-eslint/return-await
      // Note: you must disable the base rule as it can report incorrect errors
      // https://typescript-eslint.io/rules/return-await#how-to-use
      'no-return-await': 'off',
      '@typescript-eslint/return-await': ['error', 'always'],
      '@typescript-eslint/switch-exhaustiveness-check': ['error', { considerDefaultExhaustiveForUnions: true, requireDefaultForNonUnion: true }],
      'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
  },
  {
    //
    // react
    //
    files: ['**/*.tsx'],
    extends: [
      jsxA11yPlugin.flatConfigs.recommended, //
      reactPlugin.configs.flat.recommended,
      reactPlugin.configs.flat['jsx-runtime'],
      reactHooksPlugin.configs['recommended-latest'],
    ],
    rules: {
      'react/no-unknown-property': ['error', { ignore: ['property', 'resource', 'typeof', 'vocab'] }],
      'react/prop-types': 'off',
    },
    settings: {
      formComponents: ['Form'],
      linkComponents: [
        { name: 'Link', linkAttribute: 'to' },
        { name: 'NavLink', linkAttribute: 'to' },
      ],
      react: {
        version: 'detect',
      },
    },
  },
  //
  // unicorn plugin
  // https://github.com/sindresorhus/eslint-plugin-unicorn
  //
  unicornPlugin.configs.recommended,
  {
    rules: {
      'unicorn/consistent-function-scoping': ['error', { checkArrowFunctions: false }],
      'unicorn/no-array-callback-reference': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/no-lonely-if': 'off',
      'unicorn/no-negated-condition': 'off',
      'unicorn/no-nested-ternary': 'off',
      'unicorn/no-null': 'off',
      'unicorn/no-process-exit': 'off',
      'unicorn/no-useless-fallback-in-spread': 'off',
      'unicorn/no-useless-undefined': ['error', { checkArguments: false }],
      'unicorn/prefer-global-this': 'off',
      'unicorn/prefer-query-selector': 'off',
      'unicorn/prefer-spread': 'off',
      'unicorn/prefer-string-slice': 'off',
      'unicorn/prefer-structured-clone': 'off',
      'unicorn/prefer-ternary': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/switch-case-braces': 'off',
    },
  },
);
