# Fontes servidas pelo próprio site (PageSpeed, 27/11/2026)
- Fontes da i9c saem de `src/assets/fonts/` (woff2 variável, latin, @fontsource-variable 5.3.0, OFL-1.1) com `@font-face` no topo do `global.css`; nada de Google Fonts no `<head>` (a cadeia fonts.googleapis.com → fonts.gstatic.com segurava o FCP em 3,2–3,5 s no Lighthouse mobile).
- Preload de Inter e Bricolage no `Base.astro`, menos nas páginas `leve` (404/manutenção).
- Medição "antes" na nuvem do Claude: o proxy bloqueia o Google Fonts; usar mock HTTPS local + `--host-resolver-rules` (ver voipmundo-site `docs/learnings/pagespeed-fontes-locais.md`).
