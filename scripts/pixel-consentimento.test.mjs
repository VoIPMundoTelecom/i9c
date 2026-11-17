// Pixel do Grupo IVM + consentimento: npm run test:pixel (os testes do HTML pedem npm run build antes).
// Roda src/scripts/ivm-consent.js e public/assets/ivm-pixel.js num navegador de mentira (node:vm),
// contando cada requisição à API e cada cookie gravado.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const CONSENT_JS = readFileSync(new URL('../src/scripts/ivm-consent.js', import.meta.url), 'utf8');
const PIXEL_JS = readFileSync(new URL('../public/assets/ivm-pixel.js', import.meta.url), 'utf8');
const API = 'https://api.givm.com.br/api/public/mkt';
const UUID4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** navegador mínimo: localStorage, cookies, scripts injetados, sendBeacon/fetch e eventos */
function navegador({ storage = {}, cookies = {}, href = 'https://i9c.net.br/planos-black.html', referrer = '' } = {}) {
  const ls = new Map(Object.entries(storage));
  const jar = new Map(Object.entries(cookies));
  const cookiesGravados = [];
  const scripts = [];
  const reqs = [];
  const ouvintes = {};
  const timers = new Map();
  let seq = 0;
  const on = (alvo) => (tipo, fn) => ((ouvintes[`${alvo}:${tipo}`] ||= []).push(fn));
  const url = new URL(href);
  const document = {
    referrer,
    visibilityState: 'visible',
    documentElement: { scrollHeight: 4000, scrollTop: 0 },
    body: { scrollHeight: 4000 },
    get cookie() { return [...jar].map(([k, v]) => `${k}=${v}`).join('; '); },
    set cookie(s) {
      cookiesGravados.push(s);
      const [par, ...attrs] = s.split(';').map((x) => x.trim());
      const [k, v] = par.split('=');
      if (attrs.some((a) => /^max-age=0$/i.test(a))) jar.delete(k); else jar.set(k, v);
    },
    createElement: () => ({}),
    head: { appendChild: (el) => { scripts.push(el.src); if (el.src === '/assets/ivm-pixel.js') vm.runInContext(PIXEL_JS, ctx); } },
    addEventListener: on('document'),
    dispatchEvent: (ev) => { (ouvintes[`document:${ev.type}`] || []).forEach((fn) => fn(ev)); return true; },
  };
  const window = {
    document,
    location: { href: url.href, protocol: url.protocol },
    navigator: { sendBeacon: (u, body) => { reqs.push({ url: u, body: JSON.parse(body) }); return true; } },
    fetch: (u, o) => { reqs.push({ url: u, body: JSON.parse(o.body) }); return Promise.resolve(); },
    localStorage: {
      getItem: (k) => (ls.has(k) ? ls.get(k) : null),
      setItem: (k, v) => ls.set(k, String(v)),
      removeItem: (k) => ls.delete(k),
    },
    crypto: webcrypto,
    scrollY: 0,
    innerHeight: 800,
    addEventListener: on('window'),
    setTimeout: (fn) => { timers.set(++seq, fn); return seq; }, // roda só no tick()
    clearTimeout: (id) => timers.delete(id),
    URL, Date, JSON, Math, Number, String, Uint8Array,
    CustomEvent: class { constructor(type, o = {}) { this.type = type; this.detail = o.detail; } },
  };
  window.window = window;
  const ctx = vm.createContext(window);
  vm.runInContext(CONSENT_JS, ctx);
  const disparar = (alvo, tipo, ev = {}) => (ouvintes[`${alvo}:${tipo}`] || []).forEach((fn) => fn({ type: tipo, ...ev }));
  const tick = () => { while (timers.size) { const [id, fn] = timers.entries().next().value; timers.delete(id); fn(); } };
  return {
    w: window, tick, ls, jar, reqs, scripts, cookiesGravados, disparar,
    eventos: () => reqs.filter((r) => r.url === `${API}/track`).flatMap((r) => r.body.events.map((e) => e.event)),
    clicar: (href) => disparar('document', 'click', { target: { closest: (sel) => (sel === 'a[href]' ? { href } : null) } }),
  };
}

const aceitoHa = (dias) => ({ ivm_consent: 'aceito', ivm_consent_data: new Date(Date.now() - dias * 864e5).toISOString() });

test('sem escolha: zero requisições, nenhum cookie _ivm_vid, nada de GTM nem pixel', () => {
  const b = navegador();
  assert.equal(b.reqs.length, 0);
  assert.equal(b.jar.has('_ivm_vid'), false);
  assert.deepEqual(b.scripts, []);
  assert.equal(b.w.ivmConsent.estado(), null);
  b.clicar('https://wa.me/558008000900');
  assert.equal(b.reqs.length, 0);
});

test('recusado: zero requisições e cookie antigo _ivm_vid apagado', () => {
  const b = navegador({
    storage: { ivm_consent: 'recusado', ivm_consent_data: new Date().toISOString() },
    cookies: { _ivm_vid: '11111111-1111-4111-8111-111111111111' },
  });
  assert.equal(b.jar.has('_ivm_vid'), false);
  assert.equal(b.reqs.length, 0);
  assert.deepEqual(b.scripts, []);
});

