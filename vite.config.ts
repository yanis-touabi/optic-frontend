import dotenv from 'dotenv';
dotenv.config({ path: './app.env' });
import fs from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
    https: {
      key: fs.readFileSync(
        path.resolve(__dirname, './certs/optic-order-dev.key'),
      ),
      cert: fs.readFileSync(
        path.resolve(__dirname, './certs/optic-order-dev.pem'),
      ),
    },
    allowedHosts: ['optic-best-vision.com', '192.168.100.5', 'localhost'],
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === 'development' && componentTagger()].filter(
    Boolean,
  ),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      '@tanstack/react-query',
      '@tanstack/query-core',
    ],
  },
}));
