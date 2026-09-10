import path from 'path';
import { fileURLToPath } from 'url';

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import react from 'eslint-plugin-react';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const eslint = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'api/dist/**',
      'web/dist/**',
      'worker/dist/**',
    ],
  },
  ...compat.extends('eslint:recommended'),
  ...compat.extends('plugin:react/recommended'),
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
    plugins: {
      react,
      import: importPlugin,
      eslintPluginReactHooks,
      '@stylistic': stylistic,
      '@typescript-eslint': tsPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          noWarnOnMultipleProjects: true,
          project: [
            'tsconfig.base.json',
            'api/tsconfig.json',
            'web/tsconfig.json',
            'shared/tsconfig.json',
            'worker/tsconfig.json',
          ],
        },
      },
      'import/internal-regex': '^@(api|shared|web|worker)/',
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'import/prefer-default-export': 0,
      'import/extensions': 0,
      'import/no-unresolved': 0,
      'import/no-duplicates': [
        'error',
        {
          'prefer-inline': true,
        },
      ],
      'react/prop-types': 0,
      'no-console': 0,
      'react/require-default-props': 0,
      'react/react-in-jsx-scope': 0,
      'react/jsx-props-no-spreading': 0,
      'import/no-extraneous-dependencies': 'off',
      'class-methods-use-this': 'off',
      'consistent-return': 'off',
      'no-shadow': 'off',
      'no-return-assign': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-shadow': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/array-type': [
        'error',
        {
          default: 'array',
          readonly: 'array',
        },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          // type-only → отдельный `import type` (в конце группы через import/order);
          // value+type → inline `type` в value-импорте
          fixStyle: 'separate-type-imports',
          disallowTypeAnnotations: false,
        },
      ],
      'import/consistent-type-specifier-style': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          suffix: ['Interface'],
        },
      ],
      '@stylistic/member-delimiter-style': [
        'error',
        {
          multiline: {
            delimiter: 'semi',
            requireLast: true,
          },
          singleline: {
            delimiter: 'semi',
            requireLast: true,
          },
        },
      ],
      'no-underscore-dangle': [
        2,
        {
          allow: ['__filename', '__dirname'],
        },
      ],
      'react/function-component-definition': [
        2,
        {
          namedComponents: 'arrow-function',
          unnamedComponents: 'arrow-function',
        },
      ],
      'react/jsx-filename-extension': [
        1,
        {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      ],
      'linebreak-style': 0,
      'no-param-reassign': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'max-len': 'off',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'UnaryExpression[operator="void"] > CallExpression',
          message: 'Do not use void before function calls. Use direct call; handle async errors with try/catch or .catch().',
        },
      ],
      indent: 'off',
      semi: 'off',
      quotes: 'off',
      'comma-dangle': 'off',
      'no-extra-semi': 'off',
      '@stylistic/indent': ['error', 2],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/no-extra-semi': 'error',
      '@stylistic/arrow-parens': ['error', 'as-needed'],
      'eol-last': ['error', 'always'],
      'key-spacing': [
        'error',
        {
          beforeColon: false,
          afterColon: true,
          mode: 'minimum',
        },
      ],
      'object-curly-spacing': ['error', 'always'],
      '@stylistic/object-curly-newline': 'off',
      'comma-spacing': [
        'error',
        {
          before: false,
          after: true,
        },
      ],
      'array-bracket-spacing': ['error', 'never'],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*', './*'],
              message: 'Use path aliases (@api, @shared, @web, @worker) instead of relative imports.',
            },
          ],
        },
      ],
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
            'object',
            'type',
          ],
          pathGroups: [
            {
              pattern: '@api/**',
              group: 'internal',
            },
            {
              pattern: '@shared/**',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@web/**',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@worker/**',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin', 'external', 'type'],
          distinctGroup: true,
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },
  {
    files: ['**/*.{spec,e2e-spec,test}.{ts,tsx,js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/naming-convention': 'off',
    },
  },
  {
    files: ['api/src/**/*.ts', 'worker/src/**/*.ts'],
    rules: {
      // value-import классов нужен для emitDecoratorMetadata / @Inject
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];

export default eslint;
