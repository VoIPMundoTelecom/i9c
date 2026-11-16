/**
 * /blog/og/<slug>.png — imagem de compartilhamento (1200×630) de cada entrada do blog e do índice (/blog/og/blog.png).
 * Gerada no build com sharp: fundo branco, faixa i9c, categoria, título e o logo oficial da i9c
 * (public/i9c-logo.png, o mesmo do topo do site; nenhum logo é desenhado aqui).
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { CATEGORIAS, postsPublicados } from '../../../data/blog';

const LOGO = fileURLToPath(new URL('../../../../public/i9c-logo.png', import.meta.url));

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await postsPublicados();
  return [
    { params: { slug: 'blog' }, props: { titulo: 'Blog da i9c', rotulo: 'Planos · Recarga · Portabilidade · Cobertura · Empresas' } },
    ...posts.map((p) => ({ params: { slug: p.id }, props: { titulo: p.data.titulo, rotulo: `Blog i9c · ${CATEGORIAS[p.data.categoria]}` } })),
  ];
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** quebra o título em linhas de até `max` caracteres (no máximo 4; a última ganha reticências) */
function linhas(texto: string, max: number, limite = 4): string[] {
  const out: string[] = [];
  let atual = '';
  for (const palavra of texto.split(/\s+/)) {
    if ((atual + ' ' + palavra).trim().length > max && atual) {
      out.push(atual);
      atual = palavra;
    } else atual = (atual + ' ' + palavra).trim();
  }
  if (atual) out.push(atual);
  if (out.length > limite) {
    out.length = limite;
    out[limite - 1] = out[limite - 1].replace(/\s*\S*$/, '') + '…';
  }
  return out;
}

export const GET: APIRoute = async ({ props }) => {
  const { titulo, rotulo } = props as { titulo: string; rotulo: string };
  // ~0,63 em por caractere na fonte do sistema (bold): 26 caracteres a 56px cabem nos 1040px úteis
  const tl = linhas(titulo, 26);
  const tam = tl.length > 3 ? 52 : 56;
  const y0 = 240;
  const texto = tl
    .map((l, i) => `<text x="80" y="${y0 + i * (tam + 14)}" font-size="${tam}" font-weight="700" fill="#1E2C5C">${esc(l)}</text>`)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <rect width="1200" height="630" fill="#FFFFFF"/>
    <rect width="1200" height="14" fill="#136BA2"/>
    <rect x="80" y="150" width="64" height="6" rx="3" fill="#E8672A"/>
    <g font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif">
      <text x="80" y="130" font-size="26" font-weight="700" fill="#E8672A" letter-spacing="2">${esc(rotulo.toUpperCase())}</text>
      ${texto}
      <text x="80" y="580" font-size="26" fill="#716F6E">i9c.net.br/blog</text>
    </g>
  </svg>`;
  const logo = await sharp(LOGO).resize({ height: 84 }).png().toBuffer();
  const { width = 168 } = await sharp(logo).metadata();
  const png = await sharp(Buffer.from(svg))
    .composite([{ input: logo, left: 1200 - 80 - width, top: 520 }])
    .png({ compressionLevel: 9 })
    .toBuffer();
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
