// Auditoria "Continue navegando": links internos no conteúdo principal (<main>) de cada página do dist/.
// Menu (Header) e rodapé (Footer) ficam fora do <main>, então não contam.
// Uso: npm run build && node scripts/links-internos.mjs   (imprime a tabela em Markdown)
// O teste (scripts/continue-navegando.test.mjs) usa as mesmas funções.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const SITE = 'https://i9c.net.br';

export function* paginas(dir = DIST) {
  for (const n of readdirSync(dir).sort()) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) yield* paginas(p);
    else if (n.endsWith('.html')) yield p;
  }
}

/** href aponta para outra página do próprio site? (âncora, tel:, mailto:, WhatsApp e domínios de fora não contam) */
export function interno(href) {
  if (!href || href.startsWith('#')) return false;
  if (href.startsWith(SITE)) href = href.slice(SITE.length) || '/';
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) return false;
  const caminho = href.split(/[?#]/)[0];
  return caminho !== '' && !/\.(png|jpe?g|webp|svg|pdf|ico|xml|txt)$/i.test(caminho);
}

const hrefs = (html) => [...html.matchAll(/<a\b[^>]*?\shref\s*=\s*"([^"]*)"/gi)].map((m) => m[1].replace(/&amp;/g, '&'));

/** caminho comparável: sem domínio, query, âncora, ".html" e "index" (/planos-black.html = /planos-black) */
export const normalizar = (href) =>
  (href.startsWith(SITE) ? href.slice(SITE.length) || '/' : href).split(/[?#]/)[0]
    .replace(/\.html$/, '').replace(/\/index$/, '/').replace(/(.)\/$/, '$1');

/** páginas internas distintas para onde o trecho leva (sem contar a própria página) */
const destinos = (html, propria) =>
  [...new Set(hrefs(html).filter(interno).map(normalizar))].filter((d) => d !== propria);

/** { conteudo: destinos internos do conteúdo da página, bloco: destinos do bloco Continue navegando, ... } */
export function auditar(caminho) {
  const html = readFileSync(caminho, 'utf8');
  const pagina = relative(DIST, caminho);
  const propria = normalizar('/' + pagina);
  const main = html.match(/<main\b[^>]*>([\s\S]*)<\/main>/i)?.[1] ?? '';
  const bloco = main.match(/<section\b[^>]*data-continue-navegando[^>]*>[\s\S]*?<\/section>/i)?.[0] ?? '';
  const conteudo = main.replace(bloco, '');
  return {
    pagina,
    noindex: /<meta name="robots" content="noindex/i.test(html),
    temBloco: bloco !== '',
    conteudo: destinos(conteudo, propria).length,
    bloco: destinos(bloco, propria).length,
    internosBloco: hrefs(bloco).filter(interno),
    externosBloco: hrefs(bloco).filter((h) => !interno(h)),
    tagsExternas: [...bloco.matchAll(/<a\b[^>]*href="https?:[^"]*"[^>]*>/gi)].map((m) => m[0]),
    total: destinos(main, propria).length,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const linhas = [...paginas()].map(auditar);
  console.log('| Página | Páginas internas linkadas no conteúdo | No bloco "Continue navegando" | Total distinto no <main> |');
  console.log('|---|---:|---:|---:|');
  for (const l of linhas) {
    const marca = l.total === 0 ? ' **(sem saída)**' : '';
    console.log(`| ${l.pagina}${l.noindex ? ' (noindex)' : ''} | ${l.conteudo} | ${l.bloco} | ${l.total}${marca} |`);
  }
  const sem = linhas.filter((l) => l.total === 0).length;
  console.log(`\n${linhas.length} páginas · ${sem} sem link interno no conteúdo`);
}
