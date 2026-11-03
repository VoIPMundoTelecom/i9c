// Confere o de-para CODIGO_GIVM (src/data/planos.ts) contra o catálogo i9c publicado pelo givm.
// Uso: npm run check:de-para -- <arquivo.json | URL>
//      (padrão: https://api.givm.com.br/api/public/i9c/planos, a rota proposta no givm_Frontend#216)
// Aceita uma lista de planos ({codigo, nome, valorMensalCentavos, ...}) ou {items: [...]}.
// Falha se: algum plano do site estiver sem código, o código não existir no catálogo, o preço do
// catálogo for diferente do preço do site, ou dois ids do site apontarem para o mesmo código.
import { readFileSync } from 'node:fs';
import { CONTRATAR, CODIGO_GIVM, PRECO_CONTRATAR } from '../src/data/planos.ts';

const ORIGEM = process.argv[2] || 'https://api.givm.com.br/api/public/i9c/planos';

async function carregar(origem) {
  if (/^https?:\/\//.test(origem)) {
    const r = await fetch(origem, { headers: { accept: 'application/json' } });
    if (!r.ok) throw new Error(`${origem}: HTTP ${r.status}`);
    return r.json();
  }
  return JSON.parse(readFileSync(origem, 'utf8'));
}

const bruto = await carregar(ORIGEM);
const catalogo = Array.isArray(bruto) ? bruto : bruto.items ?? [];
const porCodigo = new Map(catalogo.filter((p) => p.codigo).map((p) => [p.codigo, p]));
const erros = [];
const usados = new Map();

console.log(`Catálogo: ${ORIGEM} (${catalogo.length} planos, ${porCodigo.size} com código)\n`);
console.log('id do site'.padEnd(18), 'código'.padEnd(10), 'site'.padStart(9), 'givm'.padStart(9), ' nome no givm');
for (const id of Object.keys(CONTRATAR)) {
  const codigo = CODIGO_GIVM[id];
  const site = PRECO_CONTRATAR[id];
  const p = codigo ? porCodigo.get(codigo) : undefined;
  const givm = p?.valorMensalCentavos != null ? p.valorMensalCentavos / 100 : undefined;
  console.log(id.padEnd(18), String(codigo ?? '—').padEnd(10), site.toFixed(2).padStart(9),
    (givm != null ? givm.toFixed(2) : '—').padStart(9), '', p?.nome ?? '');
  if (!codigo) { erros.push(`${id}: sem código em CODIGO_GIVM`); continue; }
  if (usados.has(codigo)) erros.push(`${id}: código ${codigo} já usado por ${usados.get(codigo)}`);
  usados.set(codigo, id);
  if (!p) { erros.push(`${id}: ${codigo} não está no catálogo`); continue; }
  if (p.ativo === false) erros.push(`${id}: ${codigo} inativo no givm`);
  if (givm != null && Math.round(givm * 100) !== Math.round(site * 100)) {
    erros.push(`${id}: preço do site R$ ${site.toFixed(2)} ≠ givm R$ ${givm.toFixed(2)} (${codigo})`);
  }
}
const sobrando = [...porCodigo.keys()].filter((c) => !usados.has(c));
if (sobrando.length) console.log(`\nNo catálogo e sem botão no site: ${sobrando.join(', ')}`);

if (erros.length) {
  console.error(`\n${erros.length} problema(s):\n- ${erros.join('\n- ')}`);
  process.exit(1);
}
console.log('\nDe-para OK.');
