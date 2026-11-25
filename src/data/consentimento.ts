/**
 * Texto do aviso de cookies/consentimento: ÚNICO lugar para trocar.
 *
 * Texto oficial do givm (givm_backend docs/lgpd/aviso-cookies-pixel.md), adaptado para a i9c.
 * Não mudar finalidade, prazo nem direitos sem passar pelo givm:
 *   finalidade = medir o interesse e priorizar o retorno comercial
 *   guarda      = 13 meses (MKT_PIXEL_RETENCAO_MESES no givm; mudou lá, muda aqui)
 *   direitos    = cópia ou exclusão a pedido, pelo canal de contato do site, em até 15 dias
 * Não citar fornecedor, operadora nem ferramenta de terceiros no aviso.
 * O canal de contato (#contato da política) mostra o encarregado (DPO) e o e-mail dele (src/data/empresa.ts).
 */
import type { Idioma } from '../i18n/rotas';
import { ROTAS } from '../i18n/rotas';

export interface TextoConsentimento {
  aria: string;
  texto: string;
  /** "Saiba mais": texto completo na política de privacidade (seção #cookies) */
  saibaMais: { href: string; label: string };
  /** canal de contato da política (seção #contato) */
  link: { href: string; label: string };
  aceitar: string;
  recusar: string;
  /** link no rodapé que reabre o aviso */
  preferencias: string;
  /** linha que aparece quando o aviso é reaberto: "{escolha}" e "{data}" são trocados no navegador */
  atual: string;
  aceito: string;
  recusado: string;
  /** texto completo ("Saiba mais") renderizado na política de privacidade; HTML simples */
  detalhe: { titulo: string; itens: { rotulo: string; html: string }[] };
}

const politica = (idioma: Idioma) => ROTAS['politica-de-privacidade'][idioma];

