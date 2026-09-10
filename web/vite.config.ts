import path from 'path';
import { fileURLToPath } from 'url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/sorting-table/',
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      '@web': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    host: true,
    port: 4001,
    proxy: {
      '/sorting-table/api': {
        target: 'http://127.0.0.1:3019',
        changeOrigin: true,
        rewrite: requestPath => requestPath.replace(/^\/sorting-table/, ''),
      },
    },
  },
  preview: {
    port: 4001,
  },
});
