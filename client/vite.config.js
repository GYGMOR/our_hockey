import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Im Dev-Modus läuft das Frontend auf :5173 und das Backend auf :3001.
// Der Proxy leitet alle /api-Anfragen ans Backend weiter -> kein CORS-Ärger.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3001' },
  },
});
