// <lastmod> REAL nos sitemaps de public/ (escritos à mão): a data em que o conteúdo da página mudou,
// nunca a data do build. Sem data conhecida, a URL fica sem <lastmod>.
//
// De onde sai a data de cada URL:
//  1. Página com post no blog (src/content/blog/*.md): `atualizado:` ou, se não houver, `publicado:` (data editorial).
//  2. Demais páginas: data do último commit (`git log -1 --format=%cs`) que mexeu no conteúdo dela:
//     o .astro da página + os partials e os dados (src/data/planos, src/data/empresa) que ela importa.
//     Layout, componentes e i18n ficam de fora (mudam o site todo, não o conteúdo da página).
//     Arquivo com alteração ainda não commitada conta como hoje (é o dia em que o conteúdo mudou).
//  3. /blog/: a data editorial mais recente entre os posts publicados.
// Repositório raso (clone com --depth): não mexe em nada, porque a data do git seria a do último commit.
//
// Uso: node scripts/sitemap-lastmod.mjs          (atualiza public/sitemap*.xml)
//      node scripts/sitemap-lastmod.mjs --check  (só confere; sai com erro se algo mudaria)
// Conferido por scripts/sitemap-lastmod.test.mjs.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = fileURLToPath(new URL('..', import.meta.url));
export const SITE = 'https://i9c.net.br';
export const SITEMAPS = ['public/sitemap.xml', 'public/sitemap-en.xml', 'public/sitemap-es.xml'];
const BLOG = 'src/content/blog';

const git = (...args) => execFileSync('git', ['-C', RAIZ, ...args], { encoding: 'utf8' }).trim();
export const repoRaso = () => git('rev-parse', '--is-shallow-repository') === 'true';
export const hoje = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });

/** Data do último commit do arquivo (YYYY-MM-DD); hoje se tem alteração não commitada; null se nunca foi commitado. */
export function dataGit(arquivo) {
  if (git('status', '--porcelain', '--', arquivo)) return hoje();
  return git('log', '-1', '--format=%cs', '--', arquivo) || null;
}

/** Frontmatter simples (chave: valor) dos posts do blog. */
export function posts() {
  return readdirSync(join(RAIZ, BLOG))
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const fm = readFileSync(join(RAIZ, BLOG, f), 'utf8').match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
      const campo = (k) => fm.match(new RegExp(`^${k}:\\s*['"]?([^'"\\n]+)`, 'm'))?.[1].trim();
      const slug = f.replace(/\.md$/, '');
      return {
        arquivo: `${BLOG}/${f}`,
        url: campo('url') ?? `/blog/${slug}.html`,
        data: campo('atualizado') ?? campo('publicado') ?? null,
        rascunho: campo('rascunho') === 'true',
      };
    });
}

/** URL pública → .astro da página (build.format 'file'). */
export function paginaDa(url) {
  const p = url.replace(SITE, '');
  if (p === '/') return 'src/pages/index.astro';
  if (/^\/(en|es)\/$/.test(p)) return `src/pages${p}index.astro`;
  if (p.endsWith('.html')) return `src/pages${p.replace(/\.html$/, '.astro')}`;
  return null;
}

/** Arquivos de conteúdo de uma página: o .astro + partials e dados que ele importa. */
export function fontesDa(pagina) {
  const texto = readFileSync(join(RAIZ, pagina), 'utf8');
  const fontes = [pagina];
  for (const [, imp] of texto.matchAll(/^import\b[^'"]*['"](\.[^'"?]+)/gm)) {
    const rel = relative(RAIZ, join(RAIZ, dirname(pagina), imp));
    if (/^src\/partials\//.test(rel)) fontes.push(rel);
    else if (/^src\/data\/(planos|empresa)$/.test(rel)) {
      const f = ['.ts', '.mjs', '.js'].map((e) => rel + e).find((c) => existsSync(join(RAIZ, c)));
      if (f) fontes.push(f);
    }
  }
  return fontes;
}

const maior = (datas) => datas.filter(Boolean).sort().at(-1) ?? null;

/**
 * Para cada URL: { lastmod, git } — lastmod é a data que vai no sitemap; git é o teto
 * (último commit das fontes), usado pelo teste para garantir lastmod <= git.
 */
export function datasDa(url) {
  const p = url.replace(SITE, '');
  const todos = posts().filter((x) => !x.rascunho);
  if (p === '/blog/') {
    return { lastmod: maior(todos.map((x) => x.data)), git: maior(todos.map((x) => dataGit(x.arquivo))) };
  }
  const post = todos.find((x) => x.url === p);
  const pagina = paginaDa(url);
  const fontes = [];
  if (pagina && existsSync(join(RAIZ, pagina))) fontes.push(...fontesDa(pagina));
  if (post) fontes.push(post.arquivo);
  const tetoGit = maior(fontes.map(dataGit));
  return { lastmod: post?.data ?? tetoGit, git: tetoGit };
}

export const locsDe = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
export const lastmodsDe = (xml) =>
  [...xml.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?/g)].map((m) => ({ loc: m[1], lastmod: m[2] ?? null }));

/** Reescreve o <lastmod> de cada <url> (insere, troca ou tira). */
export function aplicar(xml) {
  return xml.replace(/<url><loc>([^<]+)<\/loc>(?:<lastmod>[^<]*<\/lastmod>)?/g, (_, loc) => {
    const { lastmod } = datasDa(loc);
    return `<url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}`;
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (repoRaso()) {
    console.error('repositório raso: datas do git não são confiáveis; nada alterado (git fetch --unshallow).');
    process.exit(process.argv.includes('--check') ? 0 : 1);
  }
  const conferir = process.argv.includes('--check');
  let diferentes = 0;
  for (const s of SITEMAPS) {
    const antes = readFileSync(join(RAIZ, s), 'utf8');
    const depois = aplicar(antes);
    const a = lastmodsDe(antes), d = lastmodsDe(depois);
    for (let i = 0; i < d.length; i++) {
      if (a[i].lastmod !== d[i].lastmod) {
        diferentes++;
        console.log(`${s}  ${d[i].loc}  ${a[i].lastmod ?? '-'} -> ${d[i].lastmod ?? '-'}`);
      }
    }
    if (!conferir && antes !== depois) writeFileSync(join(RAIZ, s), depois);
  }
  console.log(diferentes ? `${diferentes} lastmod ${conferir ? 'desatualizado(s)' : 'atualizado(s)'}` : 'lastmod em dia');
  if (conferir && diferentes) process.exit(1);
}
