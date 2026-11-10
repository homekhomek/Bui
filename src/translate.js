// translate.js — ALL player-facing strings live here.
// Never hardcode user-visible text in components; add a key here and use t().

const STRINGS = {
  en: {
    title: 'Bui',
    subtitle: 'An autobattler',
    start: 'Start',
  },
};

let currentLang = 'en';

export function setLanguage(lang) {
  if (STRINGS[lang]) currentLang = lang;
}

export function getLanguage() {
  return currentLang;
}

// Look up a string by key. Supports {placeholder} substitution:
// t('greeting', { name: 'Bui' }) with "Hello {name}" -> "Hello Bui"
export function t(key, vars = {}) {
  const str = STRINGS[currentLang]?.[key] ?? STRINGS.en[key] ?? key;
  return str.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
}