test('chave antiga i9c_cookies=accept não vale como aceite do texto novo', () => {
  const b = navegador({ storage: { i9c_cookies: 'accept' } });
  assert.equal(b.w.ivmConsent.estado(), null);
  assert.equal(b.reqs.length, 0);
  assert.deepEqual(b.scripts, []);
});

test('aceite com mais de 13 meses volta a perguntar e não mede', () => {
  const b = navegador({ storage: aceitoHa(400) });
  assert.equal(b.w.ivmConsent.estado(), null);
  assert.equal(b.reqs.length, 0);
});

test('com aceite: carrega GTM + pixel e envia session_start + pageview', () => {
  const b = navegador({ storage: aceitoHa(1), href: 'https://i9c.net.br/planos-black.html?utm_source=google&cpf=123&x=1#topo', referrer: 'https://www.google.com/search?q=chip' });
  assert.ok(b.scripts.some((s) => s.startsWith('https://www.googletagmanager.com/gtm.js?id=GTM-WPL6WQS')));
  assert.ok(b.scripts.includes('/assets/ivm-pixel.js'));
  assert.equal(b.reqs.length, 1);
  const { url, body } = b.reqs[0];
  assert.equal(url, `${API}/track`);
  assert.equal(body.site, 'i9c.net.br');
  assert.match(body.cookie_id, UUID4);
  assert.deepEqual(body.events.map((e) => e.event), ['session_start', 'pageview']);
  const pv = body.events[1];
  assert.deepEqual(Object.keys(pv).sort(), ['event', 'referrer', 'ts', 'url']);
  assert.equal(pv.url, 'https://i9c.net.br/planos-black.html?utm_source=google', 'query só com utm_*, sem hash');
  assert.equal(pv.referrer, 'https://www.google.com/search', 'referrer sem query');
  assert.ok(Math.abs(pv.ts - Date.now()) < 5000);
  // cookie first-party, 13 meses, SameSite=Lax, Secure no https
  assert.equal(b.jar.get('_ivm_vid'), body.cookie_id);
  const gravado = b.cookiesGravados.find((c) => c.startsWith(`_ivm_vid=${body.cookie_id}`));
  assert.match(gravado, /Max-Age=34214400/);
  assert.match(gravado, /Path=\//);
  assert.match(gravado, /SameSite=Lax/);
  assert.match(gravado, /Secure/);
});

test('segunda página na mesma sessão: só pageview, mesmo cookie_id', () => {
  const b = navegador({ storage: aceitoHa(1) });
  const id = b.reqs[0].body.cookie_id;
  const b2 = navegador({ storage: Object.fromEntries(b.ls), cookies: Object.fromEntries(b.jar) });
  assert.equal(b2.reqs[0].body.cookie_id, id);
  assert.deepEqual(b2.eventos(), ['pageview']);
});

test('sessão nova depois de 30 min sem atividade', () => {
  const b = navegador({ storage: { ...aceitoHa(1), _ivm_sessao: String(Date.now() - 31 * 60e3) } });
  assert.deepEqual(b.eventos(), ['session_start', 'pageview']);
});

test('aceite no meio da visita: começa a medir na hora', () => {
  const b = navegador();
  assert.equal(b.reqs.length, 0);
  b.w.ivmConsent.definir('aceito');
  assert.equal(b.w.ivmConsent.estado(), 'aceito');
  assert.match(b.ls.get('ivm_consent_data'), /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(b.eventos(), ['session_start', 'pageview']);
  assert.ok(b.jar.has('_ivm_vid'));
});

test('clique no WhatsApp e rolagem 25/50/75/100 (cada marco uma vez)', () => {
  const b = navegador({ storage: aceitoHa(1) });
  b.clicar('https://wa.me/558008000900?text=oi');
  b.clicar('/planos-black.html');
  b.w.scrollY = 3200; // 3200 + 800 = 4000 = 100%
  b.disparar('window', 'scroll');
  b.tick();
  b.disparar('window', 'scroll');
  b.tick();
  const ev = b.reqs.flatMap((r) => r.body.events || []);
  assert.deepEqual(ev.map((e) => e.event), ['session_start', 'pageview', 'click_whatsapp', 'scroll_depth', 'scroll_depth', 'scroll_depth', 'scroll_depth']);
  assert.deepEqual(ev.filter((e) => e.scroll_pct).map((e) => e.scroll_pct), [25, 50, 75, 100]);
});

test('formulário: form_submit e depois /identify (só com e-mail válido ou telefone)', () => {
  const b = navegador({ storage: aceitoHa(1) });
  b.w.document.dispatchEvent(new b.w.CustomEvent('ivm:form-enviado', { detail: { nome: 'Teste', email: 'teste@exemplo.com.br', telefone: '(41) 99999-0000', empresa: '' } }));
  assert.equal(b.reqs.at(-2).url, `${API}/track`);
  assert.deepEqual(b.reqs.at(-2).body.events.map((e) => e.event), ['form_submit']);
  assert.equal(b.reqs.at(-1).url, `${API}/identify`);
  assert.deepEqual(b.reqs.at(-1).body, { cookie_id: b.reqs[0].body.cookie_id, site: 'i9c.net.br', nome: 'Teste', email: 'teste@exemplo.com.br', telefone: '(41) 99999-0000' });
  const n = b.reqs.length;
  b.w.document.dispatchEvent(new b.w.CustomEvent('ivm:form-enviado', { detail: { nome: 'X', email: 'invalido', telefone: '123' } }));
  assert.equal(b.reqs.length, n + 1, 'sem contato válido: só o form_submit');
});

test('recusar depois de aceitar: para de enviar e apaga _ivm_vid', () => {
  const b = navegador({ storage: aceitoHa(1) });
  assert.ok(b.jar.has('_ivm_vid'));
  b.w.ivmConsent.definir('recusado');
  assert.equal(b.jar.has('_ivm_vid'), false);
  assert.equal(b.ls.has('_ivm_sessao'), false);
  const n = b.reqs.length;
  b.clicar('https://wa.me/558008000900');
  b.w.scrollY = 3200;
  b.disparar('window', 'scroll');
  b.tick();
  b.disparar('window', 'pagehide');
  b.w.document.dispatchEvent(new b.w.CustomEvent('ivm:form-enviado', { detail: { email: 'a@b.com.br' } }));
  assert.equal(b.reqs.length, n);
  assert.equal(b.jar.has('_ivm_vid'), false);
});

test('erro de rede não quebra: sendBeacon que lança cai no fetch', () => {
  const b = navegador();
  b.w.navigator.sendBeacon = () => { throw new Error('bloqueado'); };
  b.w.ivmConsent.definir('aceito');
  assert.deepEqual(b.eventos(), ['session_start', 'pageview']);
});

// ---- HTML gerado (npm run build) ----
const DIST = new URL('../dist/', import.meta.url);
const temBuild = existsSync(new URL('index.html', DIST));
const opts = { skip: !temBuild && 'rode npm run build' };
const ler = (rel) => readFileSync(new URL(rel, DIST), 'utf8');
const PAGINAS = ['index.html', 'planos-black.html', 'portabilidade.html', 'blog/index.html', 'en/index.html', 'es/index.html', '404.html'];

test('HTML: nenhum rastreador no HTML inicial; consentimento inline no <head>', opts, () => {
  for (const p of PAGINAS) {
    const html = ler(p);
    const head = html.slice(0, html.indexOf('</head>'));
    assert.match(head, /\.ivmConsent = \{/, `${p}: gerenciador de consentimento no head`);
    assert.doesNotMatch(html, /<script[^>]+src="[^"]*(googletagmanager|ivm-pixel)/, `${p}: GTM/pixel em <script src> fixo`);
    assert.doesNotMatch(html, /i9c_cookies['"]\)\s*===/, `${p}: chave antiga ainda decide algo`);
  }
});

test('HTML: aviso com Aceitar e Recusar de mesmo destaque, link de privacidade e "Preferências de cookies" no rodapé', opts, () => {
  const casos = [
    ['index.html', 'Aceitar', 'Recusar', 'Preferências de cookies', '/politica-de-privacidade.html#contato'],
    ['en/index.html', 'Accept', 'Decline', 'Cookie preferences', '/en/privacy-policy.html#contato'],
    ['es/index.html', 'Aceptar', 'Rechazar', 'Preferencias de cookies', '/es/politica-de-privacidad.html#contato'],
  ];
  for (const [p, aceitar, recusar, pref, priv] of casos) {
    const html = ler(p);
    const banner = html.match(/<div id="cookie-banner"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/)?.[0] ?? '';
    assert.match(banner, /\bhidden\b/, `${p}: começa escondido`);
    const botoes = [...banner.matchAll(/<button type="button" data-consent="(aceito|recusado)" class="([^"]+)"[^>]*>([^<]+)</g)];
    assert.equal(botoes.length, 2, p);
    assert.equal(botoes[0][2], botoes[1][2], `${p}: mesmas classes nos dois botões`);
    assert.deepEqual(botoes.map((b) => b[3]).sort(), [aceitar, recusar].sort());
    assert.ok(banner.includes(`href="${priv}"`), `${p}: link ${priv}`);
    assert.match(banner, /13 (meses|months)/);
    const footer = html.slice(html.lastIndexOf('<footer'));
    assert.match(footer, new RegExp(`data-consent-abrir[^>]*>${pref}<`), `${p}: ${pref} no rodapé`);
  }
});

test('texto provisório num arquivo só, marcado TODO da S1', () => {
  const txt = readFileSync(new URL('../src/data/consentimento.ts', import.meta.url), 'utf8');
  assert.match(txt, /TODO: texto oficial da S1/);
});
