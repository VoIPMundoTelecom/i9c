/**
 * Texto do aviso de cookies/consentimento — ÚNICO lugar para trocar.
 *
 * TODO: texto oficial da S1 (LGPD, escrito no givm). Este é PROVISÓRIO.
 * Não mudar finalidade, prazo nem direito de exclusão sem a S1:
 *   finalidade = medir visitas e interesse nas páginas para melhorar o atendimento comercial
 *   guarda      = 13 meses
 *   exclusão    = a pedido (link para a política de privacidade, seção do encarregado/contato)
 */
import type { Idioma } from '../i18n/rotas';
import { ROTAS } from '../i18n/rotas';

export interface TextoConsentimento {
  aria: string;
  titulo: string;
  texto: string;
  link: { href: string; label: string };
  aceitar: string;
  recusar: string;
  /** link no rodapé que reabre o aviso */
  preferencias: string;
  /** linha que aparece quando o aviso é reaberto: "{escolha}" e "{data}" são trocados no navegador */
  atual: string;
  aceito: string;
  recusado: string;
}

export const CONSENTIMENTO: Record<Idioma, TextoConsentimento> = {
  'pt-br': {
    aria: 'Aviso de cookies',
    titulo: 'Cookies de medição.',
    texto:
      'Com a sua permissão, medimos as visitas e o interesse nas páginas para melhorar o nosso atendimento comercial. Os dados ficam guardados por 13 meses e você pode pedir a exclusão quando quiser.',
    link: { href: `${ROTAS['politica-de-privacidade']['pt-br']}#contato`, label: 'Privacidade e contato' },
    aceitar: 'Aceitar',
    recusar: 'Recusar',
    preferencias: 'Preferências de cookies',
    atual: 'Sua escolha atual: {escolha} em {data}.',
    aceito: 'aceito',
    recusado: 'recusado',
  },
  en: {
    aria: 'Cookie notice',
    titulo: 'Measurement cookies.',
    texto:
      'With your permission, we measure visits and interest in our pages to improve our sales support. The data is kept for 13 months and you can ask us to delete it at any time.',
    link: { href: `${ROTAS['politica-de-privacidade'].en}#contato`, label: 'Privacy and contact' },
    aceitar: 'Accept',
    recusar: 'Decline',
    preferencias: 'Cookie preferences',
    atual: 'Your current choice: {escolha} on {data}.',
    aceito: 'accepted',
    recusado: 'declined',
  },
  es: {
    aria: 'Aviso de cookies',
    titulo: 'Cookies de medición.',
    texto:
      'Con su permiso, medimos las visitas y el interés en las páginas para mejorar nuestra atención comercial. Los datos se guardan durante 13 meses y puede pedir que los eliminemos cuando quiera.',
    link: { href: `${ROTAS['politica-de-privacidade'].es}#contato`, label: 'Privacidad y contacto' },
    aceitar: 'Aceptar',
    recusar: 'Rechazar',
    preferencias: 'Preferencias de cookies',
    atual: 'Su elección actual: {escolha} el {data}.',
    aceito: 'aceptado',
    recusado: 'rechazado',
  },
};

export const consentimento = (idioma: Idioma) => CONSENTIMENTO[idioma];
