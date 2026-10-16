/** Dados institucionais usados nas páginas jurídicas da i9c. */
export const EMPRESA = {
  marca: 'i9c',
  razaoSocial: 'IVM Telecomunicação',
  cnpj: '10.285.037/0001-67',
  endereco: 'Rua Brasílio Itiberê, 3953, Cj. 402, Água Verde, Curitiba/PR, CEP 80240-060',
  telefone: '0800 800 0900',
  whatsapp: 'https://wa.me/558008000900',
  areaCliente: 'https://app.i9c.net.br/',
} as const;

/**
 * Encarregado pelo tratamento de dados (DPO) — LGPD art. 41, §1º: identidade e contato devem ser públicos.
 * TODO_DPO: preencher nome e e-mail antes de publicar. Enquanto vazio, a página mostra os canais de atendimento.
 */
export const DPO = {
  nome: '',
  email: '',
} as const;
