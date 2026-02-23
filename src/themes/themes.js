/**
 * Theme registry for AmigoSecreto.
 * To add a new theme, add a new key here with the required fields.
 * The ?style=<key> URL parameter (or localStorage) will activate it.
 */
export const THEMES = {
  retro: {
    label: 'RETRO',
    titleBar: 'AMIGO_SECRETO.EXE',
    footer: 'AMIGOSECRETO_OS',
    footerRight: 'DB_AUTH: MYSQL_ENABLED',
    prompt: 'C:\\>',
  },
  easter: {
    label: 'PÁSCOA',
    titleBar: '✟ AMIGO SECRETO ✟',
    footer: 'AD MMXXVI · PÁSCOA',
    footerRight: 'PAX ET BONUM',
    prompt: '✟ >',
  },
  merry: {
    label: 'NATAL',
    titleBar: '☆ AMIGO SECRETO ☆',
    footer: 'AD MMXXVI · NATAL',
    footerRight: 'GLORIA IN EXCELSIS',
    prompt: '☆ >',
  },
};

export const DEFAULT_THEME = 'retro';
export const VALID_THEMES  = Object.keys(THEMES);
