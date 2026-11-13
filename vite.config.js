import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'CubeMaster AI — Speedcubing Trainer & Solver',
        short_name: 'CubeMaster',
        description: "100% Client-Side Rubik's Cube Camera Solver, CFOP Trainer & WCA Speedcubing Timer.",
        theme_color: '#F8F9FA',
        background_color: '#F8F9FA',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ],
  server: {
    host: true, // Listen on all network addresses (0.0.0.0) so phones on the same Wi-Fi can connect
    port: 3000,
    open: true
  },
  test: {
    testTimeout: 30000
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (normalized.includes('node_modules/three')) return 'three';
          if (normalized.includes('node_modules/lucide-react')) return 'lucide';
          if (normalized.includes('node_modules/react') || normalized.includes('node_modules/react-dom')) return 'react-vendor';
          if (normalized.includes('/src/data/algorithms/')) return 'alg-database';
        }
      }
    }
  }
});
