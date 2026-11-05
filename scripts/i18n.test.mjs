// Teste pós-build das versões en/es: npm run build && npm run test:i18n
// hreflang recíproco + x-default, canonical próprio, <html lang>, sitemaps por idioma,
// 404 por idioma, aviso das páginas jurídicas e preços iguais aos do pt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROTAS, IDIOMAS, HREFLANG, SITE, PAGINA_404 } from '../src/i18n/rotas.ts';

const DIST = new URL('../dist/', import.meta.url).pathname;
/** caminho da URL → arquivo no dist (build.format 'file': / → index.html, /en/ → en/index.html) */
const arquivo = (url) => join(DIST, url.endsWith('/') ? `${url}index.html` : url);
const ler = (url) => readFileSync(arquivo(url), 'utf8');
const attr = (tag, nome) => tag.match(new RegExp(`\\s${nome}="([^"]*)"`))?.[1];

function alternates(html) {
  const mapa = {};
  for (const [tag] of html.matchAll(/<link\b[^>]*rel="alternate"[^>]*>/g)) {
    const h = attr(tag, 'hreflang');
    if (h) { assert.ok(!(h in mapa), `hreflang ${h} repetido`); mapa[h] = attr(tag, 'href'); }
  }
  return mapa;
}
const canonicalDe = (html) => [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/g)].map(([t]) => attr(t, 'href'));
const langDe = (html) => html.match(/<html\b[^>]*\slang="([^"]+)"/)?.[1];
const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

function* htmls(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) yield* htmls(p);
    else if (n.endsWith('.html')) yield p;
  }
}

const esperado = (rota) => ({
  ...Object.fromEntries(IDIOMAS.map((i) => [HREFLANG[i], SITE + ROTAS[rota][i]])),
  'x-default': SITE + ROTAS[rota]['pt-br'],
});

test('dist/ existe (rode npm run build antes)', () => {
  assert.ok(existsSync(DIST), `não achei ${DIST}`);
});

