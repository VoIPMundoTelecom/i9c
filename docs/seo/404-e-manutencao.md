# 404 de conversão e página de manutenção (i9c)

- `src/pages/404.astro` → `dist/404.html` · `src/pages/manutencao.astro` → `dist/manutencao.html`
- Corpo comum: `src/components/PaginaErro.astro` (CSS escopado: utilitário novo do Tailwind mudaria o
  CSS compartilhado e o HTML de todas as páginas).
- Planos da 404: lista `PLANOS_PAGINA_ERRO` em `src/data/pagina-erro.ts`.
  **[decisão do Fabricio]** confirmar os 3 mais vendidos (hoje: Pré-pago 1GB, Controle 30GB, Família 100GB).
- Preço e link "Contratar": `src/data/planos.ts`, a mesma fonte das páginas de plano (marcadores
  `{{plano:id:campo}}` nos partials). Para pôr outro plano na 404, cadastre-o em `PLANOS` e troque
  o valor digitado nos partials pelo marcador.
- `noindex`, sem canonical, fora do `public/sitemap.xml`. `leve` no `Base`: sem o chat do Bitrix24 e
  fontes sem bloquear a renderização (Lighthouse mobile ≥ 90).

## Status 404

O GitHub Pages serve `404.html` da raiz com status 404. Conferir depois do deploy:

```bash
curl -sI https://i9c.net.br/x-nao-existe | head -1                       # esperado: HTTP/2 404
curl -s  https://i9c.net.br/x-nao-existe | grep -c 'data-pagina-erro'    # esperado: 1
```

## Eventos (dataLayer → GTM → GA4)

Só com consentimento (`localStorage.i9c_cookies === 'accept'`); se a pessoa aceitar os cookies na
própria 404, o `pagina_404` sai nesse momento. Mesmo container GTM da Voipmundo.

| Evento | Parâmetros | Quando |
|---|---|---|
| `pagina_404` | `pagina_quebrada` (pathname), `referrer_host` (só o host), `tipo_pagina` (`404`) | ao abrir a 404 |
| `cta_404_plano` | `plano` (`prepago-1gb` · `controle-30gb` · `familia-100gb`), `pagina_quebrada`, `tipo_pagina` | clique em "Contratar agora" |
| `cta_404_whatsapp` | `pagina_quebrada`, `tipo_pagina` | clique em "Falar no WhatsApp" |

O "Contratar" leva ao WhatsApp (mesmo destino da página do plano) com as UTMs no fim do link; o
WhatsApp ignora UTM, então a medição de conversão da 404 é o evento `cta_404_plano`.

## Relatório semanal 404 → página-ponte

O GitHub Pages **não tem 301 configurável nem `_redirects`**. O script grava o mapa
`docs/seo/redirects-404.csv` (`origem,destino`) e gera uma página-ponte estática em `public/` por linha
(meta refresh para o destino + canonical para o destino + noindex). Nunca sobrescreve arquivo que não
seja ponte.

1. Toda segunda, quem cuida do marketing exporta **um** destes CSVs:
   - GA4 → Explorar → Forma livre: dimensão `pagina_quebrada`, métrica "Contagem de eventos", filtro evento = `pagina_404`, últimos 7 dias → Exportar CSV;
   - ou Search Console → Indexação → Páginas → "Não encontrado (404)" → Exportar.
2. `npm run build && npm run relatorio:404 -- caminho/do/export.csv` (dry-run).
3. Revisar os destinos. Se ok: `npm run relatorio:404 -- caminho/do/export.csv --executar`, rodar
   `npm run build` e abrir PR com o CSV e as páginas novas em `public/`.

Busca automática no GA4/Search Console: **[bloqueado: credencial GA4/Search Console]**.
301 de verdade: **[decisão do Fabricio]** mover a i9c para o Cloudflare Pages ou usar Cloudflare
Redirect Rules na zona `i9c.net.br`. Aí o mapa vira a lista de regras.

## Como ligar a manutenção (não está ligada)

`/manutencao.html` fica publicada, sem link no site. No GitHub Pages não existe "modo manutenção"
nem 503. Opções, da mais simples para a mais correta:

1. **Página por página**: trocar temporariamente o conteúdo de uma página quebrada por um link/refresh
   para `/manutencao.html` e fazer deploy. Desfazer com revert do PR.
2. **Site inteiro (recomendado se o site estiver na zona do Cloudflare)**: Cloudflare → Rules →
   Redirect Rule temporária (302) de `i9c.net.br/*` para `https://i9c.net.br/manutencao.html`,
   excluindo `/manutencao.html`, `/_astro/*`, `/assets/*` e `/i9c-logo*.png`. Desligar a regra ao terminar.
