import { ru } from './ru.js';
import { fi } from './fi.js';
import { en } from './en.js';
import { sv } from './sv.js';
import { fiRecipes, enRecipes, svRecipes } from './recipes.js';

export const copy = { ru, fi, en, sv };
export const mealCopy = { fi: fiRecipes, en: enRecipes, sv: svRecipes };

const supportedLanguages = ['ru', 'fi', 'en', 'sv'];

export function getSupportedLanguage(language) {
  return supportedLanguages.includes(language) ? language : 'ru';
}

export function getLocale(language) {
  const supported = getSupportedLanguage(language);
  return supported === 'ru' ? 'ru-FI'
    : supported === 'fi' ? 'fi-FI'
      : supported === 'sv' ? 'sv-FI'
        : 'en-FI';
}

export function formatCurrency(amount, language) {
  const number = Number(amount);
  if (!Number.isFinite(number)) return '';
  return new Intl.NumberFormat(getLocale(language), {
    style: 'currency',
    currency: 'EUR'
  }).format(number);
}

export function formatDate(date, language) {
  return new Intl.DateTimeFormat(getLocale(language), {
    dateStyle: 'long'
  }).format(date instanceof Date ? date : new Date(date));
}