test('toda página da tabela existe nos 3 idiomas, com <html lang> e canonical próprio', () => {
  for (const [rota, urls] of Object.entries(ROTAS)) {
    for (const i of IDIOMAS) {
      assert.ok(existsSync(arquivo(urls[i])), `${rota}/${i}: falta ${urls[i]}`);
      const html = ler(urls[i]);
      assert.equal(langDe(html), HREFLANG[i], `${urls[i]}: lang`);
      assert.deepEqual(canonicalDe(html), [SITE + urls[i]], `${urls[i]}: canonical`);
      assert.doesNotMatch(html, /name="robots" content="noindex/, `${urls[i]}: noindex`);
    }
  }
});

test('hreflang pt-BR/en/es + x-default (→ pt) em todas as versões, recíproco', () => {
  for (const [rota, urls] of Object.entries(ROTAS)) {
    for (const i of IDIOMAS) {
      const alt = alternates(ler(urls[i]));
      assert.deepEqual(alt, esperado(rota), `${urls[i]}: hreflang`);
      // reciprocidade: cada alvo aponta de volta para esta página
      for (const [h, href] of Object.entries(alt)) {
        if (h === 'x-default') continue;
        const volta = alternates(ler(href.slice(SITE.length)));
        assert.equal(volta[HREFLANG[i]], SITE + urls[i], `${href} não aponta de volta para ${urls[i]}`);
      }
    }
  }
});

test('página fora da tabela não tem hreflang', () => {
  const daTabela = new Set(Object.values(ROTAS).flatMap((u) => Object.values(u).map((x) => arquivo(x))));
  for (const p of htmls(DIST)) {
    if (daTabela.has(p)) continue;
    assert.deepEqual(alternates(readFileSync(p, 'utf8')), {}, `${relative(DIST, p)} tem hreflang sem ter as 3 versões`);
  }
});

test('sitemaps por idioma batem com a tabela; robots.txt lista os três', () => {
  for (const i of ['en', 'es']) {
    const xml = readFileSync(join(DIST, `sitemap-${i}.xml`), 'utf8');
    assert.deepEqual(new Set(locs(xml)), new Set(Object.values(ROTAS).map((u) => SITE + u[i])), `sitemap-${i}.xml`);
    assert.doesNotMatch(xml, /404/);
  }
  const pt = locs(readFileSync(join(DIST, 'sitemap.xml'), 'utf8'));
  assert.ok(pt.every((u) => !/\/(en|es)\//.test(u)), 'sitemap.xml (pt) com página en/es');
  const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
  for (const s of ['sitemap.xml', 'sitemap-en.xml', 'sitemap-es.xml']) assert.match(robots, new RegExp(`Sitemap: ${SITE}/${s}`));
});

test('404 por idioma: noindex, sem canonical, sem hreflang, lang certo; a raiz troca para /en/ e /es/', () => {
  for (const i of ['en', 'es']) {
    const html = ler(PAGINA_404[i]);
    assert.match(html, /<meta name="robots" content="noindex[^"]*">/);
    assert.deepEqual(canonicalDe(html), []);
    assert.equal(langDe(html), HREFLANG[i]);
    assert.equal(html.match(/data-plano-card=/g)?.length, 3);
    assert.doesNotMatch(html, /Quero%20contratar|Contratar agora|Vim pelo site/, `${PAGINA_404[i]} com texto em pt`);
  }
  const raiz = ler('/404.html');
  assert.match(raiz, /\/en\/404\.html/);
  assert.match(raiz, /\/es\/404\.html/);
  assert.match(raiz, /location\.replace/);
  assert.equal(langDe(raiz), 'pt-BR');
});

test('páginas jurídicas en/es: aviso de que o português prevalece + link para o pt', () => {
  const aviso = {
    en: 'This translation is provided for convenience. In case of any discrepancy, the Portuguese version prevails.',
    es: 'Esta traducción se ofrece para su comodidad. En caso de discrepancia, prevalece la versión en portugués.',
  };
  for (const rota of ['politica-de-privacidade', 'termos-de-uso']) {
    for (const i of ['en', 'es']) {
      const html = ler(ROTAS[rota][i]);
      assert.ok(html.includes(aviso[i]), `${ROTAS[rota][i]}: sem o aviso`);
      assert.ok(html.includes(`href="${ROTAS[rota]['pt-br']}"`), `${ROTAS[rota][i]}: sem link para o pt`);
    }
  }
});

// Preço = "R$ 13,99" com espaço comum, &nbsp; ou não separável. Só dentro do <main>.
const precos = (html) => {
  const main = html.match(/<main\b[\s\S]*<\/main>/)?.[0] ?? '';
  return new Set([...main.matchAll(/R\$(?:\s|&nbsp;| )*(\d{1,3}(?:\.\d{3})*,\d{2})/g)].map((m) => m[1]));
};

test('en/es mostram exatamente os mesmos preços do pt (nada convertido nem inventado)', () => {
  for (const [rota, urls] of Object.entries(ROTAS)) {
    const pt = precos(ler(urls['pt-br']));
    for (const i of ['en', 'es']) assert.deepEqual(precos(ler(urls[i])), pt, `${urls[i]}: preços diferentes do pt`);
  }
});

test('en/es sem marcador sobrando e sem mensagem de WhatsApp em português', () => {
  for (const p of htmls(DIST)) {
    const rel = relative(DIST, p);
    if (!/^(en|es)\//.test(rel)) continue;
    const html = readFileSync(p, 'utf8');
    assert.doesNotMatch(html, /\{\{(plano|whats):/, `${rel}: marcador sobrando`);
    assert.doesNotMatch(html, /Quero%20contratar|Ol%C3%A1%21|gostaria%20de%20receber/, `${rel}: WhatsApp em pt`);
    assert.match(html, /0800 800 0900/, `${rel}: sem o 0800`);
  }
});
