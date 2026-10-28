/**
 * Planos da i9c lidos por mais de uma página: fonte única de preço e do link "Contratar".
 *
 * Os partials HTML (src/partials/*.html) usam marcadores no lugar do valor digitado:
 *   {{plano:<id>:preco}}       → R$ 15,99        (espaço comum: <option> do formulário)
 *   {{plano:<id>:preco-card}}  → R$ 15,99   (espaço não separável: cards das páginas de plano)
 *   {{plano:<id>:preco-nbsp}}  → R$&nbsp;15,99   (entidade: cards da home)
 *   {{plano:<id>:valor}}       → 15.99   (schema.org Offer.price)
 *   {{plano:<id>:contratar}}   → link do botão "Contratar" da página do plano
 * e a página troca os marcadores com aplicarPlanos(). Marcador desconhecido quebra o build.
 *
 * Por enquanto só os planos usados na 404 estão aqui; os outros seguem escritos no partial.
 */

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
  /** botão "Contratar" da página do plano (WhatsApp provisório até existir o fluxo de contratação) */
  contratar: string;
}

export const PLANOS = {
  'prepago-1gb': {
    nome: 'Pré-pago 1GB',
    pagina: '/planos-pre-pago.html',
    preco: 15.99,
    rotuloPreco: 'a partir de',
    sufixo: '',
    contratar: 'https://wa.me/558008000900?text=Ol%C3%A1%21%20Quero%20contratar%20o%20plano%20Pr%C3%A9-pago%201GB%20%C2%B7%2030%20dias%20da%20i9c.',
  },
  'controle-30gb': {
    nome: 'Controle 30GB',
    pagina: '/planos-controle.html',
    preco: 81.99,
    rotuloPreco: 'a partir de',
    sufixo: '/mês',
    contratar: 'https://wa.me/558008000900?text=Ol%C3%A1%21%20Quero%20contratar%20o%20plano%20Controle%2030GB%20%C2%B7%2030%20dias%20da%20i9c.',
  },
  'familia-100gb': {
    nome: 'Família 100GB',
    pagina: '/planos-familia.html',
    preco: 239.99,
    rotuloPreco: 'a partir de',
    sufixo: '/mês',
    contratar: 'https://wa.me/558008000900?text=Ol%C3%A1%21%20Quero%20contratar%20o%20plano%20Fam%C3%ADlia%20100GB%20%C2%B7%20%2B3%20linhas%20da%20i9c.',
  },
} satisfies Record<string, Plano>;

export type PlanoId = keyof typeof PLANOS;

export const formatarPreco = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

export function aplicarPlanos(html: string): string {
  return html.replace(/\{\{plano:([a-z0-9-]+):([a-z-]+)\}\}/g, (marcador, id: string, campo: string) => {
    const p = (PLANOS as Record<string, Plano>)[id];
    if (!p) throw new Error(`Plano desconhecido no marcador ${marcador}`);
    switch (campo) {
      case 'preco': return formatarPreco(p.preco);
      case 'preco-card': return formatarPreco(p.preco).replace(' ', ' ');
      case 'preco-nbsp': return formatarPreco(p.preco).replace(' ', '&nbsp;');
      case 'valor': return p.preco.toFixed(2);
      case 'contratar': return p.contratar;
      default: throw new Error(`Campo desconhecido no marcador ${marcador}`);
    }
  });
}
