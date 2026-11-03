/**
 * Planos da i9c lidos por mais de uma página: fonte única de preço e do link "Contratar".
 *
 * Os partials HTML (src/partials/*.html) usam marcadores no lugar do valor digitado:
 *   {{plano:<id>:preco}}       → R$ 15,99        (espaço comum: <option> do formulário)
 *   {{plano:<id>:preco-card}}  → R$ 15,99   (espaço não separável: cards das páginas de plano)
 *   {{plano:<id>:preco-nbsp}}  → R$&nbsp;15,99   (entidade: cards da home)
 *   {{plano:<id>:valor}}       → 15.99   (schema.org Offer.price)
 *   {{contratar:<id>}}         → botão "Contratar" (formulário com ?plano=<id>; id de CONTRATAR)
 *   {{consultor:<id>}}         → link secundário "Falar com um consultor" (WhatsApp)
 * e a página troca os marcadores com aplicarPlanos(). Marcador desconhecido quebra o build.
 *
 * Por enquanto só os planos usados na 404 têm preço aqui; os outros seguem com o preço escrito no partial.
 */
import { EMPRESA } from './empresa.ts'; // com extensão: os testes (node --test) importam este arquivo direto

/**
 * Destino de todos os botões "Contratar" (cards, home, 404 e topo do site).
 * [bloqueado: URL do formulário de contratação + liberação do Fabricio] — quando o formulário
 * estiver no ar, trocar só esta linha pela URL dele, ex.: 'https://i9c.net.br/contratar.html'.
 * Enquanto for o WhatsApp, o plano vai no texto da mensagem em vez de ?plano=<id>.
 */
export const CONTRATAR_URL: string = EMPRESA.whatsapp;

/** Todos os planos com botão "Contratar": id (vai em ?plano=) → nome usado na mensagem do WhatsApp. */
export const CONTRATAR = {
  'prepago-whatsapp': 'Pré-pago Só WhatsApp · 30 dias',
  'prepago-1gb': 'Pré-pago 1GB · 30 dias',
  'prepago-10gb': 'Pré-pago 10GB · 7 dias',
  'prepago-30gb': 'Pré-pago 30GB · 30 dias',
  'black-1gb': 'Black Individual 1GB · 30 dias',
  'black-5gb': 'Black Individual 5GB · 30 dias',
  'black-10gb': 'Black Individual 10GB · 30 dias',
  'black-50gb': 'Black Individual 50GB · 30 dias',
  'controle-15gb': 'Controle 15GB · 30 dias',
  'controle-30gb': 'Controle 30GB · 30 dias',
  'controle-80gb': 'Controle 80GB · 30 dias',
  'familia-15gb': 'Família 15GB · +1 linha',
  'familia-40gb': 'Família 40GB · +2 linhas',
  'familia-100gb': 'Família 100GB · +3 linhas',
  'familia-230gb': 'Família 230GB · +5 linhas',
  'empresas-3gb': 'Empresas 3GB',
  'empresas-5gb': 'Empresas 5GB',
  'empresas-15gb': 'Empresas 15GB',
  'empresas-50gb': 'Empresas 50GB',
  'empresas-160gb': 'Empresas 160GB',
} as const;

export type ContratarId = keyof typeof CONTRATAR;

const viaWhatsapp = () => CONTRATAR_URL.startsWith(EMPRESA.whatsapp);
const whatsapp = (msg: string) => `${EMPRESA.whatsapp}?text=${encodeURIComponent(msg)}`;

/** Botão "Contratar": sem id = topo do site (formulário sem plano escolhido). */
export function contratarUrl(id?: string): string {
  if (id !== undefined && !(id in CONTRATAR)) throw new Error(`Plano desconhecido em contratarUrl: ${id}`);
  const nome = id ? CONTRATAR[id as ContratarId] : '';
  if (viaWhatsapp()) return whatsapp(nome ? `Olá! Quero contratar o plano ${nome} da i9c.` : 'Olá! Quero contratar um plano da i9c.');
  return id ? `${CONTRATAR_URL}?plano=${encodeURIComponent(id)}` : CONTRATAR_URL;
}

/** "Falar com um consultor": sempre o WhatsApp, mesmo depois do formulário no ar. */
export function consultorUrl(id: string): string {
  const nome = CONTRATAR[id as ContratarId];
  if (!nome) throw new Error(`Plano desconhecido em consultorUrl: ${id}`);
  return whatsapp(`Olá! Quero falar com um consultor sobre o plano ${nome} da i9c.`);
}

export interface Plano {
  nome: string;
  /** página do plano */
  pagina: string;
  /** reais, ex.: 15.99 */
  preco: number;
  /** texto que aparece acima do preço no card da página do plano */
  rotuloPreco: string;
  /** "/mês" quando a página do plano mostra o sufixo */
  sufixo: string;
}

export const PLANOS = {
  'prepago-1gb': {
    nome: 'Pré-pago 1GB',
    pagina: '/planos-pre-pago.html',
    preco: 15.99,
    rotuloPreco: 'a partir de',
    sufixo: '',
  },
  'controle-30gb': {
    nome: 'Controle 30GB',
    pagina: '/planos-controle.html',
    preco: 81.99,
    rotuloPreco: 'a partir de',
    sufixo: '/mês',
  },
  'familia-100gb': {
    nome: 'Família 100GB',
    pagina: '/planos-familia.html',
    preco: 239.99,
    rotuloPreco: 'a partir de',
    sufixo: '/mês',
  },
} satisfies Partial<Record<ContratarId, Plano>>;

export type PlanoId = keyof typeof PLANOS;

export const formatarPreco = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

export function aplicarPlanos(html: string): string {
  return html
    .replace(/\{\{contratar:([a-z0-9-]+)\}\}/g, (_, id: string) => contratarUrl(id))
    .replace(/\{\{consultor:([a-z0-9-]+)\}\}/g, (_, id: string) => consultorUrl(id))
    .replace(/\{\{plano:([a-z0-9-]+):([a-z-]+)\}\}/g, (marcador, id: string, campo: string) => {
    const p = (PLANOS as Record<string, Plano>)[id];
    if (!p) throw new Error(`Plano desconhecido no marcador ${marcador}`);
    switch (campo) {
      case 'preco': return formatarPreco(p.preco);
      case 'preco-card': return formatarPreco(p.preco).replace(' ', ' ');
      case 'preco-nbsp': return formatarPreco(p.preco).replace(' ', '&nbsp;');
      case 'valor': return p.preco.toFixed(2);
      default: throw new Error(`Campo desconhecido no marcador ${marcador}`);
    }
  });
}
