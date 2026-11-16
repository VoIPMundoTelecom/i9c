// Karretel no plano corporativo: "Karretel Completo incluso" nas páginas de empresas (pt/en/es).
// Uso: npm run build && node --test scripts/karretel.test.mjs
//
// - o bloco [data-karretel] existe, com o ícone oficial (cópia exata de ~/marcas/karretel/karretel-simbolo.svg)
//   e o link para a página do Karretel no grupoivm, no idioma da página, em nova aba com noopener;
// - todo cartão de plano empresarial lista o Karretel Completo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const ICONE = fileURLToPath(new URL('../public/assets/img/marcas/karretel-simbolo.svg', import.meta.url));
// sha256 do karretel-simbolo.svg do repo marcas (c32a027). Mudou lá? Copie de novo e atualize aqui.
const ICONE_SHA256 = '6f36c6e3eac41d66a3e3c0799ed77fa82f860deb4a9ad5a585aa33ad16521c8e';

const PAGINAS = [
  { arquivo: 'planos-empresas.html', link: 'https://grupoivm.com.br/marcas/karretel/', item: 'Karretel Completo incluso' },
  { arquivo: 'en/business-plans.html', link: 'https://grupoivm.com.br/en/brands/karretel/', item: 'Karretel Complete included' },
  { arquivo: 'es/planes-para-empresas.html', link: 'https://grupoivm.com.br/es/marcas/karretel/', item: 'Karretel Completo incluido' },
];

test('ícone do Karretel é o arquivo oficial (sem redesenho)', () => {
  assert.equal(createHash('sha256').update(readFileSync(ICONE)).digest('hex'), ICONE_SHA256);
});

for (const p of PAGINAS) {
  test(`${p.arquivo}: bloco "Karretel Completo" com ícone e link no idioma`, () => {
    const caminho = DIST + p.arquivo;
    assert.ok(existsSync(caminho), `não achei ${caminho} (rode npm run build antes)`);
    const html = readFileSync(caminho, 'utf8');
    const bloco = html.match(/<aside\b[^>]*data-karretel[^>]*>[\s\S]*?<\/aside>/)?.[0];
    assert.ok(bloco, 'sem o bloco [data-karretel]');
    assert.match(bloco, /<img\b[^>]*src="\/assets\/img\/marcas\/karretel-simbolo\.svg"[^>]*alt="Karretel"|<img\b[^>]*alt="Karretel"[^>]*src="\/assets\/img\/marcas\/karretel-simbolo\.svg"/);
    const a = bloco.match(new RegExp(`<a\\b[^>]*href="${p.link.replace(/[./]/g, '\\$&')}"[^>]*>`))?.[0];
    assert.ok(a, `sem link para ${p.link}`);
    assert.match(a, /target="_blank"/);
    assert.match(a, /rel="noopener"/);
    const cartoes = [...html.matchAll(/data-panel="empresas"[\s\S]*?<\/div>\s*<aside/g)][0]?.[0] ?? '';
    const listas = [...cartoes.matchAll(/<ul\b[\s\S]*?<\/ul>/g)].map((m) => m[0]);
    assert.ok(listas.length >= 5, `só ${listas.length} cartões`);
    for (const ul of listas) assert.ok(ul.includes(p.item), `cartão sem "${p.item}"`);
  });
}
