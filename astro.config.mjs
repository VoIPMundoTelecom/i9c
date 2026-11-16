// @ts-check
import { defineConfig } from 'astro/config';
import { renameSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Com build.format 'file', src/pages/en/index.astro vira dist/en.html, e o GitHub Pages só
 * responde /en/ com dist/en/index.html. Este passo move a home de cada idioma para lá
 * (a URL pública é /en/ e /es/, a mesma de src/i18n/rotas.ts). O índice do blog vai junto:
 * dist/blog.html → dist/blog/index.html (URL /blog/; os posts ficam em /blog/<slug>.html).
 */
const homesDosIdiomas = (pastas) => ({
  name: 'i9c-homes-idiomas',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const dist = fileURLToPath(dir);
      for (const i of pastas) {
        const de = `${dist}${i}.html`;
        if (!existsSync(de)) throw new Error(`índice de /${i}/ não gerado (${de})`);
        mkdirSync(`${dist}${i}`, { recursive: true });
        renameSync(de, `${dist}${i}/index.html`);
      }
    },
  },
});

// URLs mantidas iguais às do site estático: /planos-black.html etc. (build.format 'file').
// i18n: pt-br sem prefixo (URLs atuais intactas); en e es em /en/ e /es/.
// Slugs traduzidos e hreflang: tabela única em src/i18n/rotas.ts.
export default defineConfig({
  site: 'https://i9c.net.br',
  build: { format: 'file' },
  trailingSlash: 'ignore',
  i18n: {
    defaultLocale: 'pt-br',
    locales: ['pt-br', 'en', 'es'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [homesDosIdiomas(['en', 'es', 'blog'])],
});
