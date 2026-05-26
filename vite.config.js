import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/users': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
      '/chats': 'http://localhost:3000',
      '/reports': 'http://localhost:3000',
      '/matches': 'http://localhost:3000',
      '/ratings': 'http://localhost:3000',
    },
  },
})