// English text is the key, so anything without a translation simply stays readable.
import { PATTERNS, UR } from './ur.js';

export const LANGUAGES = ['en', 'ur'];
export const LANG_COOKIE = 'az_lang';

const fill = (text, vars) => (vars ? text.replace(/\{(\w+)\}/g, (match, key) => vars[key] ?? match) : text);

export function translate(lang, text, vars) {
  if (text === null || text === undefined || text === '') return text;
  const source = String(text);
  if (lang !== 'ur') return fill(source, vars);
  const exact = UR[source];
  if (exact) return fill(exact, vars);
  for (const [pattern, template] of PATTERNS) {
    const match = pattern.exec(source);
    if (match) return template.replace(/\$(\d)/g, (_, index) => UR[match[Number(index)]] ?? match[Number(index)]);
  }
  return fill(source, vars);
}

export const makeT = (lang) => (text, vars) => translate(lang, text, vars);

export const locale = (lang) => (lang === 'ur' ? 'ur-PK' : 'en-GB');
