import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// SVG Icon Data URI - Minimalist Shopping Bag with Checkmark (Indigo 600)
const iconSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath fill='%234f46e5' d='M152 128C152 70.5 198.5 24 256 24S360 70.5 360 128H464C490.5 128 512 149.5 512 176V448C512 474.5 490.5 496 464 496H48C21.5 496 0 474.5 0 448V176C0 149.5 21.5 128 48 128H152zM256 64C220.7 64 192 92.7 192 128H320C320 92.7 291.3 64 256 64zM169 313l-9-9c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l26 26c9.4 9.4 24.6 9.4 33.9 0l90-90c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-73 73z'/%3E%3C/svg%3E`;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate', // Atualiza o app automaticamente quando houver nova versão
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Lista de Compras Inteligente',
          short_name: 'ListaCompras',
          description: 'Gerencie suas compras em família com inteligência artificial.',
          theme_color: '#4f46e5', // Cor da barra de status (indigo-600)
          background_color: '#f8fafc', // Cor de fundo da splash screen (slate-50)
          display: 'standalone', // Remove a barra de navegação do browser
          orientation: 'portrait',
          start_url: '/',
          icons: [
            {
              src: iconSvg,
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            },
            {
              src: iconSvg,
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Fix for "Uncaught ReferenceError: process is not defined" in browser
      'process.env': {} 
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});