export const CONSENTIMENTO: Record<Idioma, TextoConsentimento> = {
  'pt-br': {
    aria: 'Aviso de cookies',
    texto:
      'Usamos cookies próprios para entender como você navega no site da i9c (quais páginas visita e de onde chegou) e assim melhorar nossas ofertas e o atendimento. Não vendemos nem compartilhamos esses dados. Você escolhe:',
    saibaMais: { href: `${politica('pt-br')}#cookies`, label: 'Saiba mais' },
    link: { href: `${politica('pt-br')}#contato`, label: 'Privacidade e contato' },
    aceitar: 'Aceitar',
    recusar: 'Recusar',
    preferencias: 'Preferências de cookies',
    atual: 'Sua escolha atual: {escolha} em {data}.',
    aceito: 'aceito',
    recusado: 'recusado',
    detalhe: {
      titulo: 'Cookie próprio de medição (_ivm_vid)',
      itens: [
        { rotulo: 'O que coletamos.', html: 'Com o seu aceite, um cookie próprio (<code>_ivm_vid</code>) identifica este navegador e registra as páginas que você visita, a página de origem, as campanhas (utm) e cliques em WhatsApp e formulários. Se você preencher um formulário (como o de portabilidade), ligamos essas visitas ao nome, e-mail, telefone e empresa que você informou.' },
        { rotulo: 'Para quê.', html: 'Medir o interesse nos nossos produtos e serviços e priorizar o retorno comercial a quem pediu contato.' },
        { rotulo: 'Base legal.', html: 'O seu <strong>consentimento</strong> (LGPD, art. 7º, I), que você pode retirar a qualquer momento em “Preferências de cookies”, no rodapé do site. Os dados do formulário também servem para atender ao pedido de contato que você fez.' },
        { rotulo: 'Por quanto tempo.', html: '<strong>13 meses.</strong> Depois disso, as visitas são apagadas automaticamente.' },
        { rotulo: 'Com quem.', html: 'Ninguém. Os dados ficam nos sistemas do Grupo IVM e não são vendidos nem compartilhados com anunciantes.' },
        { rotulo: 'Seus direitos.', html: 'Você pode pedir uma cópia dos seus dados ou a exclusão deles a qualquer momento pelo canal de contato do site (veja <a href="#contato">Privacidade e contato</a>), informando o e-mail ou o telefone que usou no formulário. Atendemos em até 15 dias.' },
      ],
    },
  },
  en: {
    aria: 'Cookie notice',
    texto:
      'We use our own cookies to understand how you browse the i9c website (which pages you visit and where you came from) so we can improve our offers and customer service. We do not sell or share this data. Your choice:',
    saibaMais: { href: `${politica('en')}#cookies`, label: 'Learn more about cookies' },
    link: { href: `${politica('en')}#contato`, label: 'Privacy and contact' },
    aceitar: 'Accept',
    recusar: 'Decline',
    preferencias: 'Cookie preferences',
    atual: 'Your current choice: {escolha} on {data}.',
    aceito: 'accepted',
    recusado: 'declined',
    detalhe: {
      titulo: 'Our own measurement cookie (_ivm_vid)',
      itens: [
        { rotulo: 'What we collect.', html: 'With your consent, our own cookie (<code>_ivm_vid</code>) identifies this browser and records the pages you visit, the page you came from, campaigns (utm) and clicks on WhatsApp and forms. If you fill in a form (such as the portability form), we link these visits to the name, e-mail, phone number and company you provided.' },
        { rotulo: 'Why.', html: 'To measure interest in our products and services and to prioritise our sales follow-up with those who asked to be contacted.' },
        { rotulo: 'Legal basis.', html: 'Your <strong>consent</strong> (LGPD, art. 7, I), which you can withdraw at any time under “Cookie preferences” in the website footer. Form data is also used to answer the contact request you made.' },
        { rotulo: 'How long.', html: '<strong>13 months.</strong> After that, the visits are deleted automatically.' },
        { rotulo: 'Who with.', html: 'No one. The data stays in Grupo IVM’s systems and is not sold or shared with advertisers.' },
        { rotulo: 'Your rights.', html: 'You can ask for a copy of your data or for its deletion at any time through the website’s contact channel (see <a href="#contato">Privacy and contact</a>), stating the e-mail or phone number you used in the form. We respond within 15 days.' },
      ],
    },
  },
  es: {
    aria: 'Aviso de cookies',
    texto:
      'Usamos cookies propias para entender cómo navega por el sitio de i9c (qué páginas visita y de dónde llegó) y así mejorar nuestras ofertas y la atención. No vendemos ni compartimos estos datos. Usted elige:',
    saibaMais: { href: `${politica('es')}#cookies`, label: 'Más información sobre cookies' },
    link: { href: `${politica('es')}#contato`, label: 'Privacidad y contacto' },
    aceitar: 'Aceptar',
    recusar: 'Rechazar',
    preferencias: 'Preferencias de cookies',
    atual: 'Su elección actual: {escolha} el {data}.',
    aceito: 'aceptado',
    recusado: 'rechazado',
    detalhe: {
      titulo: 'Cookie propia de medición (_ivm_vid)',
      itens: [
        { rotulo: 'Qué recopilamos.', html: 'Con su aceptación, una cookie propia (<code>_ivm_vid</code>) identifica este navegador y registra las páginas que visita, la página de origen, las campañas (utm) y los clics en WhatsApp y formularios. Si completa un formulario (como el de portabilidad), vinculamos esas visitas al nombre, correo electrónico, teléfono y empresa que informó.' },
        { rotulo: 'Para qué.', html: 'Medir el interés en nuestros productos y servicios y priorizar el contacto comercial con quien lo solicitó.' },
        { rotulo: 'Base legal.', html: 'Su <strong>consentimiento</strong> (LGPD, art. 7, I), que puede retirar en cualquier momento en “Preferencias de cookies”, en el pie del sitio. Los datos del formulario también sirven para atender la solicitud de contacto que hizo.' },
        { rotulo: 'Por cuánto tiempo.', html: '<strong>13 meses.</strong> Después, las visitas se eliminan automáticamente.' },
        { rotulo: 'Con quién.', html: 'Con nadie. Los datos quedan en los sistemas del Grupo IVM y no se venden ni se comparten con anunciantes.' },
        { rotulo: 'Sus derechos.', html: 'Puede pedir una copia de sus datos o su eliminación en cualquier momento por el canal de contacto del sitio (vea <a href="#contato">Privacidad y contacto</a>), indicando el correo electrónico o el teléfono que usó en el formulario. Respondemos en hasta 15 días.' },
      ],
    },
  },
};

export const consentimento = (idioma: Idioma) => CONSENTIMENTO[idioma];
