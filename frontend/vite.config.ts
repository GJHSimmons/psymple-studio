import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// The backend origin the dev server proxies `/api` to. Override with
// VITE_BACKEND_ORIGIN if uvicorn runs elsewhere (default: `.claude/launch.json`
// `backend-dev` on :8000).
const backendOrigin = process.env.VITE_BACKEND_ORIGIN ?? 'http://localhost:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // The engine client calls same-origin `/api/*`; forward to the backend,
      // stripping `/api` since its routes live at the root (`/compile`, `/simulate`).
      '/api': {
        target: backendOrigin,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
