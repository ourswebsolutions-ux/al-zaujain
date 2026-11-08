import { cache } from 'react';
import { cookies } from 'next/headers';
import { LANG_COOKIE, makeT } from './core.js';

export const getLang = cache(async () => ((await cookies()).get(LANG_COOKIE)?.value === 'ur' ? 'ur' : 'en'));

export async function getT() {
  return makeT(await getLang());
}
