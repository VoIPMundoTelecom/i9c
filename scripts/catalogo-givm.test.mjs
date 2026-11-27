// Site × catálogo i9c do givm (rota pública, snapshot em src/data/catalogo-givm-i9c.json): o site mostra exatamente
// os planos que a rota devolveu, com o preço e a franquia dela (Fabricio 26/11).
// Uso: npm run build && npm run test:catalogo
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { CATALOGO, FORA_DO_SITE } from '../src/data/catalogo-givm.ts';
import { CARDS_CATALOGO, CONTRATAR, PRECO_CONTRATAR, SMS_GIVM, formatarPreco } from '../src/data/planos.ts';

const DIST = new URL('../dist/', import.meta.url);
const ler = (rel) => readFileSync(new URL(rel, DIST), 'utf8');
const HTMLS = readdirSync(DIST, { recursive: true }).filter((f) => f.endsWith('.html'));
const PAGINAS_BLACK = ['planos-black.html', 'en/black-plans.html', 'es/planes-black.html'];
const cards = (html) => [...html.matchAll(/<article\b[\s\S]*?<\/article>/g)]
  .map((m) => ({ id: m[0].match(/data-plano="([^"]+)"/)?.[1], givm: m[0].match(/data-givm="([^"]+)"/)?.[1], html: m[0] }))
  .filter((c) => c.id);
const texto = (s) => s.replace(/&nbsp;|\u00a0/g, " ");

// O que GET /api/public/planos?marca=i9c devolveu em 26/11/2026 (17 planos "visível no site"), digitado à parte.
const ROTA_26_11 = {
  '+Black WhatsAPP': 18.9, '+Black 03GB': 25.9, '+Black 05GB': 30.9, '+Black 06GB': 32.9, '+Flex 10GB': 36.9,
  '+Black 10GB': 38.9, '+Black 12GB': 39.9, '+Black 15GB': 40.9, '+Flex 20GB': 43.9, '+Black 20GB': 45.9,
  '+Black 24GB': 53.9, '+Black 30GB': 57.9, '+Black 40GB': 61.9, '+Flex 50GB': 73.9, '+Black 50GB': 78.9,
  '+Flex 100GB': 129.9, '+Black 60GB': 154.9,
};

test('catálogo = o que a rota devolveu (17 planos, nome e preço)', () => {
  assert.deepEqual(Object.fromEntries(CATALOGO.map((p) => [p.nomeGivm, p.preco])), ROTA_26_11);
});

test('+Black 60GB (I9C-22) entra: família Black, 60 GB, com card', () => {
  const p = CARDS_CATALOGO.find((c) => c.nomeGivm === '+Black 60GB');
  assert.ok(p, '+Black 60GB fora do site');
  assert.equal(p.familia, 'black');
  assert.equal(p.gb, 60);
  assert.equal(p.id, 'black-60gb');
});

test('LEG-629, I9C-8 e I9C-20 nunca aparecem (nem no catálogo, nem em página nenhuma)', () => {
  assert.deepEqual(FORA_DO_SITE, ['LEG-629', 'I9C-8', 'I9C-20']);
  for (const f of HTMLS) for (const c of FORA_DO_SITE) assert.ok(!ler(f).includes(c), `${f}: ${c}`);
});

test('página Black (pt/en/es): Black 1GB + exatamente os Black e Flex do catálogo, com preço e franquia dele', () => {
  const esperado = ['black-1gb', ...CARDS_CATALOGO.map((c) => c.id)];
  assert.equal(CARDS_CATALOGO.length, 16, '17 da rota menos o WhatsApp (card do pré-pago)');
  for (const f of PAGINAS_BLACK) {
    const cs = cards(ler(f));
    assert.deepEqual(cs.map((c) => c.id), esperado, `${f}: cards`);
    for (const c of cs.slice(1)) {
      const p = CARDS_CATALOGO.find((x) => x.id === c.id);
      const t = texto(c.html);
      assert.equal(c.givm, p.nomeGivm, `${f}: ${c.id} data-givm`);
      assert.ok(t.includes(formatarPreco(ROTA_26_11[p.nomeGivm])), `${f}: ${c.id} sem ${formatarPreco(ROTA_26_11[p.nomeGivm])}`);
      assert.match(t, new RegExp(`>${p.gb}<span[^>]*>GB<`), `${f}: ${c.id} sem ${p.gb}GB`);
      assert.equal(PRECO_CONTRATAR[c.id], ROTA_26_11[p.nomeGivm], `${c.id}: PRECO_CONTRATAR`);
    }
  }
});

test('Black = "Ligações ilimitadas*"; Flex sem nenhum texto de ligação nem "ilimitado"', () => {
  for (const f of PAGINAS_BLACK) {
    for (const c of cards(ler(f))) {
      if (c.id.startsWith('flex-')) {
        assert.doesNotMatch(c.html, /liga|chamad|llamad|call|voz|voice|ilimitad|unlimited|SMS|texts/i, `${f}: ${c.id}`);
      } else {
        assert.match(c.html, /(Ligações ilimitadas|Unlimited calls|Llamadas ilimitadas)\*/, `${f}: ${c.id}`);
      }
    }
  }
});

test('SMS só onde o givm informa a quantidade (tabela de 26/11 + Black novos de 27/11); nos outros, nenhuma linha de SMS', () => {
  for (const f of PAGINAS_BLACK) {
    for (const c of cards(ler(f)).filter((c) => c.givm)) {
      const sms = SMS_GIVM[c.givm];
      if (sms == null) assert.doesNotMatch(c.html, /SMS|texts/, `${f}: ${c.id} (${c.givm}) com SMS sem fonte`);
      else assert.match(texto(c.html), new RegExp(`${sms.toLocaleString(f.startsWith('en/') ? 'en-US' : 'pt-BR').replace('.', '\\.')} (SMS|texts)`), `${f}: ${c.id}`);
    }
  }
});

test('o WhatsApp do catálogo é o card "Só WhatsApp" do pré-pago, com o preço da rota', () => {
  for (const f of ['planos-pre-pago.html', 'en/prepaid-plans.html', 'es/planes-prepago.html']) {
    const c = cards(ler(f)).find((x) => x.id === 'prepago-whatsapp');
    assert.ok(c, `${f}: sem card do WhatsApp`);
    assert.ok(texto(c.html).includes(formatarPreco(ROTA_26_11['+Black WhatsAPP'])), f);
  }
});

test('nenhum id black-/flex- em CONTRATAR sem plano no catálogo (menos o Black 1GB, fora do givm)', () => {
  const doCatalogo = new Set(CARDS_CATALOGO.map((c) => c.id));
  for (const id of Object.keys(CONTRATAR).filter((i) => /^(black|flex)-/.test(i) && i !== 'black-1gb')) {
    assert.ok(doCatalogo.has(id), `${id} em CONTRATAR, mas a rota não devolveu o plano`);
  }
});
