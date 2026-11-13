/**
 * "CONTINUE NAVEGANDO" — o fim de toda página leva a outras páginas do site e a referências externas.
 * Nenhuma página termina sem saída (pedido do Fabricio, 13/11/2026; mesmo bloco do grupoivm #7).
 *
 * - 3 páginas internas por página. Artigo: 2 artigos relacionados + a página do produto do assunto.
 * - Externos só de referência: Anatel, legislação (planalto.gov.br), ANPD, consumidor.gov.br, Wikipédia,
 *   GitHub do grupo e os outros sites do grupo. NUNCA operadora, concorrente ou fornecedor (cliente cego).
 * - Página nova: entra em PAGINAS (título e resumo) e em RELACIONADOS. O teste
 *   scripts/continue-navegando.test.mjs falha se alguma página do dist/ ficar sem o bloco.
 *
 * Nada de sintaxe TS que não seja apagável (o teste importa este arquivo direto no Node).
 */
import { ROTAS, type Idioma } from '../i18n/rotas.ts'; // com extensão: o teste (node --test) importa este arquivo direto

interface Texto { titulo: string; resumo: string }
interface Pagina {
  /** caminho em pt-BR (en/es vêm de ROTAS quando a página tem tradução) */
  href: string;
  rota?: keyof typeof ROTAS;
  'pt-br': Texto;
  en?: Texto;
  es?: Texto;
}

