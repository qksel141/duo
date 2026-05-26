import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const API_TARGET = 'http://127.0.0.1:3000'

const proxyConfig = {
  target: API_TARGET,
  changeOrigin: true,
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // localhost / 127.0.0.1 모두 접속 가능 (Windows IPv6 단독 바인딩 방지)
    host: true,
    proxy: {
      '/users': proxyConfig,
      '/health': proxyConfig,
      '/chats': proxyConfig,
      '/reports': proxyConfig,
      '/matches': proxyConfig,
      '/ratings': proxyConfig,
    },
  },
})