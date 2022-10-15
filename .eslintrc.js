/*
 *  An explanation:
 *
 *  While migration from javascript to typescript is on-going, it is preferable
 *  to maintain the "old" eslint rules we used against javascript exactly as
 *  they were.
 *
 *  This means that eslint must treat .ts files differently from .js, similar
 *  to how we treat jest specifications differently.
 *
 *  To do this we specify each "mode" as a separate override, with no default
 *  configuration.
*/

const { rules: airbnbStyleRules } = require('eslint-config-airbnb-base/rules/style');

// https://eslint.org/docs/user-guide/configuring

const js = {
  files: ['**/*.js'],
  extends: [
    'plugin:import/typescript', // allow js import of ts modules
    'airbnb-base',
  ],
  rules: {
    // style
    'object-curly-newline': [
      'error',
      {
        ...airbnbStyleRules['object-curly-newline'][1],
        // eslint-import enforces/corrects imports so minimise the screen-estate imports take up
        ImportDeclaration: 'never',
        ExportDeclaration: 'never',
      },
    ],
  },
};

const ts = {
  files: ['**/*.ts'],
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  parserOptions: {
    project: './tsconfig.eslint.json',
  },
  rules: {
    ...js.rules,
  },
};

const jest = {
  files: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.test.ts',
    '**/__mocks__/**/*.js',
    '**/__mocks__/**/*.ts',
  ],
  env: { jest: true },
  extends: ['plugin:jest/recommended', 'plugin:jest/style'],
  rules: { // https://github.com/jest-community/eslint-plugin-jest#rules
    'jest/consistent-test-it': ['warn'],
    'jest/max-nested-describe': ['warn'],
    'jest/no-duplicate-hooks': ['error'],
    // 'jest/no-hooks' - unnecessarily restrictive
    'jest/no-if': ['error'],
    'jest/no-large-snapshots': ['warn'],
    'jest/no-restricted-matchers': [
      'error',
      {
        toBeFalsy: null,
        'not.toHaveBeenCalledWith': null,
      },
    ],
    'jest/no-test-return-statement': ['error'],
    'jest/prefer-called-with': ['warn'],
    // 'jest/prefer-expect-assertions' - unnecessary given expect-expect
    'jest/prefer-expect-resolves': ['warn'],
    'jest/prefer-hooks-on-top': ['warn'],
    'jest/prefer-lowercase-title': ['warn'],
    'jest/prefer-spy-on': ['warn'],
    // 'jest/prefer-strict-equal' -  unnecessarily restrictive
    'jest/prefer-todo': ['warn'],
    // 'jest/require-hook' - if anything, avoid hooks
    // 'jest/require-to-throw-message' - unnecessarily restrictive
    // 'jest/require-top-level-describe' - unnecessary given test-runner filenames
  },
  globals: {
    m: 'readonly',
  },
};

module.exports = {
  overrides: [js, ts, jest],
  reportUnusedDisableDirectives: true,
};
