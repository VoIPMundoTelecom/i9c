/**
 * Blog: helpers comuns ao índice (/blog/), ao post (/blog/<slug>.html), ao RSS, à OG image
 * e ao GuiasBlog. Entrada com `url` é artigo que já existe como página: link na URL de sempre.
 */
import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;
export type Categoria = Post['data']['categoria'];

export const CATEGORIAS: Record<Categoria, string> = {
  planos: 'Planos',
  recarga: 'Recarga',
  portabilidade: 'Portabilidade',
  cobertura: 'Cobertura',
  empresas: 'Empresas · Karretel',
};

/** pilar padrão do "Continue navegando" quando o post não tem `produto` */
export const PRODUTO_DA_CATEGORIA: Record<Categoria, { href: string; titulo: string; texto: string }> = {
  planos: { href: '/#planos', titulo: 'Planos i9c', texto: 'Pré-pago, controle, Black e família, sem fidelidade.' },
  recarga: { href: '/recargas.html', titulo: 'Recarga online', texto: 'Recarregue o seu chip i9c pela área do cliente: o crédito entra assim que o pagamento é compensado.' },
  portabilidade: { href: '/portabilidade.html', titulo: 'Portabilidade', texto: 'Traga seu número para a i9c, sem taxa e sem fidelidade.' },
  cobertura: { href: '/mapa-de-cobertura.html', titulo: 'Mapa de cobertura', texto: 'Confira o sinal no seu endereço antes de contratar.' },
  empresas: { href: '/planos-empresas.html', titulo: 'Planos para empresas', texto: 'Linhas corporativas sem fidelidade.' },
};

export const SITE = 'https://i9c.net.br';
export const BLOG = '/blog/';

/** caminho público da entrada: página existente ou /blog/<slug>.html */
export const hrefDo = (p: Post) => p.data.url ?? `/blog/${p.id}.html`;
export const urlDo = (p: Post) => SITE + hrefDo(p);
export const ehPostDoBlog = (p: Post) => !p.data.url;
export const ogDo = (p: Post) => `${SITE}/blog/og/${p.id}.png`;
export const dataDe = (p: Post) => p.data.atualizado ?? p.data.publicado;

export const fmtData = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
export const isoData = (d: Date) => d.toISOString().slice(0, 10);

/** Publicados, mais recente primeiro; data igual desempata pelo id (ordem estável entre builds). */
export async function postsPublicados(): Promise<Post[]> {
  return (await getCollection('blog', (p) => !p.data.rascunho)).sort(
    (a, b) => b.data.publicado.getTime() - a.data.publicado.getTime() || a.id.localeCompare(b.id)
  );
}

/** 2 relacionados: mesma categoria primeiro, depois os mais recentes. */
export function relacionados(post: Post, todos: Post[], n = 2): Post[] {
  const outros = todos.filter((p) => p.id !== post.id);
  const escolhidos = (post.data.relacionados ?? []).map((id) => {
    const p = outros.find((o) => o.id === id);
    if (!p) throw new Error(`${post.id}: relacionado "${id}" não existe no blog`);
    return p;
  });
  if (escolhidos.length >= n) return escolhidos.slice(0, n);
  const mesma = outros.filter((p) => p.data.categoria === post.data.categoria);
  const resto = outros.filter((p) => p.data.categoria !== post.data.categoria);
  return [...escolhidos, ...[...mesma, ...resto].filter((p) => !escolhidos.includes(p))].slice(0, n);
}
