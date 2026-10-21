import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    react(),
    basicSsl()
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
        }
      }
    }
  }
});