export const PAGINAS = {
  home: {
    href: '/', rota: 'home',
    'pt-br': { titulo: 'Planos da i9c', resumo: 'Pré-pago, controle, família e empresas, com 5G onde houver cobertura e sem fidelidade.' },
    en: { titulo: 'i9c plans', resumo: 'Prepaid, Controle, family and business plans, with 5G where available and no contract.' },
    es: { titulo: 'Planes de i9c', resumo: 'Prepago, control, familia y empresas, con 5G donde haya cobertura y sin permanencia.' },
  },
  'planos-pre-pago': {
    href: '/planos-pre-pago.html', rota: 'planos-pre-pago',
    'pt-br': { titulo: 'Planos pré-pago', resumo: 'Chip com WhatsApp e redes sociais, recarga online e sem mensalidade.' },
    en: { titulo: 'Prepaid plans', resumo: 'SIM with WhatsApp and social apps, online top-up and no monthly bill.' },
    es: { titulo: 'Planes prepago', resumo: 'Chip con WhatsApp y redes sociales, recarga online y sin mensualidad.' },
  },
  'planos-controle': {
    href: '/planos-controle.html', rota: 'planos-controle',
    'pt-br': { titulo: 'Planos controle', resumo: 'Valor fixo por mês, ligações ilimitadas e WhatsApp sem gastar a internet.' },
    en: { titulo: 'Controle plans', resumo: 'Fixed monthly price, unlimited calls and WhatsApp without using your data.' },
    es: { titulo: 'Planes control', resumo: 'Precio fijo al mes, llamadas ilimitadas y WhatsApp sin gastar datos.' },
  },
  'planos-black': {
    href: '/planos-black.html', rota: 'planos-black',
    'pt-br': { titulo: 'Black Individual', resumo: 'Ligações e SMS ilimitados, apps grátis e roaming nacional, sem fidelidade.' },
    en: { titulo: 'Black Individual', resumo: 'Unlimited calls and texts, free apps and nationwide roaming, no contract.' },
    es: { titulo: 'Black Individual', resumo: 'Llamadas y SMS ilimitados, apps gratis y roaming nacional, sin permanencia.' },
  },
  'planos-familia': {
    href: '/planos-familia.html', rota: 'planos-familia',
    'pt-br': { titulo: 'Black Família', resumo: 'Internet compartilhada entre 2 e 6 linhas, com ligações ilimitadas.' },
    en: { titulo: 'Black Family', resumo: 'Data shared across 2 to 6 lines, with unlimited calls.' },
    es: { titulo: 'Black Familia', resumo: 'Internet compartida entre 2 y 6 líneas, con llamadas ilimitadas.' },
  },
  'planos-empresas': {
    href: '/planos-empresas.html', rota: 'planos-empresas',
    'pt-br': { titulo: 'Black Empresas', resumo: 'Linhas para empresas e órgãos públicos, com gestão de voz e dados.' },
    en: { titulo: 'Black Business', resumo: 'Lines for companies and public bodies, with voice and data management.' },
    es: { titulo: 'Black Empresas', resumo: 'Líneas para empresas y organismos públicos, con gestión de voz y datos.' },
  },
  portabilidade: {
    href: '/portabilidade.html', rota: 'portabilidade',
    'pt-br': { titulo: 'Portabilidade', resumo: 'Traga seu número para a i9c, de graça e sem ficar sem linha.' },
    en: { titulo: 'Number portability', resumo: 'Bring your number to i9c, free of charge and without losing service.' },
    es: { titulo: 'Portabilidad numérica', resumo: 'Trae tu número a i9c, gratis y sin quedarte sin línea.' },
  },
  'politica-de-privacidade': {
    href: '/politica-de-privacidade.html', rota: 'politica-de-privacidade',
    'pt-br': { titulo: 'Política de privacidade', resumo: 'Quais dados a i9c trata, para quê e como pedir acesso ou exclusão.' },
    en: { titulo: 'Privacy policy', resumo: 'Which data i9c processes, why, and how to request access or deletion.' },
    es: { titulo: 'Política de privacidad', resumo: 'Qué datos trata i9c, para qué y cómo pedir acceso o eliminación.' },
  },
  'termos-de-uso': {
    href: '/termos-de-uso.html', rota: 'termos-de-uso',
    'pt-br': { titulo: 'Termos de uso', resumo: 'As regras de uso do site e dos serviços da i9c.' },
    en: { titulo: 'Terms of use', resumo: 'The rules for using the i9c website and services.' },
    es: { titulo: 'Términos de uso', resumo: 'Las reglas de uso del sitio y de los servicios de i9c.' },
  },
  'mapa-de-cobertura': {
    href: '/mapa-de-cobertura.html',
    'pt-br': { titulo: 'Mapa de cobertura', resumo: 'Consulte pelo CEP o sinal 5G, 4G e de voz onde você mora e trabalha.' },
  },
  recargas: {
    href: '/recargas.html',
    'pt-br': { titulo: 'Recarga online', resumo: 'Recarregue sua linha pré-pago da i9c sem sair de casa.' },
  },
  'perguntas-frequentes': {
    href: '/perguntas-frequentes.html',
    'pt-br': { titulo: 'Perguntas frequentes', resumo: 'Planos, cobertura, portabilidade, chip, recarga e suporte.' },
  },
  'chip-so-whatsapp': {
    href: '/chip-so-whatsapp.html',
    'pt-br': { titulo: 'Chip só WhatsApp: para quem serve', resumo: 'O que inclui e quando vale escolher um pré-pago com mais internet.' },
  },
  'como-trazer-seu-numero': {
    href: '/como-trazer-seu-numero-para-a-i9c.html',
    'pt-br': { titulo: 'Como trazer seu número para a i9c', resumo: 'Quem pode pedir, documentos, prazo e o que acontece com seus créditos.' },
  },
  'cancelamento-por-falta-de-recarga': {
    href: '/operadora-pode-cancelar-numero-por-falta-de-recarga.html',
    'pt-br': { titulo: 'Operadora pode cancelar o número sem recarga?', resumo: 'As etapas da Anatel até o cancelamento e como não perder o número.' },
  },
  'operadoras-virtuais': {
    href: '/operadoras-virtuais-no-brasil.html',
    'pt-br': { titulo: 'Operadoras virtuais no Brasil', resumo: 'O que é uma operadora virtual e como funcionam sinal, número e atendimento.' },
  },
  'maior-cobertura': {
    href: '/qual-operadora-tem-a-maior-cobertura.html',
    'pt-br': { titulo: 'Qual operadora tem a maior cobertura?', resumo: 'Por que o sinal muda de um lugar para outro e como conferir antes de trocar.' },
  },
} satisfies Record<string, Pagina>;

export type IdPagina = keyof typeof PAGINAS;

