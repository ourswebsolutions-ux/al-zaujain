// Builds the signed Android APK and publishes it to the website in one step.
//   npm run app:build              build the current version
//   npm run app:build -- --bump    raise the version first (needed for phones to receive the update)
// The website address the app opens by default comes from APP_SITE_URL (environment, .env.local or .env).
// Without it the app asks for the address on first launch.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(app, '..');
for (const file of ['.env.local', '.env']) {
  if (!process.env.APP_SITE_URL && fs.existsSync(path.join(root, file))) process.loadEnvFile(path.join(root, file));
}

const site = (process.env.APP_SITE_URL ?? '').trim().replace(/\/+$/, '');
if (site && !/^https:\/\//i.test(site) && !process.argv.includes('--allow-http')) {
  console.error(`APP_SITE_URL must start with https:// (got "${site}"). Add --allow-http only for local testing.`);
  process.exit(1);
}

const pubspec = path.join(app, 'pubspec.yaml');
let text = fs.readFileSync(pubspec, 'utf8');
let [, version, build] = /^version:\s*([\d.]+)\+(\d+)/m.exec(text);
if (process.argv.includes('--bump')) {
  const parts = version.split('.').map(Number);
  parts[2] += 1;
  version = parts.join('.');
  build = String(Number(build) + 1);
  text = text.replace(/^version:\s*[\d.]+\+\d+/m, `version: ${version}+${build}`);
  fs.writeFileSync(pubspec, text);
  // The version shown inside the app before it can read the installed package.
  const state = path.join(app, 'lib', 'core', 'app_state.dart');
  fs.writeFileSync(state, fs.readFileSync(state, 'utf8').replace(/const appVersion = '[\d.]+';/, `const appVersion = '${version}';`));
}

const flutter = process.env.FLUTTER ?? (fs.existsSync('/media/ali/New Volume2/devtools/flutter/bin/flutter') ? '/media/ali/New Volume2/devtools/flutter/bin/flutter' : 'flutter');
console.log(`Building Al Zaujain ${version} (${build})${site ? ` for ${site}` : ' (asks for the website address)'}…`);
execFileSync(flutter, ['build', 'apk', '--release', '--target-platform', 'android-arm,android-arm64', ...(site ? [`--dart-define=AZ_SITE=${site}`] : [])], { cwd: app, stdio: 'inherit' });
execFileSync(process.execPath, [path.join(app, 'scripts', 'publish-apk.mjs')], { cwd: root, stdio: 'inherit', env: { ...process.env, APP_SITE: site } });
