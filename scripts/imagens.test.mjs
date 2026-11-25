// Teste pós-build das imagens: npm run build && npm run test:imagens
// Regra (16/11/2026, README "Imagens"): imagem raster nova entra por src/components/Imagem.astro
// (<picture> AVIF → WebP → PNG/JPEG), com width/height, lazy fora da primeira dobra e
// no máximo uma imagem com fetchpriority="high" (a do LCP) por página.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const DIST = new URL('../dist/', import.meta.url);
const PUBLIC = new URL('../public/', import.meta.url);
const temBuild = existsSync(new URL('index.html', DIST));
const opts = { skip: !temBuild && 'rode npm run build' };

const arquivos = (dir, base = '') =>
  readdirSync(new URL(base, dir), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? arquivos(dir, `${base}${e.name}/`) : [`${base}${e.name}`],
  );
const paginas = () => (temBuild ? arquivos(DIST).filter((f) => f.endsWith('.html')) : []);
const ler = (rel) => readFileSync(new URL(rel, DIST), 'utf8');
const attr = (tag, nome) => tag.match(new RegExp(`\\s${nome}="([^"]*)"`))?.[1];
const existe = (url) => existsSync(new URL(decodeURI(url.split(/[?#\s]/)[0]).replace(/^\//, ''), DIST));

// PNG servidos direto de public/ que podem ficar fora do pipeline:
// favicons/ícones (o <link rel=icon> e o apple-touch-icon pedem PNG/ICO) e os logos atuais,
// que só mudam de formato quando o arquivo oficial estiver em ~/marcas.
const RASTER_PUBLIC_PERMITIDO = new Set([
  'favicon.ico',
  'assets/favicon-32.png',
  'assets/favicon-192.png',
  'assets/favicon-512.png',
  'assets/apple-touch-icon.png',
  'i9c-logo.png',
  'i9c-logo-negativo.png',
  'assets/img/i9c-logo.png',
  'assets/img/i9c-logo-negativo.png',
  // WebP dos logos no tamanho exibido (arquivo oficial confirmado pelo Fabricio em 25/11; o PNG fica para OG e JSON-LD).
  'i9c-logo-55.webp', 'i9c-logo-110.webp', 'i9c-logo-165.webp',
  'i9c-logo-negativo-49.webp', 'i9c-logo-negativo-98.webp', 'i9c-logo-negativo-147.webp',
]);

test('nenhuma imagem raster nova em public/ (entra por <Imagem>)', () => {
  const raster = arquivos(PUBLIC).filter((f) => /\.(png|jpe?g|gif|webp|avif|jxl|ico)$/i.test(f));
  const novos = raster.filter((f) => !RASTER_PUBLIC_PERMITIDO.has(f));
  assert.deepEqual(novos, [], 'ponha a imagem em src/assets e use src/components/Imagem.astro');
});

test('toda <img> tem width e height numéricos', opts, () => {
  for (const p of paginas()) {
    for (const [img] of ler(p).matchAll(/<img\b[^>]*>/g)) {
      assert.match(attr(img, 'width') ?? '', /^\d+$/, `${p}: <img> sem width — ${img.slice(0, 120)}`);
      assert.match(attr(img, 'height') ?? '', /^\d+$/, `${p}: <img> sem height — ${img.slice(0, 120)}`);
    }
  }
});

test('<img src="/…"> solta só para os logos permitidos', opts, () => {
  for (const p of paginas()) {
    for (const [img] of ler(p).matchAll(/<img\b[^>]*>/g)) {
      const src = attr(img, 'src') ?? '';
      if (src.startsWith('/_astro/') || src.startsWith('data:')) continue;
      if (/\.svg$/i.test(src)) continue; // vetor (logos de ~/marcas, ex.: Karretel): leve por natureza, fora do pipeline AVIF/WebP
      assert.ok(RASTER_PUBLIC_PERMITIDO.has(src.replace(/^\//, '')), `${p}: ${src} fora do pipeline <Imagem>`);
    }
  }
});

test('<picture>: AVIF, depois WebP, depois <img> de reserva; arquivos no build', opts, () => {
  for (const p of paginas()) {
    for (const [bloco] of ler(p).matchAll(/<picture\b[\s\S]*?<\/picture>/g)) {
      const tipos = [...bloco.matchAll(/<source\b[^>]*>/g)].map(([s]) => attr(s, 'type'));
      assert.deepEqual(tipos.filter((t) => t !== 'image/jxl'), ['image/avif', 'image/webp'], `${p}: ordem das <source>`);
      for (const [s] of bloco.matchAll(/<source\b[^>]*>/g)) {
        for (const u of attr(s, 'srcset').split(',')) assert.ok(existe(u.trim()), `${p}: ${u.trim()} não está no dist`);
      }
      const img = bloco.match(/<img\b[^>]*>/)?.[0];
      assert.ok(img && existe(attr(img, 'src')), `${p}: <picture> sem <img> de reserva`);
    }
  }
});

test('lazy fora da 1ª dobra; no máximo uma imagem com fetchpriority=high, e ela sem lazy', opts, () => {
  for (const p of paginas()) {
    const html = ler(p);
    const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map(([t]) => t);
    const altas = imgs.filter((t) => attr(t, 'fetchpriority') === 'high');
    assert.ok(altas.length <= 1, `${p}: ${altas.length} imagens com fetchpriority=high`);
    for (const t of altas) assert.notEqual(attr(t, 'loading'), 'lazy', `${p}: imagem do LCP com lazy`);
    // rodapé e widget do WhatsApp (popup fechado) nunca estão na 1ª dobra
    const rodape = html.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? '';
    const popup = html.match(/<div id="wa-popup"[\s\S]*?<\/div>/)?.[0] ?? '';
    for (const [t] of (rodape + popup).matchAll(/<img\b[^>]*>/g)) {
      assert.equal(attr(t, 'loading'), 'lazy', `${p}: imagem do rodapé/WhatsApp sem lazy`);
    }
  }
});