/** Wikipédia no idioma da página (sem artigo no idioma, cai no inglês) */
const wiki = (pt: string, en: string, es?: string) => ({
  'pt-br': `https://pt.wikipedia.org/wiki/${pt}`,
  en: `https://en.wikipedia.org/wiki/${en}`,
  es: es ? `https://es.wikipedia.org/wiki/${es}` : `https://en.wikipedia.org/wiki/${en}`,
});
const igual = (url: string) => ({ 'pt-br': url, en: url, es: url });

/** Referências externas. Rótulo por idioma; "(PT)" quando o destino só existe em português. */
export const EXTERNOS = {
  anatel: {
    url: igual('https://www.gov.br/anatel/pt-br'),
    'pt-br': 'Anatel — Agência Nacional de Telecomunicações', en: 'Anatel — Brazil’s telecom regulator (PT)', es: 'Anatel — regulador de telecomunicaciones de Brasil (PT)',
  },
  anatelConsumidor: {
    url: igual('https://www.gov.br/anatel/pt-br/consumidor'),
    'pt-br': 'Anatel: direitos do consumidor de telecom', en: 'Anatel: telecom consumer rights (PT)', es: 'Anatel: derechos del consumidor de telecom (PT)',
  },
  consumidor: {
    url: igual('https://www.consumidor.gov.br/'),
    'pt-br': 'consumidor.gov.br — reclamações com resposta da empresa', en: 'consumidor.gov.br — official consumer complaints portal (PT)', es: 'consumidor.gov.br — portal oficial de reclamaciones (PT)',
  },
  lgt: {
    url: igual('https://www.planalto.gov.br/ccivil_03/leis/l9472.htm'),
    'pt-br': 'Lei Geral de Telecomunicações (Lei 9.472/1997)', en: 'General Telecommunications Law (Law 9,472/1997) (PT)', es: 'Ley General de Telecomunicaciones (Ley 9.472/1997) (PT)',
  },
  cdc: {
    url: igual('https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm'),
    'pt-br': 'Código de Defesa do Consumidor (Lei 8.078/1990)', en: 'Consumer Protection Code (Law 8,078/1990) (PT)', es: 'Código de Defensa del Consumidor (Ley 8.078/1990) (PT)',
  },
  lgpd: {
    url: igual('https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm'),
    'pt-br': 'Lei Geral de Proteção de Dados (Lei 13.709/2018)', en: 'Brazilian Data Protection Law, LGPD (Law 13,709/2018) (PT)', es: 'Ley General de Protección de Datos, LGPD (Ley 13.709/2018) (PT)',
  },
  anpd: {
    url: igual('https://www.gov.br/anpd/pt-br'),
    'pt-br': 'ANPD — Autoridade Nacional de Proteção de Dados', en: 'ANPD — Brazil’s data protection authority (PT)', es: 'ANPD — autoridad de protección de datos de Brasil (PT)',
  },
  wikiMvno: {
    url: wiki('Operador_m%C3%B3vel_virtual', 'Mobile_virtual_network_operator', 'Operador_m%C3%B3vil_virtual'),
    'pt-br': 'Wikipédia: operador móvel virtual (MVNO)', en: 'Wikipedia: mobile virtual network operator (MVNO)', es: 'Wikipedia: operador móvil virtual (OMV)',
  },
  wikiPortabilidade: {
    url: wiki('Portabilidade_num%C3%A9rica', 'Mobile_number_portability', 'Portabilidad_num%C3%A9rica'),
    'pt-br': 'Wikipédia: portabilidade numérica', en: 'Wikipedia: mobile number portability', es: 'Wikipedia: portabilidad numérica',
  },
  wiki5g: {
    url: wiki('5G', '5G', '5G'),
    'pt-br': 'Wikipédia: 5G', en: 'Wikipedia: 5G', es: 'Wikipedia: 5G',
  },
  wikiPrePago: {
    url: igual('https://en.wikipedia.org/wiki/Prepaid_mobile_phone'),
    'pt-br': 'Wikipédia: telefone celular pré-pago (EN)', en: 'Wikipedia: prepaid mobile phone', es: 'Wikipedia: telefonía móvil prepago (EN)',
  },
  wikiLgpd: {
    url: wiki('Lei_Geral_de_Prote%C3%A7%C3%A3o_de_Dados_Pessoais', 'General_Personal_Data_Protection_Law'),
    'pt-br': 'Wikipédia: Lei Geral de Proteção de Dados', en: 'Wikipedia: General Personal Data Protection Law', es: 'Wikipedia: Ley General de Protección de Datos (EN)',
  },
  grupoivm: {
    // en/es do grupoivm no ar desde 13/11/2026 (conferido: 200, lang e canonical próprios)
    url: { 'pt-br': 'https://grupoivm.com.br/marcas/i9c/', en: 'https://grupoivm.com.br/en/brands/i9c/', es: 'https://grupoivm.com.br/es/marcas/i9c/' },
    'pt-br': 'Grupo IVM — a i9c no grupo', en: 'Grupo IVM — i9c in the group', es: 'Grupo IVM — i9c en el grupo',
  },
  voipmundo: {
    url: igual('https://voipmundo.com.br/'),
    'pt-br': 'Voipmundo — telefonia em nuvem e PABX para empresas (Grupo IVM)', en: 'Voipmundo — cloud phone system for businesses (Grupo IVM)', es: 'Voipmundo — telefonía en la nube para empresas (Grupo IVM)',
  },
  ondafone: {
    url: igual('https://ondafone.com.br/'),
    'pt-br': 'Ondafone — app de telefone para o celular e o computador (Grupo IVM)', en: 'Ondafone — phone app for mobile and desktop (Grupo IVM)', es: 'Ondafone — app de teléfono para móvil y computadora (Grupo IVM)',
  },
  github: {
    url: igual('https://github.com/VoIPMundoTelecom'),
    'pt-br': 'GitHub do Grupo IVM (código do Ondafone)', en: 'Grupo IVM on GitHub (Ondafone source code)', es: 'Grupo IVM en GitHub (código de Ondafone)',
  },
} satisfies Record<string, { url: Record<Idioma, string> } & Record<Idioma, string>>;

