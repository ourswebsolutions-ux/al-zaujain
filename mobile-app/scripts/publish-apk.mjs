// Copies the release APK into the website's public/downloads folder and writes app.json, which the
// homepage's "Android app" section reads for the download button, version, size and QR code.
// Run from the website folder:  npm run app:publish   (after `flutter build apk --release`)
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const apk = path.join(root, 'mobile-app', 'build', 'app', 'outputs', 'flutter-apk', 'app-release.apk');
const downloads = path.join(root, 'public', 'downloads');
if (!fs.existsSync(apk)) {
  console.error(`No APK at ${apk}. Build it first: cd mobile-app && flutter build apk --release`);
  process.exit(1);
}

// Reads the version from the APK itself with the Android SDK's aapt tool.
function findAapt() {
  const homes = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT, path.join(os.homedir(), 'android-sdk'), path.join(os.homedir(), 'Android', 'Sdk')].filter(Boolean);
  for (const home of homes) {
    const tools = path.join(home, 'build-tools');
    if (!fs.existsSync(tools)) continue;
    for (const version of fs.readdirSync(tools).sort().reverse()) {
      const aapt = path.join(tools, version, 'aapt');
      if (fs.existsSync(aapt)) return aapt;
    }
  }
  return null;
}

const ANDROID = { 21: '5.0', 22: '5.1', 23: '6.0', 24: '7.0', 25: '7.1', 26: '8.0', 27: '8.1', 28: '9', 29: '10', 30: '11', 31: '12', 32: '12L', 33: '13', 34: '14', 35: '15', 36: '16' };
let version = '';
let build = null;
let minSdk = null;
const aapt = findAapt();
if (aapt) {
  const badging = execFileSync(aapt, ['dump', 'badging', apk], { encoding: 'utf8' });
  version = /versionName='([^']+)'/.exec(badging)?.[1] ?? '';
  build = Number(/versionCode='(\d+)'/.exec(badging)?.[1]) || null;
  minSdk = Number(/sdkVersion:'(\d+)'/.exec(badging)?.[1]) || null;
} else {
  version = /^version:\s*([\d.]+)/m.exec(fs.readFileSync(path.join(root, 'mobile-app', 'pubspec.yaml'), 'utf8'))?.[1] ?? '';
}

fs.mkdirSync(downloads, { recursive: true });
for (const file of fs.readdirSync(downloads)) {
  if (/^al-zaujain.*\.apk$/.test(file)) fs.rmSync(path.join(downloads, file));
}
const file = `al-zaujain-v${version || 'latest'}.apk`;
fs.copyFileSync(apk, path.join(downloads, file));
const bytes = fs.readFileSync(apk);
const info = {
  file,
  version,
  build,
  size: bytes.length,
  sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  minAndroid: minSdk ? ANDROID[minSdk] ?? null : null,
  // The website built into the app (APP_SITE_URL), so the homepage need not tell families to type it.
  site: process.env.APP_SITE || null,
  date: new Date().toISOString(),
};
fs.writeFileSync(path.join(downloads, 'app.json'), `${JSON.stringify(info, null, 2)}\n`);
console.log(`Published ${file} (${(info.size / 1048576).toFixed(1)} MB, version ${version}, Android ${info.minAndroid ?? '?'}+) to public/downloads.`);
