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
 *   {{nota-ligacoes:<idioma>}} → rodapé do "Ligações ilimitadas*" (pt-br, en ou es; texto em nota-ligacoes.ts)
 *   {{menor:<família>:<campo>}} → menor preço da família (prepago, black, controle, familia, empresas ou todos),
 *                                 mesmos campos do {{plano:...}}: o "a partir de" dos textos
 * e a página troca os marcadores com aplicarPlanos(). Marcador desconhecido quebra o build.
 * O <id> é qualquer plano de CONTRATAR; o preço sai de PRECO_CONTRATAR (que lê GIVM_I9C nos planos do givm).
 */
import { EMPRESA } from './empresa.ts'; // com extensão: os testes (node --test) importam este arquivo direto
import { notaLigacoesHtml } from './nota-ligacoes.ts';
import { ROTAS, type Idioma } from '../i18n/rotas.ts';
import { CATALOGO, idDoCard, precoCatalogo } from './catalogo-givm.ts';

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
  // Black e Flex do catálogo do givm (catalogo-givm.ts): um id por plano da rota pública. Plano novo na rota sem id
  // aqui quebra o build (ver CARDS_CATALOGO).
  'black-3gb': 'Black 03GB · 30 dias',
  'black-5gb': 'Black Individual 5GB · 30 dias',
  'black-6gb': 'Black 06GB · 30 dias',
  'black-10gb': 'Black Individual 10GB · 30 dias',
  'black-12gb': 'Black 12GB · 30 dias',
  'black-15gb': 'Black 15GB · 30 dias',
  'black-20gb': 'Black 20GB · 30 dias',
  'black-24gb': 'Black 24GB · 30 dias',
  'black-30gb': 'Black 30GB · 30 dias',
  'black-40gb': 'Black 40GB · 30 dias',
  'black-50gb': 'Black Individual 50GB · 30 dias',
  'black-60gb': 'Black 60GB · 30 dias',
  'flex-10gb': 'Flex 10GB · 30 dias',
  'flex-20gb': 'Flex 20GB · 30 dias',
  'flex-50gb': 'Flex 50GB · 30 dias',
  'flex-100gb': 'Flex 100GB · 30 dias',
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
  'black-3gb': null,
  'black-5gb': null,
  'black-6gb': null,
  'black-10gb': null,
  'black-12gb': null,
  'black-15gb': null,
  'black-20gb': null,
  'black-24gb': null,
  'black-30gb': null,
  'black-40gb': null,
  'black-50gb': null,
  'black-60gb': null,
  'flex-10gb': null,
  'flex-20gb': null,
  'flex-50gb': null,
  'flex-100gb': null,
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

/** Plano do catálogo do givm (marca i9c) equivalente a um card do site. */
export interface PlanoGivm {
  /** código no givm (I9C-<n>) */
  codigo: string;
  /** mensal, reais */
  preco: number;
  /** franquia de dados em GB (0,5 = WhatsApp) */
  gb: number;
  /**
   * minutos de ligação no givm (limite técnico contra chipeira); null = plano só de dados/WhatsApp. O CARD não mostra
   * este número: decisão do Fabricio (26/11, ajuste 2) = "Ligações ilimitadas*" + rodapé (nota-ligacoes.ts), que cita
   * o teto (ajuste 3): 2.000 em todo plano com voz, 3.000 só no I9C-17 (20 GB, sem card no site).
   */
  min: number | null;
  sms: number | null;
}

/**
 * Planos do site com equivalente no catálogo do givm (marca i9c): preço e franquia do givm em 26/11/2026,
 * revisados pelo Fabricio (média do mercado). Os outros 9 planos do site (Black 1GB, Pré 1GB, Pré 10GB semanal,
 * Controle 80GB, os 4 Família e Empresas 160GB) NÃO existem no givm e seguem com o preço antigo até o Fabricio
 * decidir (criar no givm ou tirar do site).
 *
 * Mesmo código em dois cards (I9C-7, I9C-10, I9C-12, I9C-19) = mesmo plano do givm vendido em duas famílias do site.
 * Isto é só o preço; o de-para do formulário (CODIGO_GIVM) é outra coisa e não aceita código repetido.
 */
