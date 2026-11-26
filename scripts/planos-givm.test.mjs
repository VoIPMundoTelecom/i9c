// Planos do site × catálogo do givm (marca i9c): preço e franquia dos 11 planos com equivalente.
// Uso: npm run build && npm run test:planos-givm
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { GIVM_I9C, PRECO_CONTRATAR, formatarPreco, menorPreco } from '../src/data/planos.ts';
import { notaLigacoesTexto } from '../src/data/nota-ligacoes.ts';

const DIST = new URL('../dist/', import.meta.url);
const ler = (rel) => readFileSync(new URL(rel, DIST), 'utf8');
const HTMLS = readdirSync(DIST, { recursive: true }).filter((f) => f.endsWith('.html'));

// Tabela do givm em 26/11/2026 (planos i9c que vão ao site), digitada à parte de src/data/planos.ts.
const TABELA_26_11 = {
  'I9C-5': 18.9, 'I9C-6': 25.9, 'I9C-7': 30.9, 'I9C-2': 38.9, 'I9C-10': 40.9, 'I9C-19': 57.9, 'I9C-12': 78.9,
};

const PAGINAS_PLANO = {
  'planos-pre-pago.html': 'prepago', 'en/prepaid-plans.html': 'prepago', 'es/planes-prepago.html': 'prepago',
  'planos-black.html': 'black', 'en/black-plans.html': 'black', 'es/planes-black.html': 'black',
  'planos-controle.html': 'controle', 'en/controle-plans.html': 'controle', 'es/planes-control.html': 'controle',
  'planos-familia.html': 'familia', 'en/family-plans.html': 'familia', 'es/planes-familiares.html': 'familia',
  'planos-empresas.html': 'empresas', 'en/business-plans.html': 'empresas', 'es/planes-para-empresas.html': 'empresas',
};

