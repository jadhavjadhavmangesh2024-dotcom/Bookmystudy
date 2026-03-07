import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pages from '@hono/vite-cloudflare-pages'

export default defineConfig(({ mode }) => {
  if (mode === 'client') {
    return {
      plugins: [react()],
      build: {
        rollupOptions: {
          input: './src/client/main.tsx',
          output: {
            entryFileNames: 'static/main.js',
            chunkFileNames: 'static/chunks/[name]-[hash].js',
            assetFileNames: 'static/assets/[name]-[hash][extname]',
          }
        },
        outDir: 'dist',
        emptyOutDir: false
      }
    }
  }
  // Server build (Hono backend)
  return {
    plugins: [pages()],
    build: {
      outDir: 'dist',
      emptyOutDir: true
    }
  }
})
