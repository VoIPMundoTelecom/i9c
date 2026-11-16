// Avisa os buscadores (IndexNow: Bing, Yandex, Seznam, Naver…) das URLs que mudaram no último push.
// Google não usa IndexNow: para ele vale o sitemap-index.xml (robots.txt) + Search Console (docs/seo/INDEXAR.md).
// Mesmo padrão do voipmundo-site (scripts/indexnow.mjs), com as URLs .html da i9c.
// Uso: node scripts/indexnow.mjs <arquivo1> <arquivo2> …   (caminhos relativos à raiz do repo)
//      node scripts/indexnow.mjs --dry <arquivos…>          (só lista as URLs, não envia)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { ROTAS } from '../src/i18n/rotas.ts';

const HOST = 'i9c.net.br';
const KEY = readdirSync('public').find((f) => /^[0-9a-f]{32}\.txt$/.test(f))?.replace('.txt', '');
if (!KEY) { console.error('chave IndexNow não encontrada em public/'); process.exit(1); }

const args = process.argv.slice(2);
const dry = args[0] === '--dry';
const arquivos = dry ? args.slice(1) : args;

// Páginas que não vão para buscador (noindex).
const FORA = /(^|\/)(404|manutencao)$/;

/** caminho da página sem extensão (ex.: 'planos-black', 'en/index') → URL pública */
const urlDaPagina = (p) => {
  if (FORA.test(p) || p.includes('[')) return null;
  if (p === 'index') return '/';
  if (/^(en|es)\/index$/.test(p)) return `/${p.slice(0, 2)}/`;
  if (p === 'blog/index') return '/blog/';
  return `/${p}.html`;
};

const urls = new Set();
for (const f of arquivos) {
  let m;
  if ((m = f.match(/^src\/content\/blog\/(.+)\.md$/))) {
    // Post com `url:` no frontmatter aponta para página que já existe; sem `url:`, vira /blog/<slug>.html.
    const fm = existsSync(f) ? readFileSync(f, 'utf8').match(/^url:\s*['"]?([^'"\n]+)/m) : null;
    urls.add(fm ? fm[1].trim() : `/blog/${m[1]}.html`);
    urls.add('/blog/');
  } else if ((m = f.match(/^src\/pages\/(.+)\.astro$/))) {
    const u = urlDaPagina(m[1]);
    if (u) urls.add(u);
  } else if ((m = f.match(/^src\/partials\/(?:(en|es)\/)?([^/]+)\.(head|body|end)\.html$/))) {
    // Partials en/es usam o nome da página pt-br; o slug no idioma sai de src/i18n/rotas.ts.
    const [, idioma, nome] = m;
    const rota = nome === 'index' ? 'home' : nome;
    // Partial com "_" (ex.: _organization) entra em todas as páginas: avisa a home.
    const u = nome.startsWith('_') ? '/' : idioma ? ROTAS[rota]?.[idioma] : urlDaPagina(nome);
    if (u) urls.add(u);
  } else if (/^src\/data\//.test(f)) urls.add('/');
}
const urlList = [...urls].map((u) => `https://${HOST}${u}`);
if (!urlList.length) { console.log('nada a avisar'); process.exit(0); }
if (dry) { console.log(urlList.join('\n')); process.exit(0); }

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
});
console.log(`IndexNow ${res.status}:`, urlList.join(' '));
if (res.status >= 400) process.exit(1);
