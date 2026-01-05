import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false, // Desabilita injeção automática para evitar erro no iframe do preview
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'icon.svg'],
        manifest: {
          name: 'Lista de Compras Inteligente',
          short_name: 'FamilyCart',
          description: 'Gerencie suas compras em família com inteligência artificial.',
          theme_color: '#4f46e5',
          background_color: '#f8fafc',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            {
              src: '/icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            },
            {
              src: '/icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      'process.env': {} 
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});