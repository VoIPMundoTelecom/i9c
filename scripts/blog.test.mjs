// Teste pós-build do blog: npm run build && npm run test:blog
// Índice /blog/ com todas as entradas (inclusive os artigos que já eram páginas, na URL de sempre),
// post com datas, autor, JSON-LD BlogPosting + BreadcrumbList, OG image e "Continue navegando",
// RSS válido, sitemap e link "Blog" no topo e no rodapé.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const DIST = new URL('../dist/', import.meta.url);
const CONTEUDO = new URL('../src/content/blog/', import.meta.url);
const ler = (rel) => readFileSync(new URL(rel, DIST), 'utf8');
const existe = (rel) => existsSync(new URL(rel.replace(/^\//, ''), DIST));
const temBuild = existsSync(new URL('blog/index.html', DIST));
const opts = { skip: !temBuild && 'rode npm run build' };
const SITE = 'https://i9c.net.br';
const jsonld = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));

/** entradas da coleção (frontmatter mínimo, sem dependência) */
const todasEntradas = readdirSync(CONTEUDO)
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const fm = readFileSync(new URL(f, CONTEUDO), 'utf8').match(/^---\n([\s\S]*?)\n---/)[1];
    const campo = (k) => fm.match(new RegExp(`^${k}:\\s*'?([^'\\n]*)'?`, 'm'))?.[1];
    return { id: f.replace(/\.md$/, ''), url: campo('url'), rascunho: campo('rascunho') === 'true', publicado: campo('publicado') };
  });
