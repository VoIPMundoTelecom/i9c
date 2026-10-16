// @ts-check
import { defineConfig } from 'astro/config';

// URLs mantidas iguais às do site estático: /planos-black.html etc. (build.format 'file').
export default defineConfig({
  site: 'https://i9c.net.br',
  build: { format: 'file' },
  trailingSlash: 'ignore',
});
