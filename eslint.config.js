import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import designSystem from './tools/eslint-plugin-design-system.js'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Design-system enforcement across app source.
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'design-system': designSystem },
    rules: {
      'design-system/no-hardcoded-colors': 'error',
      'design-system/no-raw-ui-elements': 'warn',
    },
  },
  {
    // The shared UI layer defines the primitives, so it may use raw
    // <button>/<input> (that's what Button/Input wrap). Color rule still applies.
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'design-system/no-raw-ui-elements': 'off',
    },
  },
])
