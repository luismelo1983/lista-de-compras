import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente baseadas no modo atual (development/production)
  // O terceiro argumento '' permite carregar todas as variáveis do sistema (como as do Netlify)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // Define substituições globais de constantes
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});