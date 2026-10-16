# Site i9c — Operadora Móvel (Grupo IVM)

Site institucional/comercial da **i9c**. Desde 16/10/2026 é um projeto **Astro** com **Tailwind compilado**
(antes: 10 HTMLs estáticos com Tailwind via CDN). As URLs continuam as mesmas (`/planos-black.html` etc.).

## Desenvolvimento

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # gera dist/ (é o que vai para o GitHub Pages)
```

## Estrutura

| Caminho | O quê |
|---|---|
| `src/layouts/Base.astro` | `<head>`, consentimento LGPD + GTM (`GTM-WPL6WQS`), Bitrix24 e o esqueleto de todas as páginas |
| `src/components/Header.astro` | Barra superior + menu (desktop e **mobile**) — um só para o site todo |
| `src/components/Footer.astro`, `WhatsApp.astro`, `CookieBanner.astro` | Rodapé, widget do WhatsApp e aviso de cookies únicos |
| `src/pages/<pagina>.astro` | Uma por página; título, descrição, canonical e item ativo do menu |
| `src/partials/<pagina>.body.html` | **Conteúdo** de cada página (editar aqui) |
| `src/partials/<pagina>.head.html` / `.end.html` | JSON-LD/CSS e scripts próprios da página |
| `src/styles/global.css` | CSS próprio + acessibilidade (foco, reduced-motion) |
| `tailwind.config.cjs` | Cores e fontes da marca (era o config inline) |
| `public/` | Logos, favicons, `assets/` (JS, `municipios.json`), `robots.txt`, `sitemap.xml` |
| `docs/audit/` | Auditoria de layout (não vai para o ar) |

Deploy: `.github/workflows/pages.yml` roda `npm ci && npm run build` e publica `dist/` a cada push na `main`.

## Páginas

| Arquivo | Conteúdo |
|---|---|
| `index.html` | Home: hero, ticker, **planos com tabs** (Pré-pago/Controle/Black/Família/Empresas), cobertura, portabilidade |
| `mapa-de-cobertura.html` | **Mapa Leaflet** com os ~73 mil pontos reais de `municipios.json` (cluster + busca por cidade) |
| `portabilidade.html` | Formulário completo de portabilidade (PF/PJ) com validação e LGPD |
| `perguntas-frequentes.html` | FAQ com filtro por categoria e dados estruturados (JSON-LD) |
| `recargas.html` | Página "em construção" (aponta para o parceiro de recarga) |

## Identidade visual

- **Tailwind via CDN** (`cdn.tailwindcss.com`) com config inline (cores e fontes da marca) — igual ao protótipo.
- Fontes Google: **Bricolage Grotesque** (display), **Inter** (corpo), **Space Grotesk** (rótulos/mono).
- Paleta: IVM Azul `#1E2C5C` · i9c Azul `#136BA2` · Laranja `#E8672A` · Cinza `#716F6E`.
- Logos reais: `i9c-logo.png` (header/positivo) e `i9c-logo-negativo.png` (footer/fundo escuro), com fundo recortado para transparente.

## Como publicar

Site **100% estático**. Suba o conteúdo da pasta para a raiz do domínio `i9c.net.br`.
O Tailwind e as fontes carregam via CDN (precisa de internet do visitante, como no protótipo).
O mapa de cobertura funciona **sem backend** (lê o `municipios.json` estático).

> Opcional para produção: compilar o Tailwind localmente (Tailwind CLI) e servir um CSS
> minificado, em vez do CDN, para performance e independência de rede.

## Mapa de cobertura

`mapa-de-cobertura.html` usa **Leaflet + MarkerCluster + Geocoder** e plota os pontos reais
de **`assets/municipios.json`** (~73 mil localidades; cada `name` traz cidade + tecnologia,
ex.: `Curitiba-2G-3G-4G`). O cluster é carregado em lotes (`chunkedLoading`) para aguentar o
volume, e os popups mostram a cidade e as tecnologias (5G/4G/3G/2G) extraídas do nome.

A fonte dos pontos é configurável no topo de **`assets/cobertura-mapa.js`**:

```js
var DADOS_URL = "assets/municipios.json";   // cópia local do pacote (padrão)
// ou aponte para o WordPress:
// var DADOS_URL = "https://i9c.net.br/wp-content/uploads/2024/11/municipios.json";
```

Para atualizar a cobertura, basta substituir o `municipios.json` (mesmo formato:
`[{ "name": "Cidade-4G", "lat": -25.4, "lng": -49.2 }, ...]`). A busca por cidade/endereço
no mapa usa o geocoder do Leaflet (Nominatim/OSM).

> Os tiles do mapa e o Leaflet são carregados de CDNs externos (OSM e unpkg), exigindo
> internet do visitante — como no protótipo original.

## Formulário de portabilidade (backend)

O envio do formulário faz `POST` para o endpoint definido em `portabilidade.html`:

```js
var ENDPOINT = "/api/portabilidade";   // ajuste se o backend ficar em outro caminho/host
```

O backend de exemplo está em **`backend/portabilidade_api.py`** (FastAPI), com segurança
incorporada: revalidação de CPF/CNPJ no servidor, allowlist de tipos de arquivo, limite de
tamanho, anti path-traversal, checagem de origem, honeypot e log mínimo (LGPD).

```bash
pip install "fastapi>=0.110" "uvicorn[standard]" python-multipart
uvicorn portabilidade_api:app --host 0.0.0.0 --port 8080
```

Variáveis: `I9C_UPLOAD_DIR`, `I9C_ALLOWED_ORIGINS`, `I9C_MAX_FILE_MB`.
Em produção, rode atrás de Nginx/Cloudflare (HTTPS + rate limit) e mantenha `I9C_UPLOAD_DIR`
**fora do webroot**, sem permissão de execução.
Enquanto o backend não estiver no ar, a página mostra erro de conexão amigável — o restante
do site funciona normalmente.

## Integrações

- **WhatsApp**: widget flutuante (popup) → `wa.me/558008000900`.
- **Chat Bitrix24**: script oficial carregado ao final de cada página.
- **Recarga**: na área do cliente (`app.i9c.net.br`, menu Recargas) — número validado por SMS, boleto gerado na conta, crédito após compensação.
- **Área do cliente**: `app.i9c.net.br`.

## Pendências / próximos passos

- **Idiomas EN/ES**: marcados como "em breve" na top bar (PT ativo).
- **Páginas legais**: `politica-de-privacidade.html` e `termos-de-uso.html` estão referenciadas
  no rodapé/cookies, mas ainda precisam ser criadas.
- **Atualizar cobertura**: substituir `assets/municipios.json` quando houver novos pontos.
- **Backend de portabilidade**: subir o FastAPI e confirmar o `ENDPOINT`.

## Estrutura

```
index.html  mapa-de-cobertura.html  portabilidade.html  perguntas-frequentes.html  recargas.html
i9c-logo.png  i9c-logo-negativo.png  robots.txt  sitemap.xml
assets/   favicon.ico + favicon-*.png  cobertura-mapa.js  i9c.js  municipios.json  img/
backend/  portabilidade_api.py
```
