import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        process: 'readonly',
        navigator: 'readonly',
        FormData: 'readonly',
        URLSearchParams: 'readonly',
        Date: 'readonly',
        Promise: 'readonly',
        Event: 'readonly',
        MessageEvent: 'readonly',
        clearTimeout: 'readonly',
        alert: 'readonly',
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': 'warn',
      'no-undef': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
