import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import * as parserVue from 'vue-eslint-parser'
import * as parserTypeScript from '@typescript-eslint/parser'
import pluginTypeScript from '@typescript-eslint/eslint-plugin'
import prettier from 'eslint-config-prettier'

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  prettier,
  {
    files: ['**/*.{ts,tsx,vue}'],
    languageOptions: {
      parser: parserVue,
      parserOptions: {
        parser: parserTypeScript,
        sourceType: 'module',
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        // Browser types
        Headers: 'readonly',
        RequestInit: 'readonly',
        Response: 'readonly',
        DOMException: 'readonly',
        DOMRect: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',
        Event: 'readonly',
        // Base64 encoding/decoding (standard browser globals)
        atob: 'readonly',
        btoa: 'readonly',
        // Canvas / image processing globals
        ImageData: 'readonly',
        CanvasRenderingContext2D: 'readonly',
        CanvasImageSource: 'readonly',
        OffscreenCanvas: 'readonly',
        Image: 'readonly',
        HTMLImageElement: 'readonly',
        createImageBitmap: 'readonly',
        // Event types
        DragEvent: 'readonly',
        ClipboardEvent: 'readonly',
        DataTransfer: 'readonly',
        // Element types
        HTMLSelectElement: 'readonly',
        // Node globals (for vite.config.ts)
        process: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': pluginTypeScript,
    },
    rules: {
      ...pluginTypeScript.configs.recommended.rules,
      'vue/multi-word-component-names': 'off',
      'preserve-caught-error': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/tests/**/*.{ts,tsx}', 'src/components/__tests__/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        // Vitest globals
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        // Node/DOM globals
        global: 'readonly',
        Storage: 'readonly',
        // Browser/DOM types used in test mocks
        PredefinedColorSpace: 'readonly',
        performance: 'readonly',
        HTMLButtonElement: 'readonly',
        atob: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: ['dist', 'dist.old', 'dist-*', 'node_modules', 'scripts'],
  },
]
