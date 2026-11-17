/*
 * Pixel first-party do Grupo IVM (contrato: givm docs/learnings/mkt-pixel-hub.md).
 * Só é carregado por src/scripts/ivm-consent.js depois de ivm_consent = 'aceito'.
 * Lê só URL (caminho + utm_ e gclid), referrer (origem + caminho), profundidade de rolagem e cliques
 * em links do WhatsApp. Sem biblioteca, sem fingerprint. Erro aqui nunca quebra o site.
 *
 * Cookie _ivm_vid: UUID v4, first-party, 13 meses, SameSite=Lax.
 * localStorage _ivm_sessao: hora da última atividade (30 min sem atividade = sessão nova).
 * Formulário próprio: dispare document 'ivm:form-enviado' com detail {nome, email, telefone, empresa}
 * depois do envio com sucesso → form_submit + /identify.
 */
(function (w, d) {
  try {
    if (w.ivmPixel) { w.ivmPixel.iniciar(); return; }

    var API = 'https://api.givm.com.br/api/public/mkt';
    var SITE = 'i9c.net.br';
    var COOKIE = '_ivm_vid';
    var SESSAO = '_ivm_sessao';
    var TREZE_MESES_S = 396 * 86400;
    var SESSAO_MS = 30 * 60 * 1000;
    var LOTE_MAX = 50;
    var LOTE_BYTES = 60000; // contrato: ≤ 64 KB
    var MARCOS = [25, 50, 75, 100];

    var ativo = false;
    var ouvindo = false;
    var vid = null;
    var fila = [];
    var timer = null;
    var marcos = {};
    var rolagemAgendada = false;

    function consentido() {
      try { return !!w.ivmConsent && w.ivmConsent.estado() === 'aceito'; } catch (e) { return false; }
    }

    function uuid() {
      var c = w.crypto;
      if (c && c.randomUUID) return c.randomUUID();
      var b = new Uint8Array(16);
      c.getRandomValues(b);
      b[6] = (b[6] & 15) | 64;
      b[8] = (b[8] & 63) | 128;
      var h = '';
      for (var i = 0; i < 16; i++) h += (b[i] + 256).toString(16).slice(1);
      return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
    }
    function lerVid() {
      var m = d.cookie.match(/(?:^|;\s*)_ivm_vid=([0-9a-f-]{36})(?:;|$)/);
      return m ? m[1] : null;
    }
    function gravarVid(id) {
      d.cookie = COOKIE + '=' + id + '; Max-Age=' + TREZE_MESES_S + '; Path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
    }
    function apagar() {
      d.cookie = COOKIE + '=; Max-Age=0; Path=/; SameSite=Lax';
      try { localStorage.removeItem(SESSAO); } catch (e) {}
    }

    var PARAMS_OK = /^(utm_(source|medium|campaign|term|content)|gclid|gbraid|wbraid|fbclid)$/;
    /** origem + caminho + só parâmetros de campanha (nunca o resto da query nem o hash) */
    function urlLimpa(u, comCampanha) {
      try {
        var x = new URL(u, location.href);
        var q = [];
        if (comCampanha) {
          x.searchParams.forEach(function (v, k) {
            if (PARAMS_OK.test(k)) q.push(encodeURIComponent(k) + '=' + encodeURIComponent(v.slice(0, 200)));
          });
        }
        return (x.origin + x.pathname + (q.length ? '?' + q.join('&') : '')).slice(0, 2000);
      } catch (e) { return ''; }
    }

    function post(caminho, corpo) {
      var json = JSON.stringify(corpo);
      try {
        // string → text/plain;charset=UTF-8, sem preflight
        if (navigator.sendBeacon && navigator.sendBeacon(API + caminho, json)) return;
      } catch (e) {}
      try {
        fetch(API + caminho, {
          method: 'POST', body: json, keepalive: true, mode: 'no-cors', credentials: 'omit',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        }).catch(function () {});
      } catch (e) {}
    }

    function enviar() {
      clearTimeout(timer);
      timer = null;
      if (!ativo) { fila = []; return; }
      while (fila.length) {
        var lote = fila.splice(0, LOTE_MAX);
        while (lote.length > 1 && JSON.stringify(lote).length > LOTE_BYTES) fila.unshift(lote.pop());
        post('/track', { cookie_id: vid, site: SITE, events: lote });
      }
    }
    function agendar() {
      clearTimeout(timer);
      timer = setTimeout(enviar, 3000);
    }

    function tocarSessao(agora) {
      try { localStorage.setItem(SESSAO, String(agora)); } catch (e) {}
    }
    function sessaoNova(agora) {
      var ultima = 0;
      try { ultima = Number(localStorage.getItem(SESSAO)) || 0; } catch (e) {}
      return !ultima || agora - ultima > SESSAO_MS;
    }

    function evento(nome, extra) {
      if (!ativo) return;
      var agora = Date.now();
      var e = { event: nome, url: urlLimpa(location.href, true), referrer: d.referrer ? urlLimpa(d.referrer, false) : '', ts: agora };
      if (extra) for (var k in extra) e[k] = extra[k];
      fila.push(e);
      tocarSessao(agora);
      if (fila.length >= LOTE_MAX) enviar(); else agendar();
    }

    function pageview() {
      var agora = Date.now();
      marcos = {};
      if (sessaoNova(agora)) evento('session_start');
      evento('pageview');
      enviar();
    }

    function aoRolar() {
      if (rolagemAgendada) return;
      rolagemAgendada = true;
      setTimeout(function () {
        rolagemAgendada = false;
        if (!ativo) return;
        var el = d.documentElement;
        var total = Math.max(el.scrollHeight, d.body ? d.body.scrollHeight : 0);
        if (!total) return;
        var pct = ((w.scrollY || el.scrollTop || 0) + w.innerHeight) / total * 100;
        for (var i = 0; i < MARCOS.length; i++) {
          var m = MARCOS[i];
          if (!marcos[m] && pct >= (m === 100 ? 98 : m)) {
            marcos[m] = true;
            evento('scroll_depth', { scroll_pct: m });
          }
        }
      }, 250);
    }

    var WHATS = /^(https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com|chat\.whatsapp\.com)\/|whatsapp:)/i;
    function aoClicar(e) {
      if (!ativo) return;
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || !WHATS.test(a.href)) return;
      evento('click_whatsapp');
      enviar();
    }

    function aoEnviarForm(e) {
      if (!ativo) return;
      evento('form_submit');
      enviar();
      var f = (e && e.detail) || {};
      var campo = function (v, max) { return typeof v === 'string' ? v.trim().slice(0, max) : ''; };
      var email = campo(f.email, 200);
      var telefone = campo(f.telefone, 40);
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      var foneOk = telefone.replace(/\D/g, '').length >= 10;
      if (!emailOk && !foneOk) return;
      var corpo = { cookie_id: vid, site: SITE };
      var nome = campo(f.nome, 200);
      var empresa = campo(f.empresa, 200);
      if (nome) corpo.nome = nome;
      if (emailOk) corpo.email = email;
      if (foneOk) corpo.telefone = telefone;
      if (empresa) corpo.empresa = empresa;
      post('/identify', corpo);
    }

    function aoEsconder() {
      if (d.visibilityState === 'hidden') enviar();
    }
    function aoVoltar(e) {
      if (e.persisted && ativo) pageview(); // volta pelo bfcache = nova visualização
    }

    function ouvir() {
      if (ouvindo) return;
      ouvindo = true;
      w.addEventListener('scroll', aoRolar, { passive: true });
      d.addEventListener('click', aoClicar, true);
      d.addEventListener('ivm:form-enviado', aoEnviarForm);
      d.addEventListener('visibilitychange', aoEsconder);
      w.addEventListener('pagehide', enviar);
      w.addEventListener('pageshow', aoVoltar);
    }

    function iniciar() {
      try {
        if (ativo || !consentido()) return;
        vid = lerVid();
        if (!vid) { vid = uuid(); gravarVid(vid); }
        ativo = true;
        ouvir();
        pageview();
      } catch (e) { ativo = false; }
    }
    function parar() {
      ativo = false;
      fila = [];
      clearTimeout(timer);
      timer = null;
      vid = null;
      apagar();
    }

    w.ivmPixel = { iniciar: iniciar, parar: parar };
    iniciar();
  } catch (e) { /* nunca quebra o site */ }
})(window, document);