// Preço: sai do catálogo do givm (rota pública, catalogo-givm-i9c.json) pelo nome do plano no givm. Minutos e SMS:
// a rota não devolve; são os da tabela do givm de 26/11 (#58). Plano do givm sem SMS na tabela = card sem linha de SMS.
const givm = (codigo: string, nomeGivm: string, gb: number, min: number | null, sms: number | null) =>
  ({ codigo, nomeGivm, preco: precoCatalogo(nomeGivm), gb, min, sms });

export const GIVM_I9C = {
  'prepago-whatsapp': givm('I9C-5', '+Black WhatsAPP', 0.5, null, null),
  'prepago-30gb': givm('I9C-19', '+Black 30GB', 30, 2000, 200),
  'black-5gb': givm('I9C-7', '+Black 05GB', 5, 2000, 100),
  'black-10gb': givm('I9C-2', '+Black 10GB', 10, 2000, 100),
  'black-50gb': givm('I9C-12', '+Black 50GB', 50, 2000, 1000),
  'controle-15gb': givm('I9C-10', '+Black 15GB', 15, 2000, 100),
  'controle-30gb': givm('I9C-19', '+Black 30GB', 30, 2000, 200),
  'empresas-3gb': givm('I9C-6', '+Black 03GB', 3, 2000, 100),
  'empresas-5gb': givm('I9C-7', '+Black 05GB', 5, 2000, 100),
  'empresas-15gb': givm('I9C-10', '+Black 15GB', 15, 2000, 100),
  'empresas-50gb': givm('I9C-12', '+Black 50GB', 50, 2000, 1000),
} satisfies Partial<Record<ContratarId, PlanoGivm & { nomeGivm: string }>>;

/** SMS do givm por plano (tabela de 26/11, #58): a rota pública não traz SMS. Fora daqui = card sem linha de SMS. */
export const SMS_GIVM: Record<string, number> = Object.fromEntries(
  Object.values(GIVM_I9C).filter((g) => g.sms != null).map((g) => [g.nomeGivm, g.sms as number]),
);

/** Cards Black e Flex da página Black: um por plano do catálogo (menos o WhatsApp, que é o card do pré-pago). */
export const CARDS_CATALOGO = CATALOGO.filter((p) => p.familia !== 'whatsapp')
  .sort((a, b) => (a.familia === b.familia ? (a.gb ?? 0) - (b.gb ?? 0) : a.familia === 'black' ? -1 : 1))
  .map((p) => {
    const id = idDoCard(p);
    if (!(id in CONTRATAR)) throw new Error(`Plano "${p.nomeGivm}" do givm sem id em CONTRATAR (${id}): adicionar em src/data/planos.ts`);
    return { ...p, id: id as ContratarId, sms: SMS_GIVM[p.nomeGivm] ?? null };
  });

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
    preco: GIVM_I9C['controle-30gb'].preco,
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
 * Preço de cada plano com botão "Contratar" (reais): fonte dos marcadores {{plano:<id>:...}} e do value do
 * begin_checkout. Os 11 planos com equivalente no givm vêm de GIVM_I9C (26/11/2026); os outros 9 seguem
 * com o preço conferido no site em 03/11/2026 [decisão do Fabricio: criar no givm ou tirar do site].
 * O test:contratar falha se o card mostrar valor diferente deste.
 */
