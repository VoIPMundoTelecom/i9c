#!/usr/bin/env node
/**
 * Relatório semanal de 404: top 20 URLs quebradas → proposta de redirecionamento.
 *
 *   node scripts/relatorio-404.mjs <export.csv>              # dry-run: só imprime
 *   node scripts/relatorio-404.mjs <export.csv> --executar   # grava o mapa e gera as páginas-ponte
 *
 * O GitHub Pages não tem 301 configurável nem _redirects. Por isso o "redirecionamento" aqui é uma
 * página-ponte estática em public/ (meta refresh + canonical para o destino + noindex), gerada a partir
 * do mapa docs/seo/redirects-404.csv (origem,destino). 301 de verdade exige mover a i9c para o
 * Cloudflare Pages ou usar Cloudflare Redirect Rules na zona: [decisão do Fabricio].
 *
 * Opções: --dist <pasta> (padrão dist/, precisa de build), --mapa <csv> (padrão docs/seo/redirects-404.csv),
 * --public <pasta> (padrão public/), --top <n> (padrão 20), --saida <arquivo.md>.
 *
 * CSV de entrada (separador , ou ;, linhas com # ignoradas): GA4 (evento pagina_404 × pagina_quebrada,
 * "Contagem de eventos"), Search Console (coluna URL) ou Cloudflare (path + requests).
 * Busca automática no GA4/Search Console: [bloqueado: credencial GA4/Search Console].
 * Sem dependência externa.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, relative, sep, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const SITE = 'https://i9c.net.br';
export const MARCA_PONTE = '<!-- ponte-404: gerada por scripts/relatorio-404.mjs a partir de docs/seo/redirects-404.csv; não editar à mão -->';

const COLUNAS_URL = ['pagina_quebrada', 'url', 'urls', 'page', 'pagina', 'página', 'path', 'pagepath', 'caminho', 'request path', 'requestpath', 'top urls'];
const COLUNAS_QTD = ['contagem de eventos', 'event count', 'eventcount', 'count', 'contagem', 'requests', 'solicitações', 'visualizações', 'views', 'total', 'cliques', 'clicks'];

/** Seções do site → página de entrada (fallback quando nenhum slug parece). */
const HOME_DO_SERVICO = [
  [/pre-?pago|pré-?pago/, '/planos-pre-pago.html'],
  [/controle/, '/planos-controle.html'],
  [/familia|família/, '/planos-familia.html'],
  [/empresa|pj\b|cnpj/, '/planos-empresas.html'],
  [/black/, '/planos-black.html'],
  [/portabilidade|trazer|numero|número/, '/portabilidade.html'],
  [/recarga|credito|crédito/, '/recargas.html'],
  [/cobertura|mapa|sinal|5g/, '/mapa-de-cobertura.html'],
  [/faq|pergunta|duvida|dúvida|ajuda/, '/perguntas-frequentes.html'],
  [/privacidade|lgpd/, '/politica-de-privacidade.html'],
  [/termos/, '/termos-de-uso.html'],
];

/* ───────────── CSV ───────────── */

export function lerCsv(texto) {
  const linhas = texto.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim() && !l.trimStart().startsWith('#'));
  if (!linhas.length) return [];
  const sepr = (linhas[0].match(/;/g) || []).length > (linhas[0].match(/,/g) || []).length ? ';' : ',';
  const campos = (linha) => {
    const out = [];
    let atual = '';
    let aspas = false;
    for (let i = 0; i < linha.length; i++) {
      const c = linha[i];
      if (aspas) {
        if (c === '"' && linha[i + 1] === '"') { atual += '"'; i++; }
        else if (c === '"') aspas = false;
        else atual += c;
      } else if (c === '"') aspas = true;
      else if (c === sepr) { out.push(atual); atual = ''; }
      else atual += c;
    }
    out.push(atual);
    return out.map((s) => s.trim());
  };
  const cab = campos(linhas[0]).map((c) => c.toLowerCase());
  return linhas.slice(1).map((l) => {
    const v = campos(l);
    return Object.fromEntries(cab.map((c, i) => [c, v[i] ?? '']));
  });
}

