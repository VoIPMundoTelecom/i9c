// node --test scripts/relatorio-404.test.mjs — usa só a fixture fictícia e pastas temporárias.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { lerCsv, agregar, rotasDoDist, montarProposta, lerMapa, aplicarMapa, gerarPontes, htmlDaPonte, arquivoDaPonte, main, MARCA_PONTE } from './relatorio-404.mjs';

const FIXTURE = new URL('./fixtures/404-ga4-exemplo.csv', import.meta.url);
const PAGINAS = ['index', 'planos-pre-pago', 'planos-controle', 'planos-familia', 'portabilidade', 'recargas', 'mapa-de-cobertura', '404', 'manutencao'];

function distFalso() {
  const dir = mkdtempSync(join(tmpdir(), 'i9c404-'));
  for (const p of PAGINAS) writeFileSync(join(dir, `${p}.html`), '<html></html>');
  writeFileSync(join(dir, 'ponte-velha.html'), htmlDaPonte('/'));
  return dir;
}
const temp = (n) => mkdtempSync(join(tmpdir(), n));
const proposta = () => Object.fromEntries(
  montarProposta(agregar(lerCsv(readFileSync(FIXTURE, 'utf8'))), rotasDoDist(distFalso()), []).map((x) => [x.path, x]));

test('agrega por pathname, sem query string (e-mail não vaza)', () => {
  const top = agregar(lerCsv(readFileSync(FIXTURE, 'utf8')));
  assert.deepEqual(top.find((t) => t.path === '/planos-pre-pag.html'), { path: '/planos-pre-pag.html', total: 40 });
  assert.ok(!JSON.stringify(top).includes('fulana'));
});

test('rotas do dist (format file) sem 404, manutenção e pontes', () => {
  const rotas = rotasDoDist(distFalso());
  assert.ok(rotas.has('/') && rotas.has('/planos-controle.html'));
  for (const r of ['/404.html', '/manutencao.html', '/ponte-velha.html']) assert.ok(!rotas.has(r), r);
});

test('/x sem .html conta como página existente (o Pages serve x.html)', () => {
  assert.equal(proposta()['/planos-controle'].status, 'existe');
});

test('sugere slug parecido, senão home do serviço, senão home', () => {
  const p = proposta();
  assert.equal(p['/planos-pre-pag.html'].destino, '/planos-pre-pago.html');
  assert.equal(p['/planos-familia-antigo.html'].destino, '/planos-familia.html');
  assert.equal(p['/recarga-online/'].destino, '/recargas.html');
  assert.equal(p['/promo-chip-2024.html'].destino, '/');
});

test('não cria cadeia/loop', () => {
  const [p] = montarProposta([{ path: '/planos-velho.html', total: 1 }], new Set(['/planos-velhos.html']), [{ origem: '/planos-velhos.html', destino: '/' }]);
  assert.equal(p.status, 'loop');
  assert.equal(aplicarMapa('origem,destino\n', [p]).adicionadas, 0);
});

test('ponte: arquivo certo, refresh + canonical + noindex, nunca sobrescreve página real', () => {
  assert.equal(arquivoDaPonte('/a.html'), 'a.html');
  assert.equal(arquivoDaPonte('/a/'), 'a/index.html');
  assert.equal(arquivoDaPonte('/a'), 'a.html');
  const html = htmlDaPonte('/planos-pre-pago.html');
  assert.match(html, /<meta http-equiv="refresh" content="0; url=\/planos-pre-pago\.html">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/i9c\.net\.br\/planos-pre-pago\.html">/);
  assert.match(html, /<meta name="robots" content="noindex, follow">/);
  assert.throws(() => htmlDaPonte('/x"><script>'));
  const pub = temp('i9c404p-');
  writeFileSync(join(pub, 'real.html'), '<html>página de verdade</html>');
  const { geradas, puladas } = gerarPontes([{ origem: '/real.html', destino: '/' }, { origem: '/velha/', destino: '/recargas.html' }], pub);
  assert.deepEqual(geradas, ['velha/index.html']);
  assert.equal(puladas.length, 1);
  assert.equal(readFileSync(join(pub, 'real.html'), 'utf8'), '<html>página de verdade</html>');
});

test('dry-run não grava; --executar grava mapa + pontes uma vez e não duplica', () => {
  const dist = distFalso();
  const pub = temp('i9c404pub-');
  const mapa = join(temp('i9c404m-'), 'redirects-404.csv');
  writeFileSync(mapa, 'origem,destino\n');
  const opts = [FIXTURE.pathname, '--dist', dist, '--mapa', mapa, '--public', pub];
  const silencio = process.stdout.write;
  process.stdout.write = () => true;
  try {
    main(opts);
    assert.equal(readFileSync(mapa, 'utf8'), 'origem,destino\n');
    assert.ok(!existsSync(join(pub, 'planos-pre-pag.html')));
    main([...opts, '--executar']);
    const uma = readFileSync(mapa, 'utf8');
    assert.ok(uma.includes('/planos-pre-pag.html,/planos-pre-pago.html'));
    assert.ok(readFileSync(join(pub, 'planos-pre-pag.html'), 'utf8').includes(MARCA_PONTE));
    assert.ok(existsSync(join(pub, 'recarga-online/index.html')));
    main([...opts, '--executar']);
    assert.equal(readFileSync(mapa, 'utf8'), uma);
    assert.equal(lerMapa(uma).length, new Set(lerMapa(uma).map((r) => r.origem)).size);
  } finally {
    process.stdout.write = silencio;
  }
});
