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
  }
});