export const PRECO_CONTRATAR: Record<ContratarId, number> = {
  'prepago-whatsapp': GIVM_I9C['prepago-whatsapp'].preco,
  'prepago-1gb': PLANOS['prepago-1gb'].preco, // sem equivalente no givm
  'prepago-10gb': 41.99, // sem equivalente no givm
  'prepago-30gb': GIVM_I9C['prepago-30gb'].preco,
  'black-1gb': 15.99, // sem equivalente no givm
  ...(Object.fromEntries(CARDS_CATALOGO.map((c) => [c.id, c.preco])) as Record<string, number>),
  'black-5gb': GIVM_I9C['black-5gb'].preco,
  'black-10gb': GIVM_I9C['black-10gb'].preco,
  'black-50gb': GIVM_I9C['black-50gb'].preco,
  'controle-15gb': GIVM_I9C['controle-15gb'].preco,
  'controle-30gb': PLANOS['controle-30gb'].preco,
  'controle-80gb': 194.99, // sem equivalente no givm
  'familia-15gb': 49.99, // sem equivalente no givm
  'familia-40gb': 79.99, // sem equivalente no givm
  'familia-100gb': PLANOS['familia-100gb'].preco, // sem equivalente no givm
  'familia-230gb': 429.99, // sem equivalente no givm
  'empresas-3gb': GIVM_I9C['empresas-3gb'].preco,
  'empresas-5gb': GIVM_I9C['empresas-5gb'].preco,
  'empresas-15gb': GIVM_I9C['empresas-15gb'].preco,
  'empresas-50gb': GIVM_I9C['empresas-50gb'].preco,
  'empresas-160gb': 390.99, // sem equivalente no givm
};

export const formatarPreco = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

export type Familia = 'prepago' | 'black' | 'flex' | 'controle' | 'familia' | 'empresas' | 'todos';

/** Menor preço da família no site (o "a partir de" de títulos, descrições e textos). */
export function menorPreco(familia: Familia): number {
  const ids = (Object.keys(PRECO_CONTRATAR) as ContratarId[]).filter((id) => familia === 'todos' || id.startsWith(`${familia}-`));
  if (!ids.length) throw new Error(`Família desconhecida: ${familia}`);
  return Math.min(...ids.map((id) => PRECO_CONTRATAR[id]));
}

// ---------- Cards e JSON-LD gerados do catálogo do givm (página Black, pt/en/es) ----------
const TXT = {
  'pt-br': {
    dias: '30 dias', rotulo: 'a partir de', mes: '/mês', voz: 'Ligações ilimitadas*', sms: (n: number) => `${n.toLocaleString('pt-BR')} SMS`,
    apps: 'WhatsApp, IG e FB grátis', roaming: 'Roaming nacional', g5: 'Tecnologia 5G', dados: 'Plano só de dados',
    destaque: 'Mais escolhido', botao: 'Contratar', msg: (id: ContratarId) => undefined as string | undefined,
  },
  en: {
    dias: '30 days', rotulo: 'from', mes: '/month', voz: 'Unlimited calls*', sms: (n: number) => `${n.toLocaleString('en-US')} texts`,
    apps: 'Free WhatsApp, IG and FB', roaming: 'Roaming within Brazil', g5: '5G technology', dados: 'Data-only plan',
    destaque: 'Most popular', botao: 'Sign up',
    msg: (id: ContratarId) => `Hi! I'd like to sign up for the i9c ${CONTRATAR[id].replace(' · 30 dias', '')} · 30 days plan.`,
  },
  es: {
    dias: '30 días', rotulo: 'desde', mes: '/mes', voz: 'Llamadas ilimitadas*', sms: (n: number) => `${n.toLocaleString('pt-BR')} SMS`,
    apps: 'WhatsApp, IG y FB gratis', roaming: 'Roaming nacional', g5: 'Tecnología 5G', dados: 'Plan solo de datos',
    destaque: 'Más elegido', botao: 'Contratar',
    msg: (id: ContratarId) => `¡Hola! Quiero contratar el plan ${CONTRATAR[id].replace(' · 30 dias', '')} · 30 días de i9c.`,
  },
} as const;

