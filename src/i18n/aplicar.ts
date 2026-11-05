/**
 * Marcadores dos partials traduzidos (src/partials/en/*, src/partials/es/*):
 *   {{plano:<id>:<campo>}}  → mesmo valor do pt (src/data/planos.ts, ver aplicarPlanos)
 *   {{whats:<mensagem>}}    → https://wa.me/558008000900?text=<mensagem codificada> (links que não são de contratar)
 *   {{contratar:<id>|<mensagem>}} → contratarUrl(id, mensagem): mesmo destino do pt (CONTRATAR_URL em
 *       src/data/planos.ts); a mensagem traduzida só vale enquanto o destino for o WhatsApp.
 */
import { aplicarPlanos, contratarUrl } from '../data/planos';
import { EMPRESA } from '../data/empresa';

export const whatsComMensagem = (mensagem: string) =>
  `${EMPRESA.whatsapp}?text=${encodeURIComponent(mensagem)}`;

const desescapar = (msg: string) => msg.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();

export function aplicarI18n(html: string): string {
  // o partial é HTML: a mensagem pode vir com entidades (&amp;, &#39;)
  html = html.replace(/\{\{contratar:([a-z0-9-]+)\|([^}]+)\}\}/g, (_m, id: string, msg: string) => contratarUrl(id, desescapar(msg)));
  return aplicarPlanos(html).replace(/\{\{whats:([^}]+)\}\}/g, (_m, msg: string) =>
    whatsComMensagem(desescapar(msg)),
  );
}
