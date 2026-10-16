# Auditoria de layout — i9c.net.br

**Data:** 16/10/2026 · **Base:** `main` (`f25fbb4` + fix #3)
**Páginas:** `/`, `/planos-black.html`, `/planos-pre-pago.html`, `/portabilidade.html`, `/recargas.html`, `/perguntas-frequentes.html`
**Prints:** `docs/audit/antes/<pagina>-<mobile|tablet|desktop>.png` (375×812 · 768×1024 · 1440×900, página inteira)
**Método:**
- skill `redesign-existing-projects`, só a etapa de diagnóstico;
- regras `web-design-guidelines` da Vercel;
- medição automática de overflow, alvos de toque e contraste WCAG.

> Para os prints, o Tailwind foi compilado localmente com o mesmo `tailwind.config` das páginas, e as fontes vieram de cópias locais.
> O visual é o mesmo do site publicado.

> Contexto: site da operadora móvel (B2C + PME), claro, azul i9c + laranja IVM, tom leve.
> O visual é **bem resolvido**: hero forte, mockup do app, cards de plano claros e prova de preço.
> Os problemas são de **base técnica e navegação**, não de estilo.

---

## Severidade ALTA

| # | Problema | Evidência |
|---|---|---|
| A1 | **Sem menu no celular.** O `<nav>` é `hidden md:flex` e não existe botão de menu. Abaixo de 768 px o visitante só vê o logo e "Contratar". Planos, Cobertura, Portabilidade, Recarga e FAQ só são alcançáveis pelo rodapé. | `index.html:220` (igual nas 10 páginas) · `home-mobile.png` |
| A2 | **Tailwind via Play CDN em produção** (`cdn.tailwindcss.com`) nas 10 páginas. O CSS é gerado no navegador a cada visita: baixa cerca de 300 KB de JS, a página aparece sem estilo por um instante e o console avisa "should not be used in production". Afeta o LCP e o SEO. O CSS compilado tem **34 KB**. | `<script src="https://cdn.tailwindcss.com">` |
| A3 | **Banner de cookies volta em toda página.** `dismissCookies()` grava `i9c_cookies`, mas nada lê esse valor ao carregar. No celular o banner cobre cerca de 250 px da tela, inclusive o hero. | `index.html:35-39`, `#cookie-banner` |
| A4 | **Banner de cookies sem efeito.** O site não carrega GTM, Pixel nem nenhum script de medição, então "Aceitar/Rejeitar" não muda nada. Ou o banner sai, ou o tracking entra com consentimento (como na Voipmundo). **Hoje a i9c não mede visitas nem conversões.** | ausência de `googletagmanager` / `gtag` / `fbq` |
| A5 | **Links de Política de Privacidade e Termos de Uso dão 404** (15 links). É ponto de LGPD, já sinalizado no PR de SEO. | `politica-de-privacidade.html`, `termos-de-uso.html` inexistentes |

## Severidade MÉDIA

| # | Problema | Onde |
|---|---|---|
| M1 | **Contraste do laranja:** branco sobre `#E8672A` (botão "Contratar" do card em destaque e outros CTAs laranja) e laranja sobre branco nos rótulos de 12 px dão **3,28:1**, abaixo de AA (4,5:1). Usar `laranja-dark #C8541E` com branco (4,6:1) ou texto azul-escuro sobre o laranja. | cards de plano, eyebrows |
| M2 | **Seletor de idioma falso:** PT aponta para `#`, e EN/ES são `<span>` sem link. Parece quebrado. Remover até existirem traduções. | barra superior |
| M3 | **Título do hero com letras encostando:** `tracking-tightest` (−0,04em) somado ao `opsz 96` da Bricolage faz as letras de "Sua linha móvel" quase se tocarem no desktop. Sugestão: −0,03em. | `.font-display` + `tracking-tightest` (56 usos) |
| M4 | **Sem `prefers-reduced-motion`:** a faixa rolante (35 s, infinita), as barras de sinal piscando e o `rise` dos cards não param para quem desativa animações. | `<style>` das páginas |
| M5 | **Foco de teclado:** só 2 ocorrências de `focus` no CSS; links e botões dependem do outline padrão do navegador, que some em vários fundos coloridos. | geral |
| M6 | **Alvos de toque pequenos** (13 a 26 por página): links da barra superior ("Sua conta", "Recarga online"), bandeiras e botões do popup do WhatsApp. | barra superior, widget |
| M7 | **Mockup do celular no mobile:** ocupa cerca de 750 px entre o hero e os planos. Reduzir ou esconder abaixo de 640 px. | `home-mobile.png` |
| M8 | **Texto do banner diz "Aceitar todos"**, mas o botão é "Aceitar tudo". | `index.html:171/177` |

## Severidade BAIXA

| # | Problema |
|---|---|
| B1 | Abas de categoria do FAQ no mobile cortam ("Chip & ati…") sem indicar que dá para rolar. Um degradê na borda resolve. |
| B2 | Header, rodapé, cookies e WhatsApp são **copiados em cada uma das 10 páginas** (HTML estático). Qualquer ajuste precisa ser feito 10 vezes. Ver "Proposta" abaixo. |
| B3 | Imagens sem `width`/`height` (por exemplo o logo `h-10 w-auto`) podem deslocar o layout ao carregar. |

## Pontos fortes (manter)

- Hero com proposta clara ("sem firula", a partir de R$ 13,99) e mockup do app com o plano mais vendido.
- Cards de plano legíveis, com destaque do "mais escolhido" e nota de franquia e apps.
- Contraste do texto principal ok: cinza sobre branco 5,0:1 e branco sobre azul i9c 5,75:1.
- Nenhuma página rola para o lado em 375, 768 ou 1440 px.
- Páginas de plano com breadcrumb, FAQ e JSON-LD.

---

## Proposta

**PR 1: correções rápidas, ainda em HTML estático, aplicadas nas 10 páginas por script**
1. **A1:** botão ☰ (44×44) e menu mobile com os mesmos 5 links + "Sua conta" e "Recarga".
2. **A3 + M8:** banner lembra a escolha; texto e botão alinhados.
3. **M1:** CTAs laranja em `laranja-dark` (ou texto escuro).
4. **M2:** remover o seletor de idioma.
5. **M3, M4, M5:** tracking −0,03em, `prefers-reduced-motion` e `:focus-visible` global.

**PR 2: Tailwind compilado (A2)**
- `tailwind.config.js` + `npx tailwindcss -o assets/site.css --minify` no workflow do GitHub Pages.
- Troca o `<script src=cdn.tailwindcss.com>` por `<link rel="stylesheet" href="/assets/site.css">`.

**PR 3: decisões que dependem de você**
- **A4:** medir a i9c? Se sim, o ID do GTM (pode ser o mesmo container da Voipmundo, com outro domínio) e consentimento igual ao da Voipmundo.
- **A5:** Política de Privacidade e Termos, com texto para revisão jurídica.
- **B2:** migrar a i9c para Astro, como a Voipmundo (componentes únicos e build com Tailwind), em vez de manter 10 HTMLs copiados.