export type IdExterno = keyof typeof EXTERNOS;

interface Relacionado {
  /** 3 páginas internas em pt-BR */
  internas: IdPagina[];
  /** 3 páginas internas em en/es (só páginas com tradução, para não mandar o leitor para o português) */
  traduzidas?: IdPagina[];
  externas: IdExterno[];
}

export const RELACIONADOS: Record<IdPagina, Relacionado> = {
  home: { internas: ['planos-pre-pago', 'portabilidade', 'mapa-de-cobertura'], traduzidas: ['planos-pre-pago', 'planos-controle', 'portabilidade'], externas: ['anatel', 'wikiMvno', 'grupoivm', 'voipmundo', 'ondafone'] },
  'planos-pre-pago': { internas: ['chip-so-whatsapp', 'recargas', 'planos-controle'], traduzidas: ['planos-controle', 'portabilidade', 'home'], externas: ['anatelConsumidor', 'wikiPrePago', 'consumidor'] },
  'planos-controle': { internas: ['planos-black', 'planos-pre-pago', 'portabilidade'], externas: ['anatelConsumidor', 'wiki5g', 'consumidor'] },
  'planos-black': { internas: ['planos-familia', 'planos-controle', 'mapa-de-cobertura'], traduzidas: ['planos-familia', 'planos-controle', 'portabilidade'], externas: ['anatelConsumidor', 'wiki5g', 'consumidor'] },
  'planos-familia': { internas: ['planos-black', 'portabilidade', 'perguntas-frequentes'], traduzidas: ['planos-black', 'planos-empresas', 'portabilidade'], externas: ['anatelConsumidor', 'wiki5g', 'consumidor'] },
  'planos-empresas': { internas: ['planos-black', 'como-trazer-seu-numero', 'operadoras-virtuais'], traduzidas: ['planos-black', 'planos-familia', 'portabilidade'], externas: ['anatel', 'voipmundo', 'ondafone', 'grupoivm'] },
  portabilidade: { internas: ['como-trazer-seu-numero', 'planos-controle', 'mapa-de-cobertura'], traduzidas: ['planos-pre-pago', 'planos-controle', 'home'], externas: ['anatelConsumidor', 'wikiPortabilidade', 'consumidor'] },
  'politica-de-privacidade': { internas: ['termos-de-uso', 'perguntas-frequentes', 'home'], traduzidas: ['termos-de-uso', 'home', 'portabilidade'], externas: ['lgpd', 'anpd', 'wikiLgpd'] },
  'termos-de-uso': { internas: ['politica-de-privacidade', 'perguntas-frequentes', 'home'], traduzidas: ['politica-de-privacidade', 'home', 'portabilidade'], externas: ['cdc', 'lgt', 'consumidor'] },
  'mapa-de-cobertura': { internas: ['maior-cobertura', 'planos-pre-pago', 'portabilidade'], externas: ['anatel', 'wiki5g', 'wikiMvno'] },
  recargas: { internas: ['cancelamento-por-falta-de-recarga', 'planos-pre-pago', 'chip-so-whatsapp'], externas: ['anatelConsumidor', 'consumidor', 'wikiPrePago'] },
  'perguntas-frequentes': { internas: ['planos-pre-pago', 'portabilidade', 'mapa-de-cobertura'], externas: ['anatelConsumidor', 'consumidor', 'cdc'] },
  // Artigos: 2 artigos relacionados + a página do produto do assunto
  'chip-so-whatsapp': { internas: ['cancelamento-por-falta-de-recarga', 'maior-cobertura', 'planos-pre-pago'], externas: ['anatelConsumidor', 'wikiPrePago'] },
  'como-trazer-seu-numero': { internas: ['operadoras-virtuais', 'maior-cobertura', 'portabilidade'], externas: ['anatelConsumidor', 'wikiPortabilidade', 'consumidor'] },
  'cancelamento-por-falta-de-recarga': { internas: ['chip-so-whatsapp', 'operadoras-virtuais', 'planos-pre-pago'], externas: ['anatelConsumidor', 'consumidor', 'lgt'] },
  'operadoras-virtuais': { internas: ['como-trazer-seu-numero', 'maior-cobertura', 'home'], externas: ['wikiMvno', 'anatel', 'lgt', 'grupoivm'] },
  'maior-cobertura': { internas: ['operadoras-virtuais', 'como-trazer-seu-numero', 'mapa-de-cobertura'], externas: ['anatel', 'wiki5g', 'wikiMvno'] },
};

