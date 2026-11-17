/*
 * Consentimento de cookies (Grupo IVM / i9c). Vai inline no <head> de todas as páginas (Base.astro).
 *
 * Escolha em localStorage:
 *   ivm_consent      = 'aceito' | 'recusado'
 *   ivm_consent_data = data ISO da escolha (passados 13 meses, o aviso volta)
 * Sem 'aceito' não carrega nada de medição: nem o GTM nem o pixel (/assets/ivm-pixel.js).
 * Aceite no meio da visita carrega na hora; recusa depois do aceite para o pixel e apaga o cookie _ivm_vid.
 * A chave antiga (i9c_cookies) não vale como aceite do texto novo: o aviso aparece de novo uma vez.
 *
 * API: window.ivmConsent.estado() → 'aceito' | 'recusado' | null
 *      window.ivmConsent.definir('aceito' | 'recusado')
 *      window.ivmConsent.abrir()   → reabre o aviso (link "Preferências de cookies")
 */
(function (w, d) {
  var CHAVE = 'ivm_consent';
  var CHAVE_DATA = 'ivm_consent_data';
  var VALIDADE_MS = 396 * 864e5; // 13 meses
  var GTM_ID = 'GTM-WPL6WQS'; // mesmo container da Voipmundo (decisão de 16/10/2026)
  var PIXEL_SRC = '/assets/ivm-pixel.js';

  function ler() {
    try {
      var v = localStorage.getItem(CHAVE);
      var em = Date.parse(localStorage.getItem(CHAVE_DATA) || '');
      if ((v === 'aceito' || v === 'recusado') && em && Date.now() - em < VALIDADE_MS) return v;
    } catch (e) {}
    return null;
  }
  function dataEscolha() {
    try { return localStorage.getItem(CHAVE_DATA); } catch (e) { return null; }
  }

  w.dataLayer = w.dataLayer || [];
  function gtag() { w.dataLayer.push(arguments); }
  var NEGADO = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' };
  var LIBERADO = { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' };
  gtag('consent', 'default', NEGADO);

  function carregarGTM() {
    if (w.__gtmLoaded) return;
    w.__gtmLoaded = true;
    w.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var s = d.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
    (d.head || d.documentElement).appendChild(s);
  }
  function carregarPixel() {
    if (w.ivmPixel) { w.ivmPixel.iniciar(); return; }
    if (w.__ivmPixelPedido) return;
    w.__ivmPixelPedido = true;
    var s = d.createElement('script');
    s.async = true;
    s.src = PIXEL_SRC;
    (d.head || d.documentElement).appendChild(s);
  }
  function apagarRastro() {
    d.cookie = '_ivm_vid=; Max-Age=0; Path=/; SameSite=Lax';
    try { localStorage.removeItem('_ivm_sessao'); } catch (e) {}
  }
  function aplicar(v) {
    if (v === 'aceito') {
      gtag('consent', 'update', LIBERADO);
      carregarGTM();
      carregarPixel();
    } else {
      if (w.ivmPixel) w.ivmPixel.parar();
      apagarRastro();
      if (w.__gtmLoaded) gtag('consent', 'update', NEGADO);
    }
  }

  w.ivmConsent = {
    estado: ler,
    data: dataEscolha,
    definir: function (v) {
      if (v !== 'aceito' && v !== 'recusado') return;
      try {
        localStorage.setItem(CHAVE, v);
        localStorage.setItem(CHAVE_DATA, new Date().toISOString());
        localStorage.removeItem('i9c_cookies');
      } catch (e) {}
      aplicar(v);
      try { d.dispatchEvent(new CustomEvent('ivm:consent', { detail: v })); } catch (e) {}
    },
    abrir: function () {
      try { d.dispatchEvent(new CustomEvent('ivm:consent-abrir')); } catch (e) {}
    },
  };

  if (ler() === 'aceito') aplicar('aceito');
  else apagarRastro(); // sem aceite válido, nenhum _ivm_vid fica no navegador
})(window, document);
