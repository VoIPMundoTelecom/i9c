/**
 * Marcadores dos partials traduzidos (src/partials/en/*, src/partials/es/*):
 *   {{plano:<id>:<campo>}}  → mesmo valor do pt (src/data/planos.ts, ver aplicarPlanos)
 *   {{whats:<mensagem>}}    → https://wa.me/558008000900?text=<mensagem codificada>
 *
 * O botão "Contratar" das páginas en/es segue o mesmo destino do pt hoje (WhatsApp), só com a
 * mensagem traduzida. Quando o fluxo de contratação (CONTRATAR_URL em src/data/planos.ts)
 * entrar, trocar o {{whats:...}} dos botões "Contratar" pelo mesmo helper do pt.
 */
import { aplicarPlanos } from '../data/planos';
import { EMPRESA } from '../data/empresa';

export const whatsComMensagem = (mensagem: string) =>
  `${EMPRESA.whatsapp}?text=${encodeURIComponent(mensagem)}`;

export function aplicarI18n(html: string): string {
  return aplicarPlanos(html).replace(/\{\{whats:([^}]+)\}\}/g, (_m, msg: string) =>
    // o partial é HTML: a mensagem pode vir com entidades (&amp;, &#39;)
    whatsComMensagem(msg.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim()),
  );
}