const cards = (html) => [...html.matchAll(/<article\b[\s\S]*?<\/article>/g)]
  .map((m) => ({ id: m[0].match(/data-plano="([^"]+)"/)?.[1], html: m[0] }))
  .filter((c) => c.id);

test('GIVM_I9C = tabela do givm de 26/11 (código → preço)', () => {
  for (const [id, g] of Object.entries(GIVM_I9C)) {
    assert.ok(g.codigo in TABELA_26_11, `${id}: ${g.codigo} fora da tabela`);
    assert.equal(g.preco, TABELA_26_11[g.codigo], `${id} (${g.codigo})`);
    assert.equal(PRECO_CONTRATAR[id], g.preco, `${id}: PRECO_CONTRATAR ≠ givm`);
  }
});

test('nenhum marcador {{plano:}}/{{menor:}} sobrando no site', () => {
  for (const f of HTMLS) assert.doesNotMatch(ler(f), /\{\{(plano|menor|contratar|consultor):/, f);
});

// Decisão do Fabricio (26/11, ajuste 1): "ilimitado" só para voz. SMS e dados mostram a franquia do givm.
const SMS_ILIMITADO = /SMS ilimitad|ilimitad[oa]s? (de |e )?SMS|unlimited (texts|SMS)|(calls|ligações|llamadas) (and|e|y) (texts|SMS) (ilimitad|unlimited)|(ligações|llamadas) e SMS ilimitad|(ligações|llamadas) y SMS ilimitad|unlimited calls and texts/i;
// Ajuste 2 (Fabricio 26/11): no card é "Ligações ilimitadas*" (asterisco → rodapé do uso pessoal), sem minutos.
const VOZ_ILIMITADA = /(Ligações ilimitadas|Llamadas ilimitadas|Unlimited calls)\*/;
const VOZ_SEM_ASTERISCO = /(Ligações ilimitadas|Llamadas ilimitadas|Unlimited calls|Ligações ilim\.|Llamadas ilim\.)(?!\*)/i;

test('nenhuma página promete SMS ilimitado (texto, meta, OG e JSON-LD; pt/en/es)', () => {
  for (const f of HTMLS) assert.doesNotMatch(ler(f), SMS_ILIMITADO, f);
});

test('card de plano do givm (pt/en/es): preço do givm, ligações ilimitadas, SMS do givm e sem minutos contados', () => {
  let vistos = 0;
  for (const f of HTMLS) {
    for (const c of cards(ler(f))) {
      const g = GIVM_I9C[c.id];
      if (!g) continue;
      if (f in PAGINAS_PLANO || /^((en|es)\/)?index\.html$/.test(f)) vistos++; // a 404 e a manutenção também passam pela regra
      const texto = c.html.replace(/&nbsp;| /g, ' ');
      assert.ok(texto.includes(formatarPreco(g.preco)), `${f}: ${c.id} sem ${formatarPreco(g.preco)}`);
      assert.doesNotMatch(texto, SMS_ILIMITADO, `${f}: ${c.id} promete SMS ilimitado`);
      if (g.min != null) {
        assert.match(texto, VOZ_ILIMITADA, `${f}: ${c.id} sem "ligações ilimitadas"`);
        assert.doesNotMatch(texto, /\d[.,]000 (min|call min)/, `${f}: ${c.id} ainda mostra minutos contados`);
        const sms = [g.sms.toLocaleString('pt-BR'), g.sms.toLocaleString('en-US')];
        assert.ok(sms.some((s) => new RegExp(`${s.replace('.', '\\.')} (SMS|texts)`).test(texto)), `${f}: ${c.id} sem ${g.sms} SMS`);
      } else {
        assert.match(texto, /0[,.]5 GB/, `${f}: ${c.id} sem 0,5 GB`);
      }
    }
  }
  assert.equal(vistos, 66, '11 planos × (home + página da família) × 3 idiomas');
});

// ---------- Ajuste 2: "Ligações ilimitadas*" + rodapé (pt/en/es) ----------
const IDIOMA_DE = (f) => (f.startsWith('en/') ? 'en' : f.startsWith('es/') ? 'es' : 'pt-br');
const TERMOS = { 'pt-br': '/termos-de-uso.html', en: '/en/terms-of-use.html', es: '/es/terminos-de-uso.html' };
const semTags = (s) => s.replace(/<[^>]+>/g, '');
const notas = (html) => [...html.matchAll(/<p\b[^>]*data-nota-ligacoes[^>]*>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
const PAGINAS_COM_CARD = [
  ...Object.keys(PAGINAS_PLANO), 'index.html', 'en/index.html', 'es/index.html',
  '404.html', 'en/404.html', 'es/404.html', 'manutencao.html',
];

test('todo card com voz ilimitada leva o asterisco (todas as páginas, todos os planos)', () => {
  for (const f of HTMLS) {
    const html = ler(f);
    const blocos = [...cards(html).map((c) => c.html), ...[...html.matchAll(/<article class="perro-card"[\s\S]*?<\/article>/g)].map((m) => m[0])];
    for (const b of blocos) assert.doesNotMatch(b, VOZ_SEM_ASTERISCO, `${f}: card com "ilimitadas" sem *`);
  }
});

test('plano WhatsApp (I9C-5) não promete nada ilimitado', () => {
  let vistos = 0;
  for (const f of HTMLS) {
    for (const c of cards(ler(f)).filter((c) => c.id === 'prepago-whatsapp')) {
      vistos++;
      assert.doesNotMatch(c.html, /ilimitad|unlimited/i, `${f}: card do WhatsApp com "ilimitado"`);
    }
  }
  assert.ok(vistos >= 6, `card do WhatsApp visto só ${vistos} vez(es)`);
});

test('rodapé do "Ligações ilimitadas*" em toda página com plano, no idioma da página, com link aos Termos de Uso', () => {
  for (const f of PAGINAS_COM_CARD) {
    const idioma = IDIOMA_DE(f);
    const html = ler(f);
    const achadas = notas(html);
    assert.equal(achadas.length, 1, `${f}: ${achadas.length} rodapé(s)`);
    assert.equal(semTags(achadas[0]).trim(), notaLigacoesTexto(idioma), `${f}: texto do rodapé`);
    assert.ok(achadas[0].includes(`href="${TERMOS[idioma]}"`), `${f}: sem link para ${TERMOS[idioma]}`);
    assert.match(html, VOZ_ILIMITADA, `${f}: rodapé sem nenhum "ilimitadas*" na página`);
  }
});

test('texto pt do rodapé = o do Fabricio (26/11), palavra por palavra', () => {
  assert.equal(notaLigacoesTexto('pt-br'),
    '*Ligações ilimitadas para qualquer operadora do Brasil, para uso pessoal, conforme a Política de Uso. Para proteger a rede contra uso irregular, como equipamentos que fazem ligações em massa com chips de celular (chipeiras), existe um limite técnico de minutos por mês, informado em cada plano. O uso fora do perfil pessoal descumpre os Termos de Uso.');
});

test('JSON-LD (pt/en/es): Offer.price = preço do card, lowPrice/highPrice = menor/maior', () => {
  for (const [f, familia] of Object.entries(PAGINAS_PLANO)) {
    const html = ler(f);
    const json = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((m) => JSON.parse(m[1])).find((j) => j['@type'] === 'Product');
    assert.ok(json, `${f}: sem Product`);
    const ids = cards(html).map((c) => c.id);
    const precos = json.offers.offers.map((o) => Number(o.price));
    assert.deepEqual(precos, ids.map((id) => PRECO_CONTRATAR[id]), `${f}: offers ≠ cards`);
    assert.equal(Number(json.offers.lowPrice), Math.min(...precos), `${f}: lowPrice`);
    assert.equal(Number(json.offers.highPrice), Math.max(...precos), `${f}: highPrice`);
    assert.equal(json.offers.offerCount, precos.length, `${f}: offerCount`);
    assert.equal(Math.min(...precos), menorPreco(familia), `${f}: menor preço da família`);
  }
});
