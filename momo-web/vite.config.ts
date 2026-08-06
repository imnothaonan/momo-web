import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 开发环境将 /api 代理到 BFF（Hono，端口 8787）
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8787', changeOrigin: true },
    },
  },
})
