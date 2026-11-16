/**
 * /blog/rss.xml — RSS 2.0 do blog (posts e artigos que já eram páginas), mais recente primeiro.
 * Sem dependência nova: XML montado aqui e conferido em scripts/blog.test.mjs.
 */
import type { APIRoute } from 'astro';
import { BLOG, SITE, postsPublicados, urlDo, CATEGORIAS } from '../../data/blog';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export const GET: APIRoute = async () => {
  const posts = await postsPublicados();
  const ultima = posts.reduce((m, p) => Math.max(m, (p.data.atualizado ?? p.data.publicado).getTime()), 0);
  const itens = posts
    .map(
      (p) => `    <item>
      <title>${esc(p.data.titulo)}</title>
      <link>${esc(urlDo(p))}</link>
      <guid isPermaLink="true">${esc(urlDo(p))}</guid>
      <description>${esc(p.data.resumo)}</description>
      <category>${esc(CATEGORIAS[p.data.categoria])}</category>
      <dc:creator>${esc(p.data.autor)}</dc:creator>
      <pubDate>${p.data.publicado.toUTCString()}</pubDate>
    </item>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Blog i9c</title>
    <link>${SITE}${BLOG}</link>
    <atom:link href="${SITE}${BLOG}rss.xml" rel="self" type="application/rss+xml" />
    <description>Guias da i9c sobre planos de celular, recarga, portabilidade, cobertura e linhas para empresas.</description>
    <language>pt-BR</language>
    <lastBuildDate>${new Date(ultima).toUTCString()}</lastBuildDate>
${itens}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
