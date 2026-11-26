// Catálogo i9c do givm → src/data/catalogo-givm-i9c.json (a fonte dos planos que o site mostra).
// Uso: npm run sync:catalogo            (grava o snapshot com o que a rota pública devolver agora)
//      npm run sync:catalogo -- --check (só compara: sai 1 se a rota divergir do snapshot)
// Rota: a mesma do check:de-para, mas com o filtro de marca que responde hoje
//       (/public/i9c/planos = 503 "desligada" em 26/11; /public/planos?marca=i9c = 200 com os 17 visíveis no site).
// Planos da lista FORA_DO_SITE (src/data/catalogo-givm.ts) são listados e NÃO entram no snapshot.
import { readFileSync, writeFileSync } from 'node:fs';
import { FORA_DO_SITE } from '../src/data/catalogo-givm.ts';

const ORIGEM = 'https://api.givm.com.br/api/public/planos?marca=i9c';
const ARQUIVO = new URL('../src/data/catalogo-givm-i9c.json', import.meta.url);
const so = (p) => ({ id: p.id, nome: p.nome, valorMensalCentavos: p.valorMensalCentavos, ...(p.codigo ? { codigo: p.codigo } : {}) });

const r = await fetch(ORIGEM, { headers: { accept: 'application/json' } });
if (!r.ok) { console.error(`${ORIGEM}: HTTP ${r.status}`); process.exit(1); }
const bruto = await r.json();
const lista = Array.isArray(bruto) ? bruto : bruto.items ?? [];
const fora = lista.filter((p) => FORA_DO_SITE.some((x) => p.codigo === x || p.nome?.includes(x)));
const planos = lista.filter((p) => !fora.includes(p)).map(so);
if (fora.length) console.log(`Fora do site (vieram na rota e NÃO entram): ${fora.map((p) => `${p.codigo ?? '?'} ${p.nome}`).join(', ')}`);
console.log(`${ORIGEM}: ${lista.length} planos, ${planos.length} no snapshot`);

if (process.argv.includes('--check')) {
  const atual = JSON.parse(readFileSync(ARQUIVO, 'utf8')).planos;
  const chave = (l) => JSON.stringify(l.map((p) => [p.nome, p.valorMensalCentavos]).sort());
  if (chave(atual) !== chave(planos)) {
    console.error('A rota divergiu do snapshot: rode `npm run sync:catalogo` e confira o diff.');
    process.exit(1);
  }
  console.log('Snapshot = rota.');
} else {
  const hoje = new Date().toISOString().slice(0, 10);
  writeFileSync(ARQUIVO, `${JSON.stringify({ origem: ORIGEM, consultadoEm: hoje, planos }, null, 2)}\n`);
  console.log(`Gravado: src/data/catalogo-givm-i9c.json (${hoje})`);
}
