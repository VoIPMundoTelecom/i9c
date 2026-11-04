# De-para: plano do site → código no catálogo do givm

O botão "Contratar" vai para `https://contratar.i9c.net.br/?plano=<codigo>`, onde `<codigo>` é o código do plano no
catálogo do givm. O givm gera o código como `<prefixo>-<n>` por marca (i9c = `I9C-<n>`, sequencial pela ordem de
cadastro), então ele **não** dá para deduzir do nome: vem do catálogo.

- Fonte no código: `CODIGO_GIVM` em `src/data/planos.ts` (preço do `value` do `begin_checkout`: `PRECO_CONTRATAR`).
- Validação: `npm run check:de-para` (lê `GET https://api.givm.com.br/api/public/i9c/planos`) ou
  `npm run check:de-para -- catalogo.json` com o export do catálogo. Confere código existente, ativo, sem repetição e
  preço do givm = preço do site.
- Trava: com `CONTRATAR_URL` no formulário e algum código vazio, o build quebra (`formularioUrl`).

**Status (03/11/2026):** [bloqueado: catálogo i9c da S1 não publicado]. O back `i9c-contratacao` ainda não saiu; o
front (givm_Frontend#216) está "aguarda S1" e hoje propõe `PlanoI9c` **sem** campo `codigo` (casa pelo `id` uuid).
Para o `?plano=<codigo>` funcionar, `GET /public/i9c/planos` precisa devolver `codigo` e o formulário precisa aceitar o
código em `?plano=`.

| id do site | plano (nome no site) | preço no site (03/11) | código givm |
|---|---|---:|---|
| prepago-whatsapp | Pré-pago Só WhatsApp · 30 dias | R$ 13,99 | [pendente S1] |
| prepago-1gb | Pré-pago 1GB · 30 dias | R$ 15,99 | [pendente S1] |
| prepago-10gb | Pré-pago 10GB · 7 dias | R$ 41,99 | [pendente S1] |
| prepago-30gb | Pré-pago 30GB · 30 dias | R$ 81,99 | [pendente S1] |
| black-1gb | Black Individual 1GB · 30 dias | R$ 15,99 | [pendente S1] |
| black-5gb | Black Individual 5GB · 30 dias | R$ 31,99 | [pendente S1] |
| black-10gb | Black Individual 10GB · 30 dias | R$ 41,99 | [pendente S1] |
| black-50gb | Black Individual 50GB · 30 dias | R$ 129,99 | [pendente S1] |
| controle-15gb | Controle 15GB · 30 dias | R$ 55,99 | [pendente S1] |
| controle-30gb | Controle 30GB · 30 dias | R$ 81,99 | [pendente S1] |
| controle-80gb | Controle 80GB · 30 dias | R$ 194,99 | [pendente S1] |
| familia-15gb | Família 15GB · +1 linha | R$ 49,99 | [pendente S1] |
| familia-40gb | Família 40GB · +2 linhas | R$ 79,99 | [pendente S1] |
| familia-100gb | Família 100GB · +3 linhas | R$ 239,99 | [pendente S1] |
| familia-230gb | Família 230GB · +5 linhas | R$ 429,99 | [pendente S1] |
| empresas-3gb | Empresas 3GB | R$ 19,99 | [pendente S1] |
| empresas-5gb | Empresas 5GB | R$ 35,99 | [pendente S1] |
| empresas-15gb | Empresas 15GB | R$ 59,99 | [pendente S1] |
| empresas-50gb | Empresas 50GB | R$ 129,99 | [pendente S1] |
| empresas-160gb | Empresas 160GB | R$ 390,99 | [pendente S1] |

Exemplo, depois de preenchido: `prepago-1gb` → `I9C-2` → `https://contratar.i9c.net.br/?plano=I9C-2`
(número ilustrativo: o real vem do catálogo).

## Ordem para ligar o formulário
1. S1 publica o catálogo i9c (com `codigo`).
2. Preencher `CODIGO_GIVM` e rodar `npm run check:de-para` até dar "De-para OK" (PR próprio).
3. Com o OK do Fabricio: `CONTRATAR_URL = 'https://contratar.i9c.net.br/'`, build + `npm run test:contratar`.
