/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import viteImagemin from 'vite-plugin-imagemin'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Image compression - disabled by default due to large image assets causing build hangs
    // Enable by removing SKIP_IMAGE_COMPRESSION or setting it to false
    ...(process.env.SKIP_IMAGE_COMPRESSION !== 'true' && 
        process.env.NODE_ENV === 'production' &&
        process.env.ENABLE_IMAGE_COMPRESSION === 'true'
      ? [
          viteImagemin({
            verbose: true,
            // Fast settings to prevent build hanging with large images
            gifsicle: {
              optimizationLevel: 3,
              interlaced: false,
            },
            optipng: {
              optimizationLevel: 3,
            },
            mozjpeg: {
              quality: 75,
            },
            pngquant: {
              quality: [0.8, 0.9],
              speed: 1, // Fastest speed
            },
            svgo: {
              plugins: [
                {
                  name: 'removeViewBox',
                  active: false,
                },
                {
                  name: 'removeEmptyAttrs',
                  active: false,
                },
              ],
            },
            webp: false, // Disable WebP generation to speed up builds
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'globalThis',
  },
  esbuild: {
    target: 'esnext',
  },
  server: {
    port: 3000,
    host: true,
    fs: {
      strict: false,
    },
  },
  optimizeDeps: {
    include: ['laravel-echo', 'pusher-js'],
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/tests/', '*.config.ts', '*.config.js'],
    },
  },
})

