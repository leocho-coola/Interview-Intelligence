import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: ['.sandbox.novita.ai'],
        hmr: {
          protocol: 'wss',
          host: '3000-iuyzw3jp6wha8oyxbeghb-de59bda9.sandbox.novita.ai',
          clientPort: 443,
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY': JSON.stringify(env.GOOGLE_CALENDAR_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
