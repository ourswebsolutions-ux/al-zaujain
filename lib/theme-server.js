import { cookies } from 'next/headers';
import { THEME_COOKIE } from './theme.js';

export const getTheme = async () => ((await cookies()).get(THEME_COOKIE)?.value === 'dark' ? 'dark' : 'light');
