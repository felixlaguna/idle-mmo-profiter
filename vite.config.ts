import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  base: '/idle-mmo-profiter/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Performance optimizations
    target: 'es2015', // Modern browsers for smaller bundle
    cssCodeSplit: true, // Split CSS for lazy-loaded components
    sourcemap: false, // Disable sourcemaps in production for smaller size
    minify: 'esbuild', // Fast and efficient minification
    rollupOptions: {
      output: {
        // Manual chunking for optimal code splitting
        manualChunks: {
          // Vendor chunk for stable dependencies
          'vue-vendor': ['vue'],
          // Chart.js in separate chunk (large library)
          'chart-vendor': ['chart.js', 'vue-chartjs'],
        },
        // Optimized chunk file naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Chunk size warning limit
    chunkSizeWarningLimit: 600,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: process.env.VITE_ALLOWED_HOSTS
      ? process.env.VITE_ALLOWED_HOSTS.split(',').map((h) => h.trim())
      : [],
    watch: {
      usePolling: true, // Required for HMR in Docker with volume mounts
    },
    proxy: {
      '/api': {
        target: 'https://api.idle-mmo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/tests/setup.ts',
  },
})
