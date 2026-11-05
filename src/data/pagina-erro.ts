/**
 * Conteúdo da 404 e da manutenção (src/components/PaginaErro.astro).
 * Preço e link de contratar vêm de PLANOS (src/data/planos.ts), os mesmos das páginas de plano.
 *
 * [decisão do Fabricio] confirmar os 3 planos mais vendidos. Para trocar, mude os ids abaixo
 * (o plano precisa existir em PLANOS).
 */
import { contratarUrl, type PlanoId } from './planos';
import { ROTAS, type Idioma } from '../i18n/rotas';

export const PLANOS_PAGINA_ERRO: { id: PlanoId; beneficio: string }[] = [
  { id: 'prepago-1gb', beneficio: 'Recarrega quando quiser, sem fatura e sem fidelidade.' },
  { id: 'controle-30gb', beneficio: 'Ligações ilimitadas' }, // mesmo texto do card do plano
  { id: 'familia-100gb', beneficio: 'Você e mais 3 linhas no mesmo plano.' },
];

/** Links rápidos: os 4 primeiros itens do menu (Header.astro). */
export const LINKS_RAPIDOS = [
  { titulo: 'Planos', href: '/#planos' },
  { titulo: 'Cobertura', href: '/mapa-de-cobertura.html' },
  { titulo: 'Portabilidade', href: '/portabilidade.html' },
  { titulo: 'Recarga', href: '/recargas.html' },
] as const;

/**
 * Mesmo destino do botão "Contratar" da página do plano + UTMs. Concatena em vez de usar
 * URLSearchParams para não re-codificar o ?text= do WhatsApp (que já vem codificado).
 */
export function contratarHref(id: PlanoId, medium = '404', mensagem?: string) {
  const [base, hash = ''] = contratarUrl(id, mensagem).split('#');
  const utm = `utm_source=site&utm_medium=${medium}&utm_campaign=${id}`;
  return `${base}${base.includes('?') ? '&' : '?'}${utm}${hash ? `#${hash}` : ''}`;
}

/* ---------- 404 em inglês e espanhol (/en/404.html, /es/404.html) ---------- */

type PlanoTraduzido = { nome: string; pagina: string; rotuloPreco: string; sufixo: string; beneficio: string; msg: string };

/** Mesmos 3 planos e mesmo preço (PLANOS); só nome, rótulo, benefício e mensagem do WhatsApp traduzidos. O link de contratar é o contratarHref (mesmo destino nos 3 idiomas). */
export const PLANOS_ERRO_TRADUZIDOS: Record<'en' | 'es', Record<PlanoId, PlanoTraduzido>> = {
  en: {
    'prepago-1gb': { nome: 'Prepaid 1GB', pagina: ROTAS['planos-pre-pago'].en, rotuloPreco: 'from', sufixo: '', beneficio: 'Top up whenever you want: no bill, no contract.', msg: "Hi! I'd like to sign up for the i9c Prepaid 1GB · 30 days plan." },
    'controle-30gb': { nome: 'Controle 30GB', pagina: ROTAS['planos-controle'].en, rotuloPreco: 'from', sufixo: '/month', beneficio: 'Unlimited calls', msg: "Hi! I'd like to sign up for the i9c Controle 30GB · 30 days plan." },
    'familia-100gb': { nome: 'Family 100GB', pagina: ROTAS['planos-familia'].en, rotuloPreco: 'from', sufixo: '/month', beneficio: 'You plus 3 more lines on the same plan.', msg: "Hi! I'd like to sign up for the i9c Family 100GB · +3 lines plan." },
  },
  es: {
    'prepago-1gb': { nome: 'Prepago 1GB', pagina: ROTAS['planos-pre-pago'].es, rotuloPreco: 'desde', sufixo: '', beneficio: 'Recargas cuando quieras, sin factura y sin permanencia.', msg: '¡Hola! Quiero contratar el plan Prepago 1GB · 30 días de i9c.' },
    'controle-30gb': { nome: 'Control 30GB', pagina: ROTAS['planos-controle'].es, rotuloPreco: 'desde', sufixo: '/mes', beneficio: 'Llamadas ilimitadas', msg: '¡Hola! Quiero contratar el plan Control 30GB · 30 días de i9c.' },
    'familia-100gb': { nome: 'Familia 100GB', pagina: ROTAS['planos-familia'].es, rotuloPreco: 'desde', sufixo: '/mes', beneficio: 'Tú y 3 líneas más en el mismo plan.', msg: '¡Hola! Quiero contratar el plan Familia 100GB · +3 líneas de i9c.' },
  },
};

/** Textos fixos da página de erro por idioma (pt = os que já estavam no componente). */
export const TEXTOS_ERRO: Record<Idioma, {
  buscarRotulo: string; buscarPlaceholder: string; buscar: string; escolha: string; contratar: string;
  zapTexto: string; zapBotao: string; selosAria: string; selos: string[]; linksAria: string; linksTitulo: string;
  links: readonly { titulo: string; href: string; pt?: boolean }[];
}> = {
  'pt-br': {
    buscarRotulo: 'Buscar no site', buscarPlaceholder: 'Ex.: portabilidade, recarga', buscar: 'Buscar',
    escolha: 'Aproveita e escolhe seu plano', contratar: 'Contratar agora',
    zapTexto: 'Ficou com dúvida? Chama a gente no WhatsApp que a gente te ajuda a escolher.', zapBotao: 'Falar no WhatsApp',
    selosAria: 'Sobre a i9c', selos: ['Sem fidelidade', 'Pagamento por Pix ou boleto'],
    linksAria: 'Links rápidos', linksTitulo: 'Ou vá direto para', links: LINKS_RAPIDOS,
  },
  en: {
    buscarRotulo: 'Search the site', buscarPlaceholder: 'e.g. portability, top-up', buscar: 'Search',
    escolha: 'While you’re here, pick a plan', contratar: 'Sign up now',
    zapTexto: 'Questions? Message us on WhatsApp and we’ll help you choose.', zapBotao: 'Chat on WhatsApp',
    selosAria: 'About i9c', selos: ['No contract', 'Pay with Pix or boleto'],
    linksAria: 'Quick links', linksTitulo: 'Or go straight to',
    links: [
      { titulo: 'Plans', href: '/en/#planos' },
      { titulo: 'Number portability', href: ROTAS.portabilidade.en },
      { titulo: 'Coverage (PT)', href: '/mapa-de-cobertura.html', pt: true },
      { titulo: 'Top-up (PT)', href: '/recargas.html', pt: true },
    ],
  },
  es: {
    buscarRotulo: 'Buscar en el sitio', buscarPlaceholder: 'Ej.: portabilidad, recarga', buscar: 'Buscar',
    escolha: 'Ya que estás aquí, elige tu plan', contratar: 'Contratar ahora',
    zapTexto: '¿Tienes dudas? Escríbenos por WhatsApp y te ayudamos a elegir.', zapBotao: 'Hablar por WhatsApp',
    selosAria: 'Sobre i9c', selos: ['Sin permanencia', 'Pago con Pix o boleto'],
    linksAria: 'Enlaces rápidos', linksTitulo: 'O ve directo a',
    links: [
      { titulo: 'Planes', href: '/es/#planos' },
      { titulo: 'Portabilidad numérica', href: ROTAS.portabilidade.es },
      { titulo: 'Cobertura (PT)', href: '/mapa-de-cobertura.html', pt: true },
      { titulo: 'Recarga (PT)', href: '/recargas.html', pt: true },
    ],
  },
};
