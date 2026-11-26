/**
 * Catálogo i9c do givm: os planos que o site mostra (Fabricio 26/11: "o site mostra exatamente os planos que a rota
 * pública devolver, com o preço e a franquia dela"). Snapshot em catalogo-givm-i9c.json, gravado por
 * `npm run sync:catalogo` (scripts/catalogo-givm.mjs); `npm run sync:catalogo -- --check` diz se a rota mudou.
 *
 * Nomes como no givm (Fabricio 26/11): "Black" = voz e dados, "Flex" = só dados. Não renomear. O site só tira o "+"
 * do começo do nome do givm (prefixo de ordenação) e o zero à esquerda da franquia no número grande do card.
 * Nome fora do padrão "+Black <n>GB" / "+Flex <n>GB" / "+Black WhatsApp" quebra o build: plano novo pede olho humano.
 */
import bruto from './catalogo-givm-i9c.json' with { type: 'json' };

/** Planos que NUNCA aparecem no site, mesmo que a rota devolva (Fabricio 26/11). A rota de 26/11 não traz `codigo`. */
export const FORA_DO_SITE = ['LEG-629', 'I9C-8', 'I9C-20'];

export type FamiliaCatalogo = 'black' | 'flex' | 'whatsapp';

export interface PlanoCatalogo {
  /** nome no givm, como veio */
  nomeGivm: string;
  /** nome no givm sem o "+" do começo */
  nome: string;
  familia: FamiliaCatalogo;
  /** franquia em GB lida do nome; null no WhatsApp (0,5 GB, só mensagens de texto) */
  gb: number | null;
  /** mensal, reais */
  preco: number;
  /** Black = voz e dados; Flex e WhatsApp = sem ligação */
  voz: boolean;
}

export const CATALOGO_ORIGEM: string = bruto.origem;
export const CATALOGO_DATA: string = bruto.consultadoEm;

function ler(p: { nome: string; valorMensalCentavos: number; codigo?: string }): PlanoCatalogo {
  const nomeGivm = p.nome;
  const nome = nomeGivm.replace(/^\+\s*/, '').trim();
  const preco = p.valorMensalCentavos / 100;
  if (/^Black WhatsApp$/i.test(nome)) return { nomeGivm, nome, familia: 'whatsapp', gb: null, preco, voz: false };
  const m = nome.match(/^(Black|Flex) (\d+)GB$/);
  if (!m) throw new Error(`Catálogo do givm: nome fora do padrão "${nomeGivm}" — conferir antes de mostrar no site`);
  const familia = m[1] === 'Black' ? 'black' : 'flex';
  return { nomeGivm, nome, familia, gb: Number(m[2]), preco, voz: familia === 'black' };
}

export const CATALOGO: PlanoCatalogo[] = bruto.planos
  .filter((p: { nome: string; codigo?: string }) => !FORA_DO_SITE.some((x) => p.codigo === x || p.nome.includes(x)))
  .map(ler);

/** Preço do plano no catálogo pelo nome do givm (ex.: "+Black 05GB"). Sem o plano = erro (quebra o build). */
export function precoCatalogo(nomeGivm: string): number {
  const p = CATALOGO.find((x) => x.nomeGivm === nomeGivm);
  if (!p) throw new Error(`Plano "${nomeGivm}" não veio no catálogo do givm (${CATALOGO_DATA})`);
  return p.preco;
}

/** id do card na página Black (Black e Flex). O WhatsApp é o card "Só WhatsApp" do pré-pago (prepago-whatsapp). */
export const idDoCard = (p: PlanoCatalogo) => (p.familia === 'whatsapp' ? 'prepago-whatsapp' : `${p.familia}-${p.gb}gb`);
