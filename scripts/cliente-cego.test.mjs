// Cliente cego: o texto público do site não pode nomear operadora, fornecedor
// ou plataforma por trás do serviço.
// Uso: npm run build && node --test scripts/cliente-cego.test.mjs
//
// "Texto público" = texto das páginas (inclusive <option>), JSON-LD, alt/title/
// aria-label/placeholder/meta content e arquivos .txt/.json/.webmanifest.
// Fica de fora (classe c, técnico e não visível): comentários HTML, <script>
// que não é JSON-LD, <style>, href/src e dados de path de SVG.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;

// Palavras comuns em português (claro, vivo, oi, tim...) só contam com a grafia
// de marca; nomes que não são palavras comuns contam com qualquer caixa.
const TERMOS = [
  { nome: 'Vivo', re: /(?<![\p{L}\p{N}])Vivo(?![\p{L}])/gu },
  { nome: 'Claro', re: /(?<![\p{L}\p{N}])Claro(?![\p{L}])/gu },
  { nome: 'TIM', re: /(?<![\p{L}\p{N}])TIM(?![\p{L}])/gu },
  { nome: 'Oi', re: /(?<![\p{L}\p{N}])Oi(?![\p{L}])/gu },
  { nome: 'TIP', re: /(?<![\p{L}\p{N}])TIP(?![\p{L}])/gu },
  { nome: 'Vero', re: /(?<![\p{L}\p{N}])Vero(?![\p{L}])/gu },
  { nome: 'Surf', re: /(?<![\p{L}\p{N}])Surf(?![\p{L}])/gu },
  { nome: 'C6', re: /(?<![\p{L}\p{N}])C6(?![\p{L}\p{N}])/gu },
  ...['Arqia', 'Algar', 'Telecall', 'Next ?Billing', 'eSIM ?Access', 'Asterisk', 'Issabel',
    'FreePBX', 'Bitrix', 'Zendesk', 'Coolify', 'Bradesco'].map((t) => ({
    nome: t.replace(' ?', ' '),
    re: new RegExp(`(?<![\\p{L}\\p{N}])${t}(?![\\p{L}])`, 'giu'),
  })),
];

// Exceções aceitas (classe b): arquivo + trecho em volta da ocorrência.
// Cada uma precisa de motivo; o último teste falha se alguma deixar de ser usada.
const EXCECOES = [
  // Formulário de portabilidade: o cliente escolhe a operadora de onde o número
  // dele vem. Lista completa de mercado, não indica qual rede a i9c usa.
  ...['Vivo', 'Claro', 'TIM', 'Oi', 'Algar'].map((termo) => ({
    termo,
    arquivo: /^portabilidade\.html$/,
    trecho: /Operadora atual \* Selecione… Vivo Claro TIM Oi Algar Sercomtel Outra/,
  })),
  {
    // Texto jurídico (LGPD, art. 9º): a política lista os fornecedores que tratam
    // dados (Google, Meta, OpenStreetMap...). Bitrix24 aqui é o CRM/chat, não a
    // rede. Mantido até revisão do Fabricio.
    termo: 'Bitrix',
    arquivo: /^politica-de-privacidade\.html$/,
    trecho: /Bitrix24 \(chat e CRM\)/,
  },
];

function* arquivos(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) yield* arquivos(p);
    else if (/\.(html|xml|svg|txt|json|webmanifest)$/.test(n)) yield p;
  }
}

const ENTIDADES = { '&amp;': '&', '&quot;': '"', '&#39;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ' };

function textoPublico(caminho) {
  const bruto = readFileSync(caminho, 'utf8');
  if (!/\.(html|xml|svg)$/.test(caminho)) return bruto;
  const atributos = [];
  const html = bruto
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (_, a, corpo) =>
      /application\/ld\+json/i.test(a) ? ` ${corpo} ` : ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/\s(?:alt|title|aria-label|placeholder|content|label)\s*=\s*("([^"]*)"|'([^']*)')/gi,
      (m, _q, d, s) => { atributos.push(d ?? s); return m; });
  const texto = `${html.replace(/<[^>]+>/g, ' ')} ${atributos.join(' ')}`;
  return texto.replace(/&[a-z#0-9]+;/gi, (e) => ENTIDADES[e] ?? ' ').replace(/\s+/g, ' ');
}

const usadas = new Set();

test('dist/ existe (rode npm run build antes)', () => {
  assert.ok(existsSync(DIST), `não achei ${DIST}`);
});

test('nenhum termo de operadora/fornecedor no texto público do dist/', () => {
  const achados = [];
  for (const caminho of arquivos(DIST)) {
    const rel = relative(DIST, caminho);
    const texto = textoPublico(caminho);
    for (const { nome, re } of TERMOS) {
      for (const m of texto.matchAll(re)) {
        const trecho = texto.slice(Math.max(0, m.index - 60), m.index + m[0].length + 60);
        const i = EXCECOES.findIndex((e) => e.termo === nome && e.arquivo.test(rel) && e.trecho.test(trecho));
        if (i >= 0) { usadas.add(i); continue; }
        achados.push(`${rel}: [${m[0]}] …${trecho.trim()}…`);
      }
    }
  }
  assert.deepEqual(achados, [], `termos expostos ao cliente:\n${achados.join('\n')}`);
});

test('toda exceção da lista ainda é necessária', () => {
  const sobrando = EXCECOES.filter((_, i) => !usadas.has(i)).map((e) => `${e.termo} em ${e.arquivo}`);
  assert.deepEqual(sobrando, [], 'exceção sem uso: remova da lista');
});
