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
 * [bloqueado: liberação do Fabricio] — formulário = 'https://contratar.i9c.net.br/' (o plano vai
 * em ?plano=<código do givm>, ver CODIGO_GIVM). Só trocar esta linha depois do OK e com o de-para
 * completo: com algum código vazio o build quebra.
 * Enquanto for o WhatsApp, o plano vai no texto da mensagem.
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

/**
 * De-para id do site → código do plano no catálogo do givm (o givm gera <prefixo>-<n>, na i9c "I9C-<n>").
 * [bloqueado: catálogo i9c da S1 não publicado] — preencher com o que vier de GET /public/i9c/planos
 * e conferir com `npm run check:de-para`. null = ainda sem código (o formulário não pode ser ligado).
 */
export const CODIGO_GIVM: Record<ContratarId, string | null> = {
  'prepago-whatsapp': null,
  'prepago-1gb': null,
  'prepago-10gb': null,
  'prepago-30gb': null,
  'black-1gb': null,
  'black-5gb': null,
  'black-10gb': null,
  'black-50gb': null,
  'controle-15gb': null,
  'controle-30gb': null,
  'controle-80gb': null,
  'familia-15gb': null,
  'familia-40gb': null,
  'familia-100gb': null,
  'familia-230gb': null,
  'empresas-3gb': null,
  'empresas-5gb': null,
  'empresas-15gb': null,
  'empresas-50gb': null,
  'empresas-160gb': null,
};

const viaWhatsapp = () => CONTRATAR_URL.startsWith(EMPRESA.whatsapp);
const whatsapp = (msg: string) => `${EMPRESA.whatsapp}?text=${encodeURIComponent(msg)}`;

/** Link do formulário para o plano: ?plano=<código do givm>. Sem código no de-para = erro (quebra o build). */
export function formularioUrl(base: string, id: ContratarId): string {
  const codigo = CODIGO_GIVM[id];
  if (!codigo) throw new Error(`De-para incompleto: ${id} sem código do givm em CODIGO_GIVM`);
  return `${base}?plano=${encodeURIComponent(codigo)}`;
}

/**
 * Botão "Contratar": sem id = topo do site (formulário sem plano escolhido).
 * `mensagem` (páginas en/es): só troca o texto do WhatsApp enquanto o destino for o WhatsApp;
 * com o formulário no ar o link é idêntico nos 3 idiomas (?plano=<código do givm>).
 */
export function contratarUrl(id?: string, mensagem?: string): string {
  if (id !== undefined && !(id in CONTRATAR)) throw new Error(`Plano desconhecido em contratarUrl: ${id}`);
  const nome = id ? CONTRATAR[id as ContratarId] : '';
  if (viaWhatsapp()) return whatsapp(mensagem ?? (nome ? `Olá! Quero contratar o plano ${nome} da i9c.` : 'Olá! Quero contratar um plano da i9c.'));
  return id ? formularioUrl(CONTRATAR_URL, id as ContratarId) : CONTRATAR_URL;
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

/**
 * Preço de cada plano com botão "Contratar" (reais), usado no value do begin_checkout.
 * Conferido no site no ar em 03/11/2026. Os da 404 vêm de PLANOS; os outros ainda estão escritos
 * no partial, e o test:contratar falha se o card mostrar valor diferente deste.
 */
export const PRECO_CONTRATAR: Record<ContratarId, number> = {
  'prepago-whatsapp': 13.99,
  'prepago-1gb': PLANOS['prepago-1gb'].preco,
  'prepago-10gb': 41.99,
  'prepago-30gb': 81.99,
  'black-1gb': 15.99,
  'black-5gb': 31.99,
  'black-10gb': 41.99,
  'black-50gb': 129.99,
  'controle-15gb': 55.99,
  'controle-30gb': PLANOS['controle-30gb'].preco,
  'controle-80gb': 194.99,
  'familia-15gb': 49.99,
  'familia-40gb': 79.99,
  'familia-100gb': PLANOS['familia-100gb'].preco,
  'familia-230gb': 429.99,
  'empresas-3gb': 19.99,
  'empresas-5gb': 35.99,
  'empresas-15gb': 59.99,
  'empresas-50gb': 129.99,
  'empresas-160gb': 390.99,
};

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
