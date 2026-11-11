// Teste pós-build da entidade da marca (JSON-LD): npm run build && npm run test:entidade
// Organization com @id, nome da marca, legalName, logo, sameAs = redes do rodapé e
// parentOrganization ligado ao @id que grupoivm.com.br publica; WebSite na home; frase igual no rodapé.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const DIST = new URL('../dist/', import.meta.url);
const ler = (rel) => readFileSync(new URL(rel, DIST), 'utf8');
const temBuild = existsSync(new URL('index.html', DIST));
const jsonld = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const decod = (s) => s.replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"');

const opts = { skip: !temBuild && 'rode npm run build' };

test('Organization: @id, marca, legalName, logo e Grupo IVM como pai', opts, () => {
  for (const pagina of ['index.html', 'en/index.html', 'es/index.html']) {
    const org = jsonld(ler(pagina)).find((s) => s['@type'] === 'Organization');
    assert.ok(org, `${pagina}: sem Organization`);
    assert.equal(org['@id'], 'https://i9c.net.br/#organization');
    assert.equal(org.name, 'i9c');
    assert.equal(org.legalName, 'IVM Telecomunicação');
    assert.ok(existsSync(new URL(new URL(org.logo).pathname.slice(1), DIST)), 'logo não está no build');
    assert.equal(org.parentOrganization['@id'], 'https://grupoivm.com.br#organization');
  }
});

test('sameAs inclui todas as redes do rodapé', opts, () => {
  const html = ler('index.html');
  const org = jsonld(html).find((s) => s['@type'] === 'Organization');
  const rodape = html.match(/<footer[\s\S]*?<\/footer>/)[0];
  const redes = [...rodape.matchAll(/href="(https:\/\/(?:www\.)?(?:facebook|instagram|x|linkedin|youtube|tiktok)\.com\/[^"]+)"/g)].map((m) => m[1]);
  assert.ok(redes.length > 0);
  for (const r of redes) assert.ok(org.sameAs.includes(r), `sameAs sem ${r}`);
});

test('frase da marca igual no schema e no rodapé (pt)', opts, () => {
  const html = ler('index.html');
  const org = jsonld(html).find((s) => s['@type'] === 'Organization');
  assert.ok(decod(html.match(/<footer[\s\S]*?<\/footer>/)[0]).includes(org.description));
});

test('WebSite só na home, publicado pela Organization', opts, () => {
  for (const pagina of ['index.html', 'en/index.html', 'es/index.html']) {
    const site = jsonld(ler(pagina)).find((s) => s['@type'] === 'WebSite');
    assert.equal(site?.publisher['@id'], 'https://i9c.net.br/#organization', pagina);
  }
  assert.ok(!jsonld(ler('perguntas-frequentes.html')).some((s) => s['@type'] === 'WebSite'));
});