/** Só o pathname: tira domínio, query string e hash (podem ter e-mail ou token). */
export function normalizarPath(bruto) {
  if (!bruto) return '';
  let s = bruto.trim();
  try {
    s = new URL(s, 'https://x.invalid').pathname;
  } catch {
    s = s.split(/[?#]/)[0];
  }
  try { s = decodeURI(s); } catch { /* mantém codificado */ }
  if (!s.startsWith('/')) s = '/' + s;
  return s.replace(/\/{2,}/g, '/');
}

export function agregar(linhas) {
  if (!linhas.length) return [];
  const chaves = Object.keys(linhas[0]);
  const colUrl = COLUNAS_URL.map((n) => chaves.find((c) => c === n)).find(Boolean) ?? chaves[0];
  const colQtd = COLUNAS_QTD.map((n) => chaves.find((c) => c === n)).find(Boolean);
  const mapa = new Map();
  for (const l of linhas) {
    const path = normalizarPath(l[colUrl]);
    if (!path || path === '/(not set)') continue;
    const n = colQtd ? Number(String(l[colQtd]).replace(/\./g, '').replace(',', '.')) || 0 : 1;
    mapa.set(path, (mapa.get(path) ?? 0) + n);
  }
  return [...mapa].map(([path, total]) => ({ path, total })).sort((a, b) => b.total - a.total || a.path.localeCompare(b.path));
}

/* ───────────── Páginas existentes (dist/, build.format 'file') ───────────── */

/** Rotas reais: ignora 404, manutenção e páginas-ponte já geradas. */
export function rotasDoDist(dist) {
  const rotas = new Set();
  const andar = (dir) => {
    for (const nome of readdirSync(dir)) {
      const p = join(dir, nome);
      if (statSync(p).isDirectory()) andar(p);
      else if (nome.endsWith('.html')) {
        const rel = '/' + relative(dist, p).split(sep).join('/');
        if (rel === '/404.html' || rel === '/manutencao.html') continue;
        if (readFileSync(p, 'utf8').includes(MARCA_PONTE)) continue;
        if (rel === '/index.html') rotas.add('/');
        else if (rel.endsWith('/index.html')) rotas.add(rel.slice(0, -'index.html'.length));
        else rotas.add(rel);
      }
    }
  };
  andar(dist);
  return rotas;
}

/** O GitHub Pages serve /x e /x.html com o mesmo arquivo; /x/ cai em x/index.html. */
const existe = (rotas, path) => rotas.has(path) || (!path.endsWith('/') && !path.endsWith('.html') && rotas.has(path + '.html'));

const palavras = (p) => p.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/\.html?$/, '').split(/[^a-z0-9]+/).filter((w) => w && w.length > 1);

function levenshtein(a, b) {
  const d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return d[b.length];
}

/** 0..1: o maior entre palavras em comum (Jaccard) e distância de edição do slug inteiro. */
export function similaridade(a, b) {
  const pa = palavras(a);
  const pb = palavras(b);
  if (!pa.length || !pb.length) return 0;
  const sa = new Set(pa);
  const sb = new Set(pb);
  const inter = [...sa].filter((w) => sb.has(w)).length;
  const jaccard = inter / new Set([...sa, ...sb]).size;
  const ua = pa.join('-');
  const ub = pb.join('-');
  const lev = 1 - levenshtein(ua, ub) / Math.max(ua.length, ub.length);
  return Math.max(jaccard, lev);
}

export function sugerirDestino(path, rotas, limiar = 0.6) {
  let melhor = null;
  for (const r of rotas) {
    if (r === '/' || r === path) continue;
    const s = similaridade(path, r);
    if (!melhor || s > melhor.score) melhor = { destino: r, score: s };
  }
  if (melhor && melhor.score >= limiar) return { destino: melhor.destino, motivo: `slug parecido (${melhor.score.toFixed(2)})` };
  const alvo = path.toLowerCase();
  for (const [re, destino] of HOME_DO_SERVICO) {
    if (re.test(alvo) && (rotas.has(destino) || !rotas.size)) return { destino, motivo: 'home do serviço' };
  }
  return { destino: '/', motivo: 'sem correspondência: home' };
}

/* ───────────── Mapa (docs/seo/redirects-404.csv) ───────────── */

export const CABECALHO_MAPA = 'origem,destino';

export function lerMapa(texto) {
  return lerCsv(texto).filter((l) => l.origem && l.destino).map((l) => ({ origem: l.origem, destino: l.destino }));
}

/**
 * Proposta por URL: status 'nova' | 'existe' (página está no dist) | 'ja-tem-regra' | 'loop'.
 * Loop = destino é a própria origem ou o destino já é origem de outra regra (cadeia).
 */
export function montarProposta(top, rotas, regras) {
  const novas = [];
  return top.map(({ path, total }) => {
    const base = { path, total };
    if (existe(rotas, path)) return { ...base, status: 'existe' };
    const regra = regras.find((r) => r.origem === path);
    if (regra) return { ...base, status: 'ja-tem-regra', destino: regra.destino };
    const { destino, motivo } = sugerirDestino(path, rotas);
    const todas = [...regras, ...novas];
    if (destino === path || todas.some((r) => r.origem === destino)) return { ...base, status: 'loop', destino, motivo };
    novas.push({ origem: path, destino });
    return { ...base, status: 'nova', destino, motivo };
  });
}

export function aplicarMapa(texto, proposta) {
  const existentes = new Set(lerMapa(texto).map((r) => r.origem));
  const linhas = proposta.filter((p) => p.status === 'nova' && !existentes.has(p.path)).map((p) => `${p.path},${p.destino}`);
  if (!linhas.length) return { texto: texto || `${CABECALHO_MAPA}\n`, adicionadas: 0 };
  const base = texto && texto.trim() ? texto.replace(/\s*$/, '\n') : `${CABECALHO_MAPA}\n`;
  return { texto: base + linhas.join('\n') + '\n', adicionadas: linhas.length };
}

/* ───────────── Páginas-ponte ───────────── */

const SEGURO = /^\/[A-Za-z0-9._~\/-]*$/;

/** /x.html → x.html · /x/ → x/index.html · /x → x.html (o Pages acha /x em x.html). */
export function arquivoDaPonte(origem) {
  if (origem.endsWith('/')) return origem.slice(1) + 'index.html';
  if (origem.endsWith('.html')) return origem.slice(1);
  return origem.slice(1) + '.html';
}

export function htmlDaPonte(destino) {
  if (!SEGURO.test(destino)) throw new Error(`destino inválido: ${destino}`);
  const abs = SITE + destino;
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
${MARCA_PONTE}
<title>Página movida | i9c</title>
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="${abs}">
<meta http-equiv="refresh" content="0; url=${destino}">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<p>Esta página mudou de endereço: <a href="${destino}">${abs.replace('https://', '')}</a></p>
</body>
</html>
`;
}

/** Gera (ou atualiza) uma página-ponte por linha do mapa. Nunca sobrescreve arquivo que não é ponte. */
export function gerarPontes(mapa, pastaPublic) {
  const geradas = [];
  const puladas = [];
  for (const { origem, destino } of mapa) {
    if (!SEGURO.test(origem) || !SEGURO.test(destino) || origem === '/') { puladas.push(`${origem} (caminho inválido)`); continue; }
    const arq = join(pastaPublic, arquivoDaPonte(origem));
    if (existsSync(arq) && !readFileSync(arq, 'utf8').includes(MARCA_PONTE)) { puladas.push(`${origem} (já existe arquivo que não é ponte)`); continue; }
    const html = htmlDaPonte(destino);
    if (existsSync(arq) && readFileSync(arq, 'utf8') === html) continue;
    mkdirSync(dirname(arq), { recursive: true });
    writeFileSync(arq, html);
    geradas.push(arquivoDaPonte(origem));
  }
  return { geradas, puladas };
}

/* ───────────── Relatório ───────────── */

const ROTULO = { nova: 'propor ponte', existe: 'página existe (não é 404 hoje)', 'ja-tem-regra': 'já está no mapa', loop: 'pulada: geraria loop/cadeia' };

export function relatorioMd(proposta, { arquivo, executar, adicionadas, geradas = [], puladas = [] }) {
  const linhas = [
    `# Relatório 404 → página-ponte (${new Date().toISOString().slice(0, 10)})`,
    '',
    `Fonte: \`${arquivo}\` · modo: ${executar ? `**executar** (${adicionadas} linha(s) no mapa, ${geradas.length} página(s)-ponte gravada(s))` : 'dry-run (nada foi gravado)'}`,
    '',
    '| # | URL quebrada | Ocorrências | Situação | Destino sugerido | Motivo |',
    '|---|---|---:|---|---|---|',
    ...proposta.map((p, i) => `| ${i + 1} | \`${p.path}\` | ${p.total} | ${ROTULO[p.status]} | ${p.destino ? `\`${p.destino}\`` : '—'} | ${p.motivo ?? ''} |`),
    '',
  ];
  const novas = proposta.filter((p) => p.status === 'nova');
  linhas.push('## Linhas propostas para `docs/seo/redirects-404.csv`', '', '```');
  linhas.push(...(novas.length ? novas.map((p) => `${p.path},${p.destino}`) : ['# nenhuma']));
  linhas.push('```', '');
  if (puladas.length) linhas.push('## Não gerado', '', ...puladas.map((p) => `- ${p}`), '');
  linhas.push('> Revise cada destino antes de rodar com `--executar`. GitHub Pages não faz 301: a ponte usa meta refresh',
    '> + canonical + noindex. 301 de verdade exige Cloudflare (Pages ou Redirect Rules).', '');
  return linhas.join('\n');
}

function args(argv) {
  const o = { executar: false, dist: 'dist', mapa: 'docs/seo/redirects-404.csv', public: 'public', top: 20, saida: '', arquivo: '' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--executar') o.executar = true;
    else if (a === '--dist') o.dist = argv[++i];
    else if (a === '--mapa') o.mapa = argv[++i];
    else if (a === '--public') o.public = argv[++i];
    else if (a === '--top') o.top = Number(argv[++i]) || 20;
    else if (a === '--saida') o.saida = argv[++i];
    else if (!a.startsWith('--')) o.arquivo = a;
  }
  return o;
}

export function main(argv = process.argv.slice(2)) {
  const o = args(argv);
  if (!o.arquivo) {
    console.error('Uso: node scripts/relatorio-404.mjs <export.csv> [--executar] [--dist dist] [--mapa docs/seo/redirects-404.csv] [--public public] [--top 20] [--saida rel.md]');
    return 2;
  }
  if (!existsSync(o.dist)) {
    console.error(`Pasta ${o.dist}/ não existe: rode "npm run build" antes.`);
    return 2;
  }
  const top = agregar(lerCsv(readFileSync(o.arquivo, 'utf8'))).slice(0, o.top);
  const rotas = rotasDoDist(o.dist);
  const textoMapa = existsSync(o.mapa) ? readFileSync(o.mapa, 'utf8') : '';
  const proposta = montarProposta(top, rotas, lerMapa(textoMapa));
  let adicionadas = 0;
  let geradas = [];
  let puladas = [];
  if (o.executar) {
    const r = aplicarMapa(textoMapa, proposta);
    adicionadas = r.adicionadas;
    if (r.texto !== textoMapa) {
      mkdirSync(dirname(o.mapa), { recursive: true });
      writeFileSync(o.mapa, r.texto);
    }
    ({ geradas, puladas } = gerarPontes(lerMapa(r.texto), o.public));
  }
  const md = relatorioMd(proposta, { arquivo: o.arquivo, executar: o.executar, adicionadas, geradas, puladas });
  if (o.saida) writeFileSync(o.saida, md);
  process.stdout.write(md);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main();