/** caminho público da página no idioma (página sem tradução: caminho em pt-BR) */
export const hrefDe = (id: IdPagina, idioma: Idioma): string => {
  const p: Pagina = PAGINAS[id];
  return p.rota ? ROTAS[p.rota][idioma] : p.href;
};

const semHtml = (caminho: string) => caminho.replace(/\.html$/, '').replace(/\/index$/, '/').replace(/(.)\/$/, '$1');

/** id da página a partir do caminho da URL (/planos-black, /planos-black.html, /en/black-plans.html...) */
export function paginaDoCaminho(caminho: string): { id: IdPagina; idioma: Idioma } | undefined {
  const alvo = semHtml(caminho);
  for (const id of Object.keys(PAGINAS) as IdPagina[]) {
    for (const idioma of ['pt-br', 'en', 'es'] as const) {
      const p: Pagina = PAGINAS[id];
      if (idioma !== 'pt-br' && !p.rota) continue;
      if (semHtml(hrefDe(id, idioma)) === alvo) return { id, idioma };
    }
  }
  return undefined;
}

export interface Bloco {
  internas: { href: string; titulo: string; resumo: string }[];
  externas: { href: string; rotulo: string }[];
}

export function blocoDe(id: IdPagina, idioma: Idioma): Bloco {
  const r = RELACIONADOS[id];
  const ids = idioma === 'pt-br' ? r.internas : (r.traduzidas ?? r.internas);
  return {
    internas: ids.map((alvo) => {
      const p: Pagina = PAGINAS[alvo];
      const texto = p[idioma] ?? p['pt-br'];
      return { href: hrefDe(alvo, idioma), ...texto };
    }),
    externas: r.externas.map((k) => ({ href: EXTERNOS[k].url[idioma], rotulo: EXTERNOS[k][idioma] })),
  };
}
