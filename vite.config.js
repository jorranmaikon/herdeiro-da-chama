import { defineConfig } from 'vite';

// Base path precisa bater com o nome do repositório, já que o GitHub Pages
// de projeto (não de usuário) publica em: https://<usuario>.github.io/<repo>/
export default defineConfig({
  base: '/herdeiro-da-chama/',
  build: {
    outDir: 'dist',
  },
});
