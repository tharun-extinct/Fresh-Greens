import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ['react', 'react-dom', '@tanstack/react-query', '@tanstack/query-core'],
    alias: {
      '@shared': resolve(__dirname, '../customer-portal/src'),
      react: resolve(__dirname, 'node_modules/react'),
      'react-dom': resolve(__dirname, 'node_modules/react-dom'),
      '@tanstack/react-query': resolve(__dirname, 'node_modules/@tanstack/react-query'),
      '@tanstack/query-core': resolve(__dirname, 'node_modules/@tanstack/query-core'),
    },
  },
  server: {
    port: 5174,
    fs: {
      allow: ['..'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
