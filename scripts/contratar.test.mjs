// Botões "Contratar": um destino só (CONTRATAR_URL em src/data/planos.ts), com o plano.
// Uso: npm run build && npm run test:contratar
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { CONTRATAR, CONTRATAR_URL, contratarUrl, consultorUrl } from '../src/data/planos.ts';

const DIST = new URL('../dist/', import.meta.url);
const SRC = new URL('../src/', import.meta.url);
const ler = (rel, base = DIST) => readFileSync(new URL(rel, base), 'utf8');
const decodificar = (s) => s.replace(/&amp;/g, '&');
const PAGINAS = readdirSync(DIST).filter((f) => f.endsWith('.html'));
const attr = (tag, nome) => tag.match(new RegExp(`${nome}="([^"]*)"`))?.[1];

const botoes = (html) => [...html.matchAll(/<a [^>]*data-lead="contratar"[^>]*>/g)].map((m) => m[0]);

test('formulário: ?plano=<id>; WhatsApp (provisório): o plano vai no texto', () => {
  for (const [id, nome] of Object.entries(CONTRATAR)) {
    const u = new URL(contratarUrl(id));
    if (CONTRATAR_URL.startsWith('https://wa.me/')) assert.ok(u.searchParams.get('text').includes(nome), id);
    else assert.equal(u.searchParams.get('plano'), id);
  }
});

test('todo botão "Contratar" das páginas de plano e da home leva o id e vai para contratarUrl(id)', () => {
  const vistos = new Set();
  for (const p of PAGINAS.filter((f) => f.startsWith('planos-') || f === 'index.html')) {
    const html = ler(p);
    const bs = botoes(html).filter((t) => attr(t, 'data-plano'));
    assert.ok(bs.length > 0, `${p}: nenhum botão Contratar com data-plano`);
    for (const tag of bs) {
      const id = attr(tag, 'data-plano');
      assert.ok(id in CONTRATAR, `${p}: plano fora de CONTRATAR: ${id}`);
      assert.equal(decodificar(attr(tag, 'href')), contratarUrl(id), `${p}: destino de ${id}`);
      vistos.add(id);
    }
    assert.doesNotMatch(html, /\{\{(contratar|consultor|plano):/, `${p}: marcador sobrando`);
  }
  assert.deepEqual([...vistos].sort(), Object.keys(CONTRATAR).sort(), 'plano de CONTRATAR sem botão (ou sobrando no catálogo)');
});

test('cada botão de plano tem o "Falar com um consultor" (WhatsApp) logo abaixo', () => {
  for (const p of PAGINAS.filter((f) => f.startsWith('planos-') || f === 'index.html')) {
    const html = ler(p);
    const pares = [...html.matchAll(/data-lead="contratar" data-plano="([^"]+)"[^>]*>Contratar<\/a>\s*<a ([^>]*)>Falar com um consultor<\/a>/g)];
    assert.equal(pares.length, botoes(html).filter((t) => attr(t, 'data-plano')).length, `${p}: botão sem consultor`);
    for (const [, id, outro] of pares) {
      assert.equal(attr(outro, 'data-lead'), 'consultor');
      assert.equal(decodificar(attr(outro, 'href')), consultorUrl(id));
      assert.ok(consultorUrl(id).startsWith('https://wa.me/558008000900?text='));
    }
  }
});

test('o topo do site (header) usa o mesmo destino', () => {
  const tag = botoes(ler('index.html')).find((t) => !attr(t, 'data-plano'));
  assert.ok(tag, 'botão Contratar do header não encontrado');
  assert.equal(decodificar(attr(tag, 'href')), contratarUrl());
});

test('begin_checkout disparado no clique, só com consentimento', () => {
  const html = ler('index.html');
  const js = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((c) => c.includes('begin_checkout')) ?? '';
  assert.match(js, /a\[data-lead="contratar"\]/);
  assert.match(js, /i9c_cookies/);
  assert.match(js, /currency: 'BRL'/);
});

test('nenhum link de "Quero contratar" digitado fora de src/data/planos.ts', () => {
  const pastas = ['partials/', 'components/', 'pages/', 'layouts/'];
  for (const pasta of pastas) {
    for (const f of readdirSync(new URL(pasta, SRC))) {
      const txt = ler(`${pasta}${f}`, SRC);
      assert.doesNotMatch(txt, /Quero%20contratar|Quero contratar/, `${pasta}${f}`);
    }
  }
});
