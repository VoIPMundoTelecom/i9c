// <lastmod> dos sitemaps (public/sitemap*.xml): data real do conteúdo, nunca a do build.
// npm run test:sitemap   — não precisa do dist/. Atualizar as datas: npm run sitemap:lastmod
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ, SITEMAPS, lastmodsDe, datasDa, repoRaso, hoje } from './sitemap-lastmod.mjs';

const urls = SITEMAPS.flatMap((s) => lastmodsDe(readFileSync(join(RAIZ, s), 'utf8')).map((u) => ({ ...u, sitemap: s })));
const comData = urls.filter((u) => u.lastmod);

test('lastmod no formato AAAA-MM-DD e nunca no futuro', () => {
  for (const u of comData) {
    assert.match(u.lastmod, /^\d{4}-\d{2}-\d{2}$/, `${u.loc} (${u.sitemap})`);
    assert.ok(u.lastmod <= hoje(), `${u.loc}: lastmod ${u.lastmod} é depois de hoje`);
  }
});

test('lastmod não é todo igual (sinal de data de build)', () => {
  if (comData.length < 2) return;
  assert.ok(new Set(comData.map((u) => u.lastmod)).size > 1, `todos os ${comData.length} lastmod são ${comData[0].lastmod}`);
});

test('lastmod nunca depois do último commit do conteúdo da página', { skip: repoRaso() && 'repositório raso: sem datas do git' }, () => {
  for (const u of comData) {
    const { git } = datasDa(u.loc);
    assert.ok(git, `${u.loc}: sem fonte no git para conferir a data (mapear em scripts/sitemap-lastmod.mjs)`);
    assert.ok(u.lastmod <= git, `${u.loc}: lastmod ${u.lastmod} é depois do último commit do conteúdo (${git})`);
  }
});
