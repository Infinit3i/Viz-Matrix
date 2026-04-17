import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/Viz-Matrix/',
  plugins: [vue(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