type IdiomaCards = keyof typeof TXT;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** Card no mesmo HTML dos cards digitados (planos-black.body.html). Black 10GB = destaque "Mais escolhido". */
function cardHtml(c: (typeof CARDS_CATALOGO)[number], idioma: IdiomaCards): string {
  const t = TXT[idioma];
  const d = c.id === 'black-10gb';
  const li = (s: string) => `<li class="flex gap-2"><span class="text-laranja font-bold">→</span> ${s}</li>`;
  // Flex = só dados: nenhum texto de ligação (Fabricio 26/11). SMS só quando o givm informa a quantidade.
  const itens = c.voz
    ? [t.voz, ...(c.sms != null ? [t.sms(c.sms)] : []), t.apps, t.roaming, t.g5]
    : [t.dados, t.g5];
  const href = esc(contratarUrl(c.id, t.msg(c.id)));
  const consultor = idioma === 'pt-br'
    ? `\n<a class="mt-3 text-center text-sm font-semibold underline underline-offset-4 opacity-80 hover:opacity-100" data-lead="consultor" data-plano="${c.id}" href="${esc(consultorUrl(c.id))}" rel="noopener" target="_blank">Falar com um consultor</a>`
    : '';
  const preco = formatarPreco(c.preco).replace(' ', ' '); // mesmo espaço do {{plano:<id>:preco-card}}
  return d
    ? `<article class="plan-card relative bg-i9c-azul text-white rounded-3xl p-7 flex flex-col" data-givm="${esc(c.nomeGivm)}">
<div class="absolute -top-3 left-7 bg-laranja-dark text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider font-mono">${t.destaque}</div>
<div class="flex items-baseline justify-between">
<span class="font-display font-bold text-5xl tracking-tightest num">${c.gb}<span class="text-2xl opacity-70">GB</span></span>
<span class="text-xs opacity-70 font-mono uppercase tracking-wider">${t.dias}</span>
</div>
<div class="mt-6 pb-6 border-b border-white/20">
<div class="text-xs opacity-70 font-semibold font-mono uppercase tracking-wider">${t.rotulo}</div>
<div class="font-display font-bold text-3xl tracking-tightest num">${preco}<span class="text-base opacity-70 font-medium">${t.mes}</span></div>
</div>
<ul class="mt-5 space-y-2.5 text-sm opacity-95 flex-1">
${itens.map(li).join('\n')}
</ul>
<a class="mt-6 inline-flex items-center justify-center gap-1.5 bg-laranja-dark text-white font-semibold py-3 rounded-full hover:bg-i9c-azulDark transition-colors" data-lead="contratar" data-plano="${c.id}" href="${href}" rel="noopener" target="_blank">${t.botao}</a>${consultor}
</article>`
    : `<article class="plan-card bg-white border-2 border-cinza-200 rounded-3xl p-7 flex flex-col" data-givm="${esc(c.nomeGivm)}">
<div class="flex items-baseline justify-between">
<span class="font-display font-bold text-5xl tracking-tightest num text-ivm-azul">${c.gb}<span class="text-2xl text-cinza">GB</span></span>
<span class="text-xs text-cinza font-mono uppercase tracking-wider">${t.dias}</span>
</div>
<div class="mt-6 pb-6 border-b border-cinza-200">
<div class="text-xs text-cinza font-semibold font-mono uppercase tracking-wider">${t.rotulo}</div>
<div class="font-display font-bold text-3xl tracking-tightest num text-ivm-azul">${preco}<span class="text-base text-cinza font-medium">${t.mes}</span></div>
</div>
<ul class="mt-5 space-y-2.5 text-sm text-cinza flex-1">
${itens.map(li).join('\n')}
</ul>
<a class="mt-6 inline-flex items-center justify-center gap-1.5 bg-ivm-azul text-white font-semibold py-3 rounded-full hover:bg-i9c-azul transition-colors" data-lead="contratar" data-plano="${c.id}" href="${href}" rel="noopener" target="_blank">${t.botao}</a>${consultor}
</article>`;
}

