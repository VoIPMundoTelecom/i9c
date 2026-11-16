#!/usr/bin/env node
/**
 * Peso de uma página a partir do build (dist/), sem navegador.
 * Soma o HTML e cada recurso local que ele referencia (CSS, JS, imagens, ícones),
 * separando o que o navegador baixa na carga inicial do que fica com loading="lazy".
 *
 * Limites (é estimativa de build, não substitui o Lighthouse):
 *  - num <picture> conta só a 1ª <source> (AVIF), que é o que um navegador atual baixa;
 *  - recurso externo (fontes, mapa) é listado à parte, sem peso;
 *  - tamanho em disco, sem gzip/brotli.
 *
 * Uso: node scripts/peso-pagina.mjs [index.html] [--json]
 */
import { readFileSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const pagina = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'index.html';
const html = readFileSync(DIST + pagina, 'utf8');

const tam = (url) => {
  const p = DIST + decodeURI(url.split(/[?#]/)[0]).replace(/^\//, '');
  return existsSync(p) ? statSync(p).size : null;
};

const itens = new Map(); // url -> { tipo, lazy }
const externos = new Set();
const add = (url, tipo, lazy = false) => {
  if (!url) return;
  if (/^(https?:)?\/\//.test(url)) return void externos.add(url);
  if (/^(data:|#|mailto:|tel:)/.test(url)) return;
  const atual = itens.get(url);
  // a mesma URL eager em qualquer ponto = baixada na carga inicial
  if (!atual || (atual.lazy && !lazy)) itens.set(url, { tipo, lazy });
};

const attr = (tag, nome) => tag.match(new RegExp(`\\s${nome}="([^"]*)"`))?.[1];

for (const [tag] of html.matchAll(/<link\b[^>]*>/g)) {
  const rel = attr(tag, 'rel') ?? '';
  if (/stylesheet|icon|preload|modulepreload|manifest/.test(rel)) add(attr(tag, 'href'), rel.includes('icon') ? 'ícone' : rel);
}
for (const [tag] of html.matchAll(/<script\b[^>]*\bsrc="[^"]*"[^>]*>/g)) add(attr(tag, 'src'), 'js');

// <picture>: só a 1ª <source>; <img> solta: o src
const semPicture = html.replace(/<picture\b[\s\S]*?<\/picture>/g, (bloco) => {
  const img = bloco.match(/<img\b[^>]*>/)?.[0] ?? '';
  const lazy = attr(img, 'loading') === 'lazy';
  const src1 = bloco.match(/<source\b[^>]*>/)?.[0];
  const url = src1 ? attr(src1, 'srcset')?.split(/\s+/)[0] : attr(img, 'src');
  add(url, 'imagem', lazy);
  return '';
});
for (const [tag] of semPicture.matchAll(/<img\b[^>]*>/g)) add(attr(tag, 'src'), 'imagem', attr(tag, 'loading') === 'lazy');

const linhas = [{ url: pagina, tipo: 'html', lazy: false, bytes: Buffer.byteLength(html) }];
for (const [url, v] of itens) linhas.push({ url, ...v, bytes: tam(url) });

const soma = (f) => linhas.filter(f).reduce((s, l) => s + (l.bytes ?? 0), 0);
const total = {
  inicial: soma((l) => !l.lazy),
  lazy: soma((l) => l.lazy),
  imagensIniciais: soma((l) => l.tipo === 'imagem' && !l.lazy),
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ pagina, linhas, total, externos: [...externos] }, null, 2));
} else {
  const kb = (b) => (b == null ? 'n/d' : (b / 1024).toFixed(1) + ' KB');
  for (const l of linhas) console.log(`${l.lazy ? 'lazy ' : '     '}${kb(l.bytes).padStart(9)}  ${l.tipo.padEnd(10)} ${l.url}`);
  console.log(`\ncarga inicial: ${kb(total.inicial)} (imagens: ${kb(total.imagensIniciais)}) · adiado (lazy): ${kb(total.lazy)}`);
  if (externos.size) console.log(`externos (sem peso aqui): ${[...externos].join(', ')}`);
}
