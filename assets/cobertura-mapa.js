/* ============================================================
   i9c — Mapa de cobertura (Leaflet + MarkerCluster + Geocoder)
   Cada ponto de municipios.json = uma localidade atendida.
   O campo "name" embute cidade + tecnologias, ex: "Curitiba-2G-3G-4G".

   >>> ONDE EDITAR <<<
   DADOS_URL: caminho do arquivo de pontos. Por padrão usa a cópia local
   do pacote (assets/municipios.json). Se preferir servir do WordPress,
   troque pela URL pública, ex:
     var DADOS_URL = "https://i9c.net.br/wp-content/uploads/2024/11/municipios.json";
   ============================================================ */
(function () {
  "use strict";
  var DADOS_URL = "assets/municipios.json";

  var map = L.map("map", { scrollWheelZoom: true }).setView([-14.235, -51.9253], 4);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap · Grupo IVM Tecnologia"
  }).addTo(map);

  // ---- Cluster na cor da marca (azul i9c) ----
  function clusterIcon(cluster) {
    var n = cluster.getChildCount();
    var size = n < 100 ? 38 : n < 1000 ? 46 : 54;
    return L.divIcon({
      html: '<div style="background:#136BA2;color:#fff;border:3px solid rgba(255,255,255,.85);' +
            'box-shadow:0 4px 14px -4px rgba(30,44,92,.6);width:100%;height:100%;border-radius:9999px;' +
            'display:flex;align-items:center;justify-content:center;font:700 13px/1 Inter,system-ui,sans-serif">' +
            n + "</div>",
      className: "i9c-cluster",
      iconSize: L.point(size, size)
    });
  }

  // marcador individual (pin laranja da marca)
  var pin = L.divIcon({
    html: '<div style="width:14px;height:14px;border-radius:9999px;background:#E8672A;' +
          'border:2px solid #fff;box-shadow:0 2px 6px -1px rgba(30,44,92,.5)"></div>',
    className: "i9c-pin",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -7]
  });

  var markers = L.markerClusterGroup({
    chunkedLoading: true,           // carrega em lotes sem travar a UI (73k pontos)
    chunkInterval: 120,
    chunkDelay: 30,
    maxClusterRadius: 55,
    spiderfyOnMaxZoom: true,
    iconCreateFunction: clusterIcon
  });

  var TECHS = ["5G", "4G", "3G", "2G"];
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
  function parseName(name) {
    var techs = [];
    TECHS.forEach(function (t) { if (name.indexOf(t) !== -1) techs.push(t); });
    // cidade = nome sem tokens de tecnologia e sem separadores nas bordas
    var cidade = name.replace(/[-_](?:5G|4G|3G|2G)/g, "")
                     .replace(/(?:5G|4G|3G|2G)/g, "")
                     .replace(/[-_]+/g, " ")
                     .replace(/\s+/g, " ").trim();
    if (!cidade) cidade = name;
    // ordena techs por geração desc
    techs.sort(function (a, b) { return TECHS.indexOf(a) - TECHS.indexOf(b); });
    return { cidade: cidade, techs: techs };
  }
  function badge(t) {
    var cls = (t === "5G") ? "background:#E7F0F6;color:#136BA2"
            : (t === "4G") ? "background:#FCEEE3;color:#C8541E"
            : "background:#F4F4F3;color:#716F6E";
    return '<span style="' + cls + ';padding:2px 7px;border-radius:6px;font:600 11px/1.4 \'Space Grotesk\',monospace;margin-right:4px">' + t + "</span>";
  }
  function popupHTML(info) {
    var bs = info.techs.length ? info.techs.map(badge).join("") : '<span style="color:#716F6E;font-size:12px">cobertura ativa</span>';
    return '<div style="min-width:160px">' +
             '<div style="font:700 15px/1.2 \'Bricolage Grotesque\',system-ui,sans-serif;color:#1E2C5C;margin-bottom:6px">' + esc(info.cidade) + "</div>" +
             '<div style="display:flex;flex-wrap:wrap;gap:2px;margin-bottom:8px">' + bs + "</div>" +
             '<a href="portabilidade.html" style="font:600 12px/1 Inter,sans-serif;color:#136BA2;text-decoration:none">Trazer meu número →</a>' +
           "</div>";
  }

  var status = document.getElementById("map-status");

  fetch(DADOS_URL)
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function (data) {
      var lote = [];
      for (var i = 0; i < data.length; i++) {
        var m = data[i];
        if (typeof m.lat !== "number" || typeof m.lng !== "number") continue;
        var mk = L.marker([m.lat, m.lng], { icon: pin });
        mk._cob = parseName(m.name || "");
        mk.bindPopup(function (layer) { return popupHTML(layer._cob); });
        lote.push(mk);
      }
      markers.addLayers(lote);
      map.addLayer(markers);
      if (status) status.textContent = lote.length.toLocaleString("pt-BR") + " pontos de cobertura no mapa.";
    })
    .catch(function (err) {
      console.error("Erro ao carregar cobertura:", err);
      if (status) status.innerHTML = "Não foi possível carregar o mapa agora. Tente recarregar a página ou fale pelo <a href='https://wa.me/558008000900' style='color:#136BA2;font-weight:600'>0800 800 0900</a>.";
    });

  // ---- Busca por endereço / rua / CEP (somente Brasil, pt-BR) ----
  if (L.Control && L.Control.Geocoder) {
    // Nominatim restrito ao Brasil e em português — entende "av", "rua", "travessa", etc.
    var nominatim = L.Control.Geocoder.nominatim({
      geocodingQueryParams: {
        countrycodes: "br",
        "accept-language": "pt-BR",
        limit: 8,
        addressdetails: 1
      }
    });

    // Geocoder customizado: detecta CEP (com ou sem máscara) e resolve via ViaCEP antes de localizar.
    var geocoderBR = {
      geocode: function (query, cb, context) {
        var digits = (query || "").replace(/\D/g, "");
        // CEP brasileiro = 8 dígitos (ex.: 80240060 ou 80.240-060)
        if (/^\d{8}$/.test(digits)) {
          fetch("https://viacep.com.br/ws/" + digits + "/json/")
            .then(function (r) { return r.json(); })
            .then(function (d) {
              if (d.erro) { nominatim.geocode(query, cb, context); return; }
              // monta o endereço a partir do CEP e geocodifica no Nominatim (BR)
              var endereco = [d.logradouro, d.bairro, d.localidade, d.uf, "Brasil"].filter(Boolean).join(", ");
              nominatim.geocode(endereco, function (results) {
                if (results && results.length) { cb.call(context, results); return; }
                // fallback: só cidade/UF (CEP de cidades pequenas pode não ter logradouro)
                var cidadeUf = [d.localidade, d.uf, "Brasil"].filter(Boolean).join(", ");
                nominatim.geocode(cidadeUf, cb, context);
              }, context);
            })
            .catch(function () { nominatim.geocode(query, cb, context); });
          return;
        }
        // endereço/rua/cidade normal
        nominatim.geocode(query, cb, context);
      },
      // sem autocomplete (respeita o limite de uso do Nominatim; busca no Enter/lupa)
      suggest: function (query, cb, context) { cb.call(context, []); },
      reverse: function (location, scale, cb, context) {
        return nominatim.reverse(location, scale, cb, context);
      }
    };

    L.Control.geocoder({
      defaultMarkGeocode: false,
      geocoder: geocoderBR,
      placeholder: "Buscar cidade, rua, av., travessa ou CEP…",
      errorMessage: "Endereço ou CEP não encontrado no Brasil."
    })
      .on("markgeocode", function (e) {
        var g = e.geocode;
        if (g.bbox) {
          map.fitBounds(g.bbox, { maxZoom: 16 }); // evita zoom excessivo em ruas
        } else if (g.center) {
          map.setView(g.center, 15);
        }
      })
      .addTo(map);
  }
})();
