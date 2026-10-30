/**
 * Conteúdo da 404 e da manutenção (src/components/PaginaErro.astro).
 * Preço e link de contratar vêm de PLANOS (src/data/planos.ts), os mesmos das páginas de plano.
 *
 * [decisão do Fabricio] confirmar os 3 planos mais vendidos. Para trocar, mude os ids abaixo
 * (o plano precisa existir em PLANOS).
 */
import { PLANOS, type PlanoId } from './planos';

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
export function contratarHref(id: PlanoId, medium = '404') {
  const [base, hash = ''] = PLANOS[id].contratar.split('#');
  const utm = `utm_source=site&utm_medium=${medium}&utm_campaign=${id}`;
  return `${base}${base.includes('?') ? '&' : '?'}${utm}${hash ? `#${hash}` : ''}`;
}
