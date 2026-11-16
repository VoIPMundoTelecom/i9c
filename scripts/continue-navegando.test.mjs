// "Continue navegando": nenhuma página do site termina sem saída.
// Uso: npm run build && node --test scripts/continue-navegando.test.mjs
//
// - toda página indexável tem o bloco no fim do <main> com 3 páginas internas que existem no dist/;
// - nenhuma página (nem as noindex, 404 e manutenção, que já são páginas de saída) fica sem link interno no <main>;
// - externos do bloco: só domínios de referência, com target="_blank" rel="noopener";
// - internos do bloco: caminho relativo ao site (nada de domínio na frente).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, paginas, auditar } from './links-internos.mjs';
import { RELACIONADOS, PAGINAS, EXTERNOS } from '../src/data/continue-navegando.ts';

// Referências aceitas no bloco (pedido de 13/11/2026): Anatel/ANPD (gov.br), legislação (planalto),
// consumidor.gov.br, Wikipédia, GitHub do grupo e os outros sites do Grupo IVM.
const DOMINIOS_OK = [
  /^https:\/\/www\.gov\.br\/(anatel|anpd)\//,
  /^https:\/\/www\.planalto\.gov\.br\//,
  /^https:\/\/www\.consumidor\.gov\.br\//,
  /^https:\/\/(pt|en|es)\.wikipedia\.org\/wiki\//,
  /^https:\/\/github\.com\/VoIPMundoTelecom(\/|$)/,
  /^https:\/\/(voipmundo|ondafone|grupoivm)\.com\.br\//,
];

const linhas = [...paginas()].map(auditar);

const existe = (href) => {
  const c = href.split(/[?#]/)[0];
  const alvo = c.endsWith('/') ? join(DIST, c, 'index.html') : join(DIST, c.endsWith('.html') ? c : `${c}.html`);
  return existsSync(alvo);
};

test('dist/ existe e tem páginas (rode npm run build antes)', () => {
  assert.ok(existsSync(DIST), `não achei ${DIST}`);
  assert.ok(linhas.length >= 30, `só ${linhas.length} páginas no dist/`);
});

test('nenhuma página sem link interno no conteúdo (<main>)', () => {
  const sem = linhas.filter((l) => l.total === 0).map((l) => l.pagina);
  assert.deepEqual(sem, [], `páginas sem saída:\n${sem.join('\n')}`);
});

test('toda página indexável tem o bloco "Continue navegando" com 3 páginas internas', () => {
  const erros = linhas.filter((l) => !l.noindex && (!l.temBloco || l.bloco !== 3))
    .map((l) => `${l.pagina}: ${l.temBloco ? `${l.bloco} páginas no bloco` : 'sem bloco (falta em src/data/continue-navegando.ts?)'}`);
  assert.deepEqual(erros, []);
});

test('links internos do bloco: caminho relativo e página que existe no dist/', () => {
  const erros = [];
  for (const l of linhas) {
    for (const h of l.internosBloco) {
      if (!h.startsWith('/')) erros.push(`${l.pagina}: ${h} não é caminho relativo ao site`);
      else if (!existe(h)) erros.push(`${l.pagina}: ${h} não existe no dist/`);
    }
  }
  assert.deepEqual(erros, []);
});

test('externos do bloco: só referência de autoridade ou site do grupo, em nova aba com noopener', () => {
  const erros = [];
  for (const l of linhas) {
    for (const h of l.externosBloco) {
      if (!DOMINIOS_OK.some((re) => re.test(h))) erros.push(`${l.pagina}: ${h} fora da lista de referências`);
    }
    for (const tag of l.tagsExternas) {
      if (!/target="_blank"/.test(tag) || !/rel="noopener"/.test(tag)) erros.push(`${l.pagina}: ${tag} sem target/rel`);
    }
  }
  assert.deepEqual(erros, []);
});

test('mapa de relacionados: 3 páginas, sem repetir e sem apontar para a própria página', () => {
  const erros = [];
  for (const [id, r] of Object.entries(RELACIONADOS)) {
    for (const [nome, lista] of [['internas', r.internas], ['traduzidas', r.traduzidas]]) {
      if (!lista) continue;
      if (lista.length !== 3) erros.push(`${id}.${nome}: ${lista.length} páginas`);
      if (new Set(lista).size !== lista.length) erros.push(`${id}.${nome}: repetida`);
      if (lista.includes(id)) erros.push(`${id}.${nome}: aponta para si mesma`);
      for (const alvo of lista) if (!(alvo in PAGINAS)) erros.push(`${id}.${nome}: ${alvo} não existe em PAGINAS`);
    }
    if (r.traduzidas) for (const alvo of r.traduzidas) if (!PAGINAS[alvo].rota) erros.push(`${id}.traduzidas: ${alvo} não tem en/es`);
    if (!r.traduzidas && PAGINAS[id].rota) {
      for (const alvo of r.internas) if (!PAGINAS[alvo].rota) erros.push(`${id}: ${alvo} sem en/es; defina "traduzidas"`);
    }
    for (const k of r.externas) if (!(k in EXTERNOS)) erros.push(`${id}: externo ${k} não existe`);
  }
  assert.deepEqual(erros, []);
});
