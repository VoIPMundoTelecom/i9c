import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Blog da i9c (padrão do voipmundo-site): src/content/blog/*.md, slug = nome do arquivo.
 *
 * Dois tipos de entrada:
 * - post do blog: tem corpo em Markdown e vira /blog/<slug>.html;
 * - artigo que já existe como página (ex.: /chip-so-whatsapp.html): tem `url` e só frontmatter.
 *   Entra no índice, no RSS e no "Continue navegando" com a URL de sempre (sem 301, sem página nova).
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    titulo: z.string(),
    resumo: z.string(),
    publicado: z.coerce.date(),
    atualizado: z.coerce.date().optional(),
    rascunho: z.boolean().default(false),
    autor: z.string().default('Equipe Grupo IVM'),
    categoria: z.enum(['planos', 'recarga', 'portabilidade', 'cobertura', 'empresas']),
    // artigo que já é página do site: o índice aponta para esta URL e não gera /blog/<slug>.html
    url: z.string().regex(/^\/[^/]/).optional(),
    // <title> próprio (sem ele: "titulo · Blog i9c")
    seoTitulo: z.string().optional(),
    // página-pilar do cluster (ex.: '/planos-empresas.html'): o GuiasBlog dela lista este post
    pilar: z.string().optional(),
    // ids dos 2 posts do "Continue navegando" (sem eles: mesma categoria, depois os mais recentes)
    relacionados: z.array(z.string()).max(2).optional(),
    // página do produto no "Continue navegando" (sem ela vale o pilar)
    produto: z.object({ href: z.string(), titulo: z.string(), texto: z.string() }).optional(),
    // FAQ no fim do post + FAQPage schema
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    // CTA próprio do post; sem ele vale o card padrão (planos + WhatsApp)
    cta: z.object({ titulo: z.string(), texto: z.string(), botao: z.string(), href: z.string() }).optional(),
  }),
});

export const collections = { blog };
