const STORAGE_KEY = 'lunch-budget-settings';

export const defaultSettings = {
  language: 'ru',
  budget: 20,
  people: 4,
  stores: ['prisma', 'citymarket', 'lidl'],
  filter: 'all'
};

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function sanitizeSettings(value) {
  if (!value || typeof value !== 'object') return { ...defaultSettings };

  const stores = Array.isArray(value.stores)
    ? [...new Set(value.stores.filter((storeId) =>
        ['prisma', 'citymarket', 'lidl'].includes(storeId)
      ))]
    : [...defaultSettings.stores];

  return {
    language: ['ru', 'fi', 'en', 'sv'].includes(value.language) ? value.language : 'ru',
    budget: clampNumber(value.budget, 1, 500, defaultSettings.budget),
    people: clampNumber(value.people, 1, 20, defaultSettings.people),
    stores,
    filter: ['all', 'vegetarian', 'quick'].includes(value.filter) ? value.filter : 'all'
  };
}

export function loadSettings(storage) {
  try {
    const target = storage || globalThis.localStorage;
    if (!target) return { ...defaultSettings };
    const raw = target.getItem(STORAGE_KEY);
    if (!raw) {
      const oldLanguage = target.getItem('lunch-language');
      return {
        ...defaultSettings,
        language: ['ru', 'fi', 'en', 'sv'].includes(oldLanguage) ? oldLanguage : 'ru'
      };
    }
    return sanitizeSettings(JSON.parse(raw));
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings, storage) {
  try {
    const target = storage || globalThis.localStorage;
    if (!target) return false;
    target.setItem(STORAGE_KEY, JSON.stringify(sanitizeSettings(settings)));
    return true;
  } catch {
    return false;
  }
}
