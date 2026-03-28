const expoConfig = require('eslint-config-expo/flat');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const reactHooks = require('eslint-plugin-react-hooks');

module.exports = [
  {
    ignores: ["scripts/reset-project.js", "node_modules", ".expo"],
  },

  ...expoConfig,

  {
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
    },

    rules: {
      // 🔥 Make existing stricter
      '@typescript-eslint/no-unused-vars': 'error',
      'no-console': 'error',

      // 🔥 REAL bug catchers
      'eqeqeq': 'error',
      'no-undef': 'error',
      'no-unreachable': 'error',
      'no-constant-condition': 'warn',

      // 🔥 React specific (VERY important)
      'react-hooks/exhaustive-deps': 'error',

      // 🔥 TypeScript power rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },
];