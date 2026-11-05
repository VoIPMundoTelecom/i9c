/**
 * Tabela única de rotas traduzidas: usada pelo hreflang (Base.astro), pelo seletor de idioma
 * (Header/Footer), pelos sitemaps (public/sitemap-en.xml e sitemap-es.xml, conferidos em
 * scripts/i18n.test.mjs) e pela troca de idioma da 404.
 *
 * Só entra aqui página que tem as 3 versões (pt-BR, en, es). Página fora da tabela não ganha
 * hreflang e o seletor leva para a home do idioma.
 *
 * Nada de sintaxe TS que não seja apagável (o teste importa este arquivo direto no Node).
 */

export const SITE = 'https://i9c.net.br';

export const IDIOMAS = ['pt-br', 'en', 'es'] as const;
export type Idioma = (typeof IDIOMAS)[number];

/** valor do atributo hreflang e do <html lang> */
export const HREFLANG = { 'pt-br': 'pt-BR', en: 'en', es: 'es' } as const;
export const OG_LOCALE = { 'pt-br': 'pt_BR', en: 'en_US', es: 'es_ES' } as const;
export const NOME_IDIOMA = { 'pt-br': 'Português', en: 'English', es: 'Español' } as const;
export const SIGLA_IDIOMA = { 'pt-br': 'PT', en: 'EN', es: 'ES' } as const;

export const ROTAS = {
  home: { 'pt-br': '/', en: '/en/', es: '/es/' },
  'planos-pre-pago': { 'pt-br': '/planos-pre-pago.html', en: '/en/prepaid-plans.html', es: '/es/planes-prepago.html' },
  'planos-controle': { 'pt-br': '/planos-controle.html', en: '/en/controle-plans.html', es: '/es/planes-control.html' },
  'planos-familia': { 'pt-br': '/planos-familia.html', en: '/en/family-plans.html', es: '/es/planes-familiares.html' },
  'planos-black': { 'pt-br': '/planos-black.html', en: '/en/black-plans.html', es: '/es/planes-black.html' },
  'planos-empresas': { 'pt-br': '/planos-empresas.html', en: '/en/business-plans.html', es: '/es/planes-para-empresas.html' },
  portabilidade: { 'pt-br': '/portabilidade.html', en: '/en/number-portability.html', es: '/es/portabilidad-numerica.html' },
  'politica-de-privacidade': { 'pt-br': '/politica-de-privacidade.html', en: '/en/privacy-policy.html', es: '/es/politica-de-privacidad.html' },
  'termos-de-uso': { 'pt-br': '/termos-de-uso.html', en: '/en/terms-of-use.html', es: '/es/terminos-de-uso.html' },
} as const;

export type Rota = keyof typeof ROTAS;

/** 404 por idioma (noindex, fora do sitemap e da tabela de hreflang) */
export const PAGINA_404 = { 'pt-br': '/404.html', en: '/en/404.html', es: '/es/404.html' } as const;

export const caminho = (rota: Rota, idioma: Idioma) => ROTAS[rota][idioma];
export const urlAbsoluta = (rota: Rota, idioma: Idioma) => SITE + ROTAS[rota][idioma];

/** Link do seletor: página equivalente; sem equivalente, a home do idioma. */
export const linkIdioma = (rota: Rota | undefined, idioma: Idioma) =>
  rota ? ROTAS[rota][idioma] : ROTAS.home[idioma];

/** Astro.currentLocale → Idioma (fora de /en/ e /es/ é pt-br) */
export const idiomaDe = (locale: string | undefined): Idioma =>
  locale === 'en' || locale === 'es' ? locale : 'pt-br';
