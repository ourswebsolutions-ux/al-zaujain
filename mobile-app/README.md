# Al Zaujain — Android app

The Flutter app for the Al Zaujain Marriage Bureau website. It has no database of its own: on first
launch it asks for the website address and then uses that website's `/api/mobile` API, so accounts,
profiles, searches, payments, chat and permissions are exactly the website's.

## Build and publish a new version

1. Raise `version:` in `pubspec.yaml` (for example `1.0.1+2`; the number after `+` must always go up).
2. Build the signed release APK:
   ```
   cd mobile-app
   flutter build apk --release --target-platform android-arm,android-arm64
   ```
3. From the website folder, copy it to the website and update the homepage download section:
   ```
   npm run app:publish
   ```
   This writes `public/downloads/al-zaujain-v<version>.apk` and `public/downloads/app.json`.
   Upload both with the rest of the website.

## Signing key — keep a backup

`android/app/al-zaujain-release.jks` and `android/key.properties` sign every release. Android only
installs an update if it is signed with the same key, so keep a safe copy of both files outside this
computer. They are excluded from git.

## Tests

- `flutter test` — app logic (address handling, Urdu translation, biodata text).
- From the website folder:
  - `npm run test:mobile-api` — every API endpoint against a real server and a test database.
  - `npm run test:mobile-app` — drives the real app (web build) through every screen:
    `flutter build web --profile --dart-define=AZ_SEMANTICS=true` first, then `npm run build`.

## Where things are

- `lib/core` — API client, saved settings (website address, sign-in, language), Urdu dictionary.
- `lib/screens` — one file per area: home, proposals, profile, form, dashboard, payments, chat…
- `lib/widgets` — cards, biodata layout, searchable pickers, biodata image/PDF export.
- Website side: `app/api/mobile/[...path]/route.js` and `lib/mobile/*.js`.
