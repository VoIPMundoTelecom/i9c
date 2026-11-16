# Regras de MKT — i9c

> **Regra-mãe (Fabricio, 15/11/2026):** as regras de marketing da Voipmundo valem para **todo site do Grupo IVM**
> (i9c, ondafone-site, grupoivm/Karretel e qualquer site novo), sem exceção e sem precisar repetir.
> **Fonte única = `voipmundo-site/docs`.** Este arquivo só aponta para lá; não copie as regras para cá.
> Se uma regra mudar, muda lá.

Base: <https://github.com/VoIPMundoTelecom/voipmundo-site/tree/main/docs>

## Onde está cada regra (voipmundo-site)

| Assunto | Arquivo-fonte |
|---|---|
| Copy e voz (4 perguntas, estruturas, gancho, CTA, checklist; prova social só real; comodato/"sem taxa de aparelho" com "\* Sob consulta.") | [docs/conteudo/COPY.md](https://github.com/VoIPMundoTelecom/voipmundo-site/blob/main/docs/conteudo/COPY.md) |
| Conteúdo diário e mídia (realismo com `busca:`, revisão na galeria, **regra do pré-pago i9c 15d/60d/75d**) | [docs/conteudo/AUTOMACAO-diaria.md](https://github.com/VoIPMundoTelecom/voipmundo-site/blob/main/docs/conteudo/AUTOMACAO-diaria.md) |
| YouTube (descrição padrão com UTM, nada apagado) | [docs/conteudo/YOUTUBE.md](https://github.com/VoIPMundoTelecom/voipmundo-site/blob/main/docs/conteudo/YOUTUBE.md) |
| SEO diário (todas as consultas; mudança a cada 1–2 dias em rodízio; mesma página só a cada 7 dias; indexação a cada 2 dias) | [docs/seo/RANK-DIARIO.md](https://github.com/VoIPMundoTelecom/voipmundo-site/blob/main/docs/seo/RANK-DIARIO.md) |
| Palavras-chave e clusters (inclui a seção i9c) | [docs/seo/KEYWORDS.md](https://github.com/VoIPMundoTelecom/voipmundo-site/blob/main/docs/seo/KEYWORDS.md) |
| Histórico do Google Ads | [docs/seo/HISTORICO-ADS.md](https://github.com/VoIPMundoTelecom/voipmundo-site/blob/main/docs/seo/HISTORICO-ADS.md) |
| Pedido de indexação (Search Console) | [docs/seo/INDEXAR.md](https://github.com/VoIPMundoTelecom/voipmundo-site/blob/main/docs/seo/INDEXAR.md) |
| Idiomas pt/en/es (slug no idioma, hreflang + x-default, sitemap e 404 por idioma) | [docs/seo/i18n.md](https://github.com/VoIPMundoTelecom/voipmundo-site/blob/main/docs/seo/i18n.md) |
| 404 de conversão e manutenção (eventos GTM/GA4, relatório 404→301) | [docs/seo/404-e-manutencao.md](https://github.com/VoIPMundoTelecom/voipmundo-site/blob/main/docs/seo/404-e-manutencao.md) |
| IndexNow + sitemap-index | [scripts/indexnow.mjs](https://github.com/VoIPMundoTelecom/voipmundo-site/blob/main/scripts/indexnow.mjs) · [.github/workflows/indexnow.yml](https://github.com/VoIPMundoTelecom/voipmundo-site/blob/main/.github/workflows/indexnow.yml) |

## Regras que valem em toda página (resumo de bolso; o detalhe está nos arquivos acima)

- **"Continue navegando"** no fim de toda página. Links externos só de autoridade (Anatel, gov.br etc.).
  **Nunca** concorrente, operadora ou fornecedor (cliente cego; `npm run test:cliente-cego`).
- **Preço** só da fonte única de preços do site. Na i9c = `src/data/planos.ts` (o `PRECOS` da i9c),
  com os marcadores `{{plano:id:campo}}` nos partials. Fora disso: `[CONFERIR PREÇO]`.
- **i9c sempre "5G onde houver cobertura"**. Nunca prometer cobertura.
- Prova social só real; nunca estatística ou depoimento inventado; sem dado de cliente real.
- **Logos e imagens de marca só de `~/marcas`** (README.md e MANIFEST.json de lá). Faltou arquivo: parar e perguntar.

## As peças da i9c (implementação local de cada regra)

| Peça | Na i9c |
|---|---|
| Palavras-chave i9c | [docs/seo/KEYWORDS.md](seo/KEYWORDS.md) (aponta para o KEYWORDS da Voipmundo) |
| Pedido de indexação i9c | [docs/seo/INDEXAR.md](seo/INDEXAR.md) |
| Idiomas | [docs/seo/i18n.md](seo/i18n.md) · tabela `src/i18n/rotas.ts` · `npm run test:i18n` |
| 404 de conversão e manutenção | [docs/seo/404-e-manutencao.md](seo/404-e-manutencao.md) · `npm run test:404` |
| IndexNow | `scripts/indexnow.mjs` + `.github/workflows/indexnow.yml` (roda depois do deploy do Pages) |
| sitemap-index | `public/sitemap-index.xml` (→ `sitemap.xml`, `sitemap-en.xml`, `sitemap-es.xml`), no `robots.txt` |
| Registro do SEO diário da i9c | no [RANK-DIARIO.md da Voipmundo](https://github.com/VoIPMundoTelecom/voipmundo-site/blob/main/docs/seo/RANK-DIARIO.md) (um registro só para o grupo) |
