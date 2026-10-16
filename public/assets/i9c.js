/* ============================================================
   i9c — scripts compartilhados
   ============================================================ */
(function () {
  "use strict";

  /* ---- Navegação mobile ---- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.getElementById("nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { links.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); });
    });
  }

  /* ---- Acordeão FAQ ---- */
  document.querySelectorAll(".faq-q").forEach(function (q) {
    q.addEventListener("click", function () {
      var item = q.closest(".faq-item");
      var ans = item.querySelector(".faq-a");
      var open = item.classList.toggle("open");
      q.setAttribute("aria-expanded", open ? "true" : "false");
      ans.style.maxHeight = open ? ans.scrollHeight + "px" : null;
    });
  });

  /* ---- Filtro de categorias da FAQ ---- */
  var cats = document.querySelector(".faq-cats");
  if (cats) {
    cats.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      cats.querySelectorAll("button").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      var cat = b.dataset.cat;
      document.querySelectorAll(".faq-item").forEach(function (item) {
        item.style.display = (cat === "all" || item.dataset.cat === cat) ? "" : "none";
      });
    });
  }

  /* ---- Máscaras simples ---- */
  window.i9cMask = {
    cpfCnpj: function (v) {
      v = v.replace(/\D/g, "");
      if (v.length <= 11) {
        return v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      }
      return v.replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2");
    },
    fone: function (v) {
      v = v.replace(/\D/g, "").slice(0, 11);
      if (v.length > 10) return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
      if (v.length > 6) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
      if (v.length > 2) return v.replace(/(\d{2})(\d{0,5})/, "($1) $2");
      return v;
    },
    cep: function (v) { return v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d{1,3})/, "$1-$2"); }
  };

  /* ---- Validação CPF/CNPJ (dígitos verificadores reais) ---- */
  window.i9cValida = {
    cpf: function (s) {
      s = (s || "").replace(/\D/g, "");
      if (s.length !== 11 || /^(\d)\1{10}$/.test(s)) return false;
      var sum = 0, r;
      for (var i = 0; i < 9; i++) sum += +s[i] * (10 - i);
      r = (sum * 10) % 11; if (r === 10) r = 0; if (r !== +s[9]) return false;
      sum = 0;
      for (i = 0; i < 10; i++) sum += +s[i] * (11 - i);
      r = (sum * 10) % 11; if (r === 10) r = 0;
      return r === +s[10];
    },
    cnpj: function (s) {
      s = (s || "").replace(/\D/g, "");
      if (s.length !== 14 || /^(\d)\1{13}$/.test(s)) return false;
      var calc = function (base) {
        var len = base.length, pos = len - 7, sum = 0;
        for (var i = len; i >= 1; i--) { sum += +base[len - i] * pos--; if (pos < 2) pos = 9; }
        var r = sum % 11; return r < 2 ? 0 : 11 - r;
      };
      var d1 = calc(s.slice(0, 12));
      if (d1 !== +s[12]) return false;
      var d2 = calc(s.slice(0, 13));
      return d2 === +s[13];
    },
    cpfCnpj: function (s) {
      var d = (s || "").replace(/\D/g, "");
      return d.length <= 11 ? this.cpf(d) : this.cnpj(d);
    },
    email: function (s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s || ""); }
  };

  /* ---- Aplicar máscaras automaticamente ---- */
  document.querySelectorAll("[data-mask]").forEach(function (el) {
    var fn = window.i9cMask[el.dataset.mask];
    if (!fn) return;
    el.addEventListener("input", function () { el.value = fn(el.value); });
  });

})();
