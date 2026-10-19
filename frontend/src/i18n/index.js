import es from './es.js';
import en from './en.js';
import ko from './ko.js';

export const DEFAULT_LANG = 'es';

export const TRANSLATIONS = { es, en, ko };

export const LOCALE_BY_LANG = { es: 'es-MX', en: 'en-US', ko: 'ko-KR' };

export function getLang() {
  try {
    const stored = localStorage.getItem('inv_lang');
    return TRANSLATIONS[stored] ? stored : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

export function localeFor(lang = getLang()) {
  return LOCALE_BY_LANG[lang] || LOCALE_BY_LANG[DEFAULT_LANG];
}

export function trLocal(key) {
  const lang = getLang();
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS[DEFAULT_LANG][key];
}