/** {{cards:<black|flex>:<idioma>}} → os cards da família no catálogo do givm. */
export function cardsCatalogo(familia: 'black' | 'flex', idioma: IdiomaCards): string {
  return CARDS_CATALOGO.filter((c) => c.familia === familia).map((c) => cardHtml(c, idioma)).join('\n');
}

/**
 * {{ofertas:black:<idioma>}} → AggregateOffer da página Black, na ordem dos cards: Black 1GB (fora do givm),
 * os Black do catálogo e os Flex.
 */
export function ofertasPaginaBlack(idioma: IdiomaCards): string {
  const t = TXT[idioma];
  const url = `https://i9c.net.br${ROTAS['planos-black'][idioma as Idioma]}`;
  const lista = [
    { name: `1GB · ${t.dias}`, price: PRECO_CONTRATAR['black-1gb'] },
    ...CARDS_CATALOGO.map((c) => ({ name: `${c.familia === 'flex' ? 'Flex ' : ''}${c.gb}GB · ${t.dias}`, price: c.preco })),
  ];
  const precos = lista.map((o) => o.price);
  return JSON.stringify({
    '@type': 'AggregateOffer',
    priceCurrency: 'BRL',
    lowPrice: Math.min(...precos).toFixed(2),
    highPrice: Math.max(...precos).toFixed(2),
    offerCount: lista.length,
    offers: lista.map((o) => ({
      '@type': 'Offer', name: o.name, price: o.price.toFixed(2), priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock', url,
    })),
  }, null, 2);
}

export function aplicarPlanos(html: string): string {
  return html
    .replace(/\{\{cards:(black|flex):([a-z-]+)\}\}/g, (marcador, familia: 'black' | 'flex', idioma: string) => {
      if (!(idioma in TXT)) throw new Error(`Idioma desconhecido no marcador ${marcador}`);
      return cardsCatalogo(familia, idioma as IdiomaCards);
    })
    .replace(/\{\{ofertas:black:([a-z-]+)\}\}/g, (marcador, idioma: string) => {
      if (!(idioma in TXT)) throw new Error(`Idioma desconhecido no marcador ${marcador}`);
      return ofertasPaginaBlack(idioma as IdiomaCards);
    })
    .replace(/\{\{nota-ligacoes:([a-z-]+)\}\}/g, (marcador, idioma: string) => {
      if (!(idioma in ROTAS['termos-de-uso'])) throw new Error(`Idioma desconhecido no marcador ${marcador}`);
      return notaLigacoesHtml(idioma as Idioma);
    })
    .replace(/\{\{contratar:([a-z0-9-]+)\}\}/g, (_, id: string) => contratarUrl(id))
    .replace(/\{\{consultor:([a-z0-9-]+)\}\}/g, (_, id: string) => consultorUrl(id))
    .replace(/\{\{(plano|menor):([a-z0-9-]+):([a-z-]+)\}\}/g, (marcador, tipo: string, id: string, campo: string) => {
    if (tipo === 'plano' && !(id in PRECO_CONTRATAR)) throw new Error(`Plano desconhecido no marcador ${marcador}`);
    const p = { preco: tipo === 'menor' ? menorPreco(id as Familia) : PRECO_CONTRATAR[id as ContratarId] };
    switch (campo) {
      case 'preco': return formatarPreco(p.preco);
      case 'preco-card': return formatarPreco(p.preco).replace(' ', ' ');
      case 'preco-nbsp': return formatarPreco(p.preco).replace(' ', '&nbsp;');
      case 'valor': return p.preco.toFixed(2);
      default: throw new Error(`Campo desconhecido no marcador ${marcador}`);
    }
  });
}
