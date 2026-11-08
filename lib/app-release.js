// The Android app offered on the homepage. `npm run app:publish` (mobile-app/scripts/publish-apk.mjs)
// copies a fresh build to public/downloads and writes app.json beside it.
import fs from 'node:fs';
import path from 'node:path';

const DIR = () => path.join(process.cwd(), 'public', 'downloads');

export function appRelease() {
  try {
    const info = JSON.parse(fs.readFileSync(path.join(DIR(), 'app.json'), 'utf8'));
    const file = path.basename(String(info.file ?? ''));
    if (!/\.apk$/.test(file) || !fs.existsSync(path.join(DIR(), file))) return null;
    return {
      version: String(info.version ?? ''),
      build: Number(info.build) || null,
      size: Number(info.size) || fs.statSync(path.join(DIR(), file)).size,
      date: info.date ?? null,
      minAndroid: info.minAndroid ?? null,
      sha256: info.sha256 ?? null,
      url: `/downloads/${file}`,
    };
  } catch {
    return null;
  }
}

export const megabytes = (bytes) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
