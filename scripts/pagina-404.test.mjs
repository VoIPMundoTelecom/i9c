// Teste pós-build da 404 e da manutenção: npm run build && npm run test:404
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { PLANOS, formatarPreco } from '../src/data/planos.ts';

const DIST = new URL('../dist/', import.meta.url);
const ler = (rel) => readFileSync(new URL(rel, DIST), 'utf8');
const WHATSAPP = 'https://wa.me/558008000900'; // EMPRESA.whatsapp (src/data/empresa.ts)
const OPERADORAS = ['Vivo', 'Claro', 'TIM', 'Oi', 'Algar', 'Arqia', 'TIP', 'Vero', 'Surf'];
const PAGINAS_PLANO = readdirSync(DIST).filter((f) => f.startsWith('planos-') || f === 'index.html');

const textos = (html) =>
  html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '')
    .split(/<[^>]+>/).map((t) => t.replace(/\s+/g, ' ').trim()).filter(Boolean);
const decodificar = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

const html = existsSync(new URL('404.html', DIST)) ? ler('404.html') : '';

test('dist/404.html existe (rode npm run build antes)', () => {
  assert.ok(html, 'dist/404.html não encontrado');
});

test('404 e manutenção são noindex, sem canonical e fora do sitemap', () => {
  for (const pagina of [html, ler('manutencao.html')]) {
    assert.match(pagina, /<meta name="robots" content="noindex[^"]*">/);
    assert.doesNotMatch(pagina, /rel="canonical"/);
  }
  assert.doesNotMatch(ler('sitemap.xml'), /404|manutencao/);
});

test('exatamente 3 cards de plano, preço igual a src/data/planos.ts e CTA com UTM', () => {
  const cards = [...html.matchAll(/data-plano-card="([^"]+)"([\s\S]*?)<\/article>/g)];
  assert.equal(cards.length, 3);
  for (const [, id, corpo] of cards) {
    const plano = PLANOS[id];
    assert.ok(plano, `plano fora de src/data/planos.ts: ${id}`);
    assert.equal(corpo.match(/data-preco[^>]*>([^<]+)</)?.[1], formatarPreco(plano.preco), `preço de ${id}`);
    const href = decodificar(corpo.match(/href="([^"]+)"[^>]*data-cta-plano/)?.[1] ?? '');
    assert.ok(href.startsWith(plano.contratar), `destino de ${id} diferente do botão da página do plano`);
    const u = new URL(href);
    assert.equal(u.searchParams.get('utm_source'), 'site');
    assert.equal(u.searchParams.get('utm_medium'), '404');
    assert.equal(u.searchParams.get('utm_campaign'), id);
    assert.ok(u.searchParams.get('text'), 'perdeu a mensagem do WhatsApp');
    assert.match(corpo, />Contratar agora</);
  }
});

test('páginas de plano leem o mesmo dado (sem marcador sobrando)', () => {
  for (const p of PAGINAS_PLANO) assert.doesNotMatch(ler(p), /\{\{plano:/, p);
  for (const [id, p] of Object.entries(PLANOS)) {
    const pagina = ler(p.pagina.slice(1));
    assert.ok(pagina.includes(formatarPreco(p.preco).replace(' ', ' ')), `${id}: preço não aparece em ${p.pagina}`);
    assert.ok(pagina.includes(`href="${p.contratar}"`), `${id}: link de contratar não aparece em ${p.pagina}`);
  }
});

test('link de WhatsApp do comercial com a mensagem da 404', () => {
  const href = decodificar(html.match(/href="([^"]+)"[^>]*data-cta-whatsapp/)?.[1] ?? '');
  assert.ok(href.startsWith(`${WHATSAPP}?text=`), href);
  assert.equal(new URL(href).searchParams.get('text'), 'Vim pelo site (página não encontrada)');
});

test('nenhum nome de operadora', () => {
  const texto = textos(html).join(' ');
  for (const nome of OPERADORAS) assert.doesNotMatch(texto, new RegExp(`(^|[^\\p{L}])${nome}([^\\p{L}]|$)`, 'u'), nome);
});

test('"grátis"/"ilimitado" só onde as páginas de plano já dizem igual', () => {
  const dosPlanos = new Set(PAGINAS_PLANO.flatMap((p) => textos(ler(p))));
  const suspeitos = textos(html).filter((t) => /gr[aá]tis|ilimitad/i.test(t));
  for (const t of suspeitos) assert.ok(dosPlanos.has(t), `texto novo com grátis/ilimitado: "${t}"`);
});

test('eventos usam só pathname e host do referrer', () => {
  const blocos = [
    ...[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]),
    ...readdirSync(new URL('_astro/', DIST)).filter((f) => f.endsWith('.js')).map((f) => ler(`_astro/${f}`)),
  ];
  const js = blocos.find((c) => c.includes('pagina_404')) ?? '';
  assert.match(js, /pagina_404/);
  assert.match(js, /cta_404_plano/);
  assert.match(js, /cta_404_whatsapp/);
  assert.doesNotMatch(js, /location\.(search|hash|href)/);
});
