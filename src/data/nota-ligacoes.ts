/**
 * Rodapé do "Ligações ilimitadas*" (decisão do Fabricio, 26/11; texto do ajuste 3): o ilimitado é para uso pessoal; o
 * teto de minutos do givm é limite técnico contra chipeira: 2.000 min/mês em todo plano com voz, 3.000 no I9C-17 (20 GB). Vai em toda página com card de plano (pt/en/es) pelo marcador
 * {{nota-ligacoes:<idioma>}} (ver aplicarPlanos em planos.ts) e na 404/manutenção (PaginaErro.astro).
 *
 * Texto pt = o do Fabricio, sem mudar nada. en/es = tradução fiel, [revisão por falante nativo].
 * Não acrescentar cláusula: o texto jurídico passa pela Laura.
 *
 * [pendência: Fabricio/Laura] "Política de Uso" ainda não tem página no site: fica sem link (POLITICA_DE_USO = null)
 * até existir. "Termos de Uso" liga para a página que já existe (hoje fala do uso do site, não da linha).
 */
import { ROTAS, type Idioma } from '../i18n/rotas.ts'; // com extensão: os testes (node --test) importam este arquivo

/** Página da Política de Uso por idioma; null = ainda não existe (vira texto sem link). */
export const POLITICA_DE_USO: Record<Idioma, string> | null = null;

const TEXTO: Record<Idioma, { antes: string; politica: string; meio: string; termos: string; depois: string }> = {
  'pt-br': {
    antes: '*Ligações ilimitadas para qualquer operadora do Brasil, para uso pessoal, conforme a ',
    politica: 'Política de Uso',
    meio: '. Para proteger a rede contra uso irregular, como equipamentos que fazem ligações em massa com chips de celular (chipeiras), existe um limite técnico de 2.000 minutos por mês (3.000 no plano de 20 GB). O uso fora do perfil pessoal descumpre os ',
    termos: 'Termos de Uso',
    depois: '.',
  },
  en: {
    antes: '*Unlimited calls to any carrier in Brazil, for personal use, in accordance with the ',
    politica: 'Usage Policy',
    meio: '. To protect the network against irregular use, such as equipment that makes mass calls with mobile SIM cards (SIM boxes), there is a technical limit of 2,000 minutes per month (3,000 on the 20 GB plan). Use outside a personal profile breaches the ',
    termos: 'Terms of Use',
    depois: '.',
  },
  es: {
    antes: '*Llamadas ilimitadas a cualquier operadora de Brasil, para uso personal, conforme a la ',
    politica: 'Política de Uso',
    meio: '. Para proteger la red contra el uso irregular, como equipos que hacen llamadas masivas con chips de celular (SIM boxes), existe un límite técnico de 2.000 minutos por mes (3.000 en el plan de 20 GB). El uso fuera del perfil personal incumple los ',
    termos: 'Términos de Uso',
    depois: '.',
  },
};

const link = (href: string, texto: string) => `<a class="underline underline-offset-2 hover:text-laranja" href="${href}">${texto}</a>`;

/** Só o texto (sem HTML), para testes e para conferir a tradução. */
export const notaLigacoesTexto = (idioma: Idioma) => {
  const t = TEXTO[idioma];
  return `${t.antes}${t.politica}${t.meio}${t.termos}${t.depois}`;
};

/** Miolo HTML do rodapé (sem o <p>): "Política de Uso" com link só se a página existir; "Termos de Uso" sempre. */
export function notaLigacoesHtml(idioma: Idioma): string {
  const t = TEXTO[idioma];
  const politica = POLITICA_DE_USO ? link(POLITICA_DE_USO[idioma], t.politica) : t.politica;
  return `${t.antes}${politica}${t.meio}${link(ROTAS['termos-de-uso'][idioma], t.termos)}${t.depois}`;
}
