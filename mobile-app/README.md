# Al Zaujain — Android app

The Flutter app for the Al Zaujain Marriage Bureau website. It has no database of its own: on first
launch it asks for the website address and then uses that website's `/api/mobile` API, so accounts,
profiles, searches, payments, chat and permissions are exactly the website's.

## Build and publish a new Android version

From the website folder:
```
npm run app:build -- --bump
```
This raises the version, builds the signed APK and copies it to `public/downloads` with `app.json`.
Upload both with the rest of the website. Installed apps see the new build the next time they open
and offer a one-tap update (the download is checked against its SHA-256 before Android installs it).

Set `APP_SITE_URL=https://your-domain` in `.env.local` first: the address is built into the app, so
families never see the "website address" screen. Without it the app asks for the address once.

## iPhone (iOS)

iOS apps can only be built on a Mac. `.github/workflows/ios-app.yml` builds the app on GitHub's Macs:
run it from the repository's Actions tab ("iOS app" → Run workflow), or push a tag like `app-v1.0.1`.
Without signing secrets it produces an unsigned build that proves the app compiles. To install it on
iPhones you need an Apple Developer account (USD 99 a year) and the secrets listed at the top of the
workflow; it then builds a signed IPA and uploads it to TestFlight, from where it goes to the App Store.
iPhone updates come through TestFlight / the App Store, not from the website.

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
