import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
          },
        },
      },
    },
    server: {
      port: 3002,
      // In dev the app calls /medicare/* on its own origin and Vite forwards
      // it to the backend — no CORS change needed on the API for local work.
      proxy: {
        '/medicare': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:3000',
          changeOrigin: true,
          // The browser's Origin (http://localhost:3002) would still be
          // forwarded and rejected by the backend's CORS allow-list. A
          // proxied request is server-to-server, so drop it.
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'));
          },
        },
      },
    },
  };
});