const entradas = todasEntradas.filter((e) => !e.rascunho);
const rascunhos = todasEntradas.filter((e) => e.rascunho);
const caminhoDe = (e) => e.url ?? `/blog/${e.id}.html`;
const arquivoDe = (e) => (e.url === '/' ? 'index.html' : caminhoDe(e).replace(/^\//, ''));
const posts = entradas.filter((e) => !e.url);

const ARTIGOS_EXISTENTES = [
  '/operadoras-virtuais-no-brasil.html',
  '/qual-operadora-tem-a-maior-cobertura.html',
  '/operadora-pode-cancelar-numero-por-falta-de-recarga.html',
  '/como-trazer-seu-numero-para-a-i9c.html',
  '/chip-so-whatsapp.html',
  '/portabilidade.html',
];

test('os 6 artigos que já existiam estão na coleção com a URL de sempre (sem página nova)', () => {
  for (const u of ARTIGOS_EXISTENTES) assert.ok(entradas.some((e) => e.url === u), `falta ${u} na coleção`);
});

test('/blog/ sai em blog/index.html e lista todas as entradas, mais recente primeiro', opts, () => {
  assert.ok(!existe('blog.html'), 'dist/blog.html não devia sobrar (vai para blog/index.html)');
  const html = ler('blog/index.html');
  const lista = html.match(/data-blog-lista[\s\S]*?<\/ol>/)[0];
  const hrefs = [...lista.matchAll(/<a href="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(hrefs.length, entradas.length);
  for (const e of entradas) assert.ok(hrefs.includes(caminhoDe(e)), `índice sem ${caminhoDe(e)}`);
  const datas = [...lista.matchAll(/<li data-cat="[^"]+">[\s\S]*?datetime="([\d-]+)"/g)].map((m) => m[1]);
  assert.deepEqual(datas, [...datas].sort().reverse(), 'índice fora de ordem de data');
  assert.match(html, /<link rel="canonical" href="https:\/\/i9c\.net\.br\/blog\/"/);
  assert.match(html, /application\/rss\+xml/);
});

test('cada entrada aponta para uma página que existe no build', opts, () => {
  for (const e of entradas) assert.ok(existe(arquivoDe(e)), `sem ${arquivoDe(e)}`);
});

test('post: datas visíveis, autor, BlogPosting + BreadcrumbList, OG e Continue navegando', opts, () => {
  assert.ok(posts.length > 0);
  for (const e of posts) {
    const html = ler(arquivoDe(e));
    const url = SITE + caminhoDe(e);
    const s = jsonld(html);
    const bp = s.find((x) => x['@type'] === 'BlogPosting');
    assert.ok(bp, `${e.id}: sem BlogPosting`);
    assert.equal(bp.author.name, 'Equipe Grupo IVM');
    assert.equal(bp.datePublished, e.publicado);
    assert.equal(bp.mainEntityOfPage, url);
    const bc = s.find((x) => x['@type'] === 'BreadcrumbList');
    assert.deepEqual(bc.itemListElement.map((i) => i.item), [`${SITE}/`, `${SITE}/blog/`, url]);
    assert.match(html, new RegExp(`Por Equipe Grupo IVM · publicado em <time datetime="${e.publicado}"`));
    const og = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    assert.ok(og && existe(new URL(og).pathname), `${e.id}: og:image ausente no build`);
    const cont = html.match(/data-continue-navegando[\s\S]*?<\/section>/)[0];
    const links = [...cont.matchAll(/<li[^>]*>\s*<a href="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(links.length, 3, `${e.id}: Continue navegando precisa de 2 posts + produto`);
    assert.ok(!links.includes(caminhoDe(e)), 'Continue navegando apontando para o próprio post');
  }
});

test('OG image de todas as entradas e do índice é PNG 1200×630', opts, () => {
  for (const id of ['blog', ...entradas.map((e) => e.id)]) {
    const b = readFileSync(new URL(`blog/og/${id}.png`, DIST));
    assert.equal(b.toString('latin1', 1, 4), 'PNG', id);
    assert.equal(b.readUInt32BE(16), 1200, id);
    assert.equal(b.readUInt32BE(20), 630, id);
  }
  for (const u of ARTIGOS_EXISTENTES) {
    const og = ler(u.slice(1)).match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    assert.ok(og && existe(new URL(og).pathname), `${u}: sem og:image`);
  }
});

test('RSS /blog/rss.xml: RSS 2.0 com um item por entrada', opts, () => {
  const xml = ler('blog/rss.xml');
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>\n<rss version="2\.0"/);
  assert.match(xml, /<atom:link href="https:\/\/i9c\.net\.br\/blog\/rss\.xml" rel="self"/);
  // sem & solto (XML mal formado)
  assert.ok(!/&(?!amp;|lt;|gt;|quot;|apos;)/.test(xml), '& sem escape no RSS');
  const itens = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  assert.equal(itens.length, entradas.length);
  for (const e of entradas) {
    const item = itens.find((i) => i.includes(`<link>${SITE}${caminhoDe(e)}</link>`));
    assert.ok(item, `RSS sem ${caminhoDe(e)}`);
    const pub = item.match(/<pubDate>([^<]+)<\/pubDate>/)[1];
    assert.ok(!Number.isNaN(Date.parse(pub)), `pubDate inválido: ${pub}`);
    assert.match(item, /<title>[^<]+<\/title>/);
    assert.match(item, /<guid isPermaLink="true">/);
  }
});

test('sitemap tem /blog/ e todas as entradas', opts, () => {
  const sm = ler('sitemap.xml');
  assert.ok(sm.includes(`<loc>${SITE}/blog/</loc>`));
  for (const e of entradas) assert.ok(sm.includes(`<loc>${SITE}${caminhoDe(e)}</loc>`), `sitemap sem ${caminhoDe(e)}`);
});

test('link "Blog" no topo e no rodapé (pt, en, es)', opts, () => {
  for (const p of ['index.html', 'en/index.html', 'es/index.html', 'planos-black.html']) {
    const html = ler(p);
    assert.match(html.match(/<header[\s\S]*?<\/header>/)[0], /href="\/blog\/"/, `${p}: topo sem Blog`);
    assert.match(html.match(/<footer[\s\S]*?<\/footer>/)[0], /href="\/blog\/"/, `${p}: rodapé sem Blog`);
  }
  assert.match(ler('blog/index.html').match(/<header[\s\S]*?<\/header>/)[0], /href="\/blog\/"[^>]*aria-current="page"/);
});

test('página-pilar lista os guias do cluster (GuiasBlog)', opts, () => {
  const html = ler('portabilidade.html');
  assert.match(html, /id="guias"/);
  assert.ok(html.includes('href="/como-trazer-seu-numero-para-a-i9c.html"'));
});

test('rascunho fica fora: sem página, sem OG, fora do índice, RSS, sitemap e GuiasBlog', opts, () => {
  const indice = ler('blog/index.html');
  const rss = ler('blog/rss.xml');
  const sm = ler('sitemap.xml');
  const empresas = ler('planos-empresas.html');
  for (const e of rascunhos) {
    const caminho = caminhoDe(e);
    if (!e.url) assert.ok(!existe(arquivoDe(e)), `${e.id}: rascunho gerou ${arquivoDe(e)}`);
    assert.ok(!existe(`blog/og/${e.id}.png`), `${e.id}: rascunho gerou OG`);
    for (const [nome, txt] of [['índice', indice], ['RSS', rss], ['sitemap', sm], ['planos-empresas', empresas]])
      assert.ok(!txt.includes(caminho), `${e.id}: rascunho aparece no ${nome}`);
  }
});
