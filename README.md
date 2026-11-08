# Al Zaujain Marriage Bureau

International matrimonial platform with biodata profiles, search, matchmaking, chat, consultants, a member dashboard and an admin dashboard.

**Stack:** Next.js (App Router), JavaScript/JSX, Tailwind CSS, Framer Motion, Prisma, MySQL or MariaDB.

## Setting up

You need Node.js 20.9 or newer and a MySQL or MariaDB server.

1. Create an empty database:

   ```sql
   CREATE DATABASE alzaujain CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. Install, then create your settings file:

   ```bash
   npm install
   cp .env.example .env.local
   ```

3. In `.env.local`, set `DATABASE_URL` and `SITE_URL`. Leave `APP_SECRET` empty to have one generated in the next step, or use `openssl rand -hex 32`.

4. Create the tables, reference data and first admin account. The admin password is printed once:

   ```bash
   npm run setup -- --email you@example.com
   ```

5. Start the site:

   ```bash
   npm run dev                # development, http://localhost:3000
   npm run build && npm start # production
   ```

## Settings

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | `mysql://user:password@host:3306/alzaujain` |
| `TEST_DATABASE_URL` | Optional. A database for the tests. Needed when your main database user cannot create databases. |
| `SITE_URL` | Public address, used in email links and SEO. Use `https://` in production; cookies then become secure. |
| `APP_SECRET` | Encrypts CNIC files and the stored SMTP password. **If this changes, stored CNIC files can no longer be opened.** Back it up. |
| `SMTP_*` | Mail server. Values in Admin > SMTP settings take priority. |
| `STORAGE_DIR` | Optional. Where uploads are kept. Defaults to `./storage`. |
| `DATABASE_POOL_SIZE` | Optional. Defaults to 10. |

## Production checklist

- Back up the database **and** the `storage/` folder together. Photos and CNIC files are not in the database.
- Serve the site over HTTPS, and keep `storage/` outside any public web folder.
- Set the SMTP details. Until then, emails are recorded as skipped in Admin > Email notifications and match emails are not marked as sent.
- Run as one long-lived Node.js process, because it runs the hourly match email check. Serverless hosting will not run it.
- After a schema change, run `npx prisma migrate deploy`.
- If tables were created with `prisma db push`, record the starting point once before deploying: `npx prisma migrate resolve --applied 20261104220716_init`.

## Demo data

## Admin seeder

`npm run seed:admin -- --email you@example.com` creates an administrator, or resets the password of an existing account and makes it an administrator. It is safe to run again. A password is generated and printed once. You can also pass `--name "Your Name"` and `--password "..."`, or set `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Use it if you ever lose admin access: it also signs that account out everywhere.

## Payments and restrictions

Payments are manual and only an administrator can approve one. Add your accounts under **Payment Methods**, choose what is locked under **Restrictions**, and review submissions under **Payment Requests**. Open a user from **Paid Users** to grant, extend, end or revoke access. Restricted photos and contact details are enforced on the server. Member photos must stay out of the Next.js image optimizer, which `images.localPatterns` in `next.config.mjs` ensures, because its cache cannot see who is asking.

`npm run seed:demo` adds 32 realistic sample profiles, six members, three consultants and sample activity, and prints the password. Sample accounts use the reserved `.example` email domain, so no email can reach anyone. Licensed portraits can be added in `scripts/demo-portraits`. Run `npm run clear:demo` before going live: sample records are marked in the database and it removes only those. `npm run clear:demo` removes all of it, including photos.

## Accounts

Registration has no email verification. The browser generates the password, so it never appears in a server response or log, and the member is signed in straight away. Because an email address is not proven, a login-free profile joins an account only through its private manage link, never by matching the email.

## Languages

The language switch keeps the choice in a cookie. Urdu changes text only: the layout stays identical. Translations live in `lib/i18n/ur.js`, keyed by the English text, so a missing entry simply shows English.

## Tests

Both suites use a separate database, which is erased on each run: `TEST_DATABASE_URL` if set, otherwise your database name with `_test` added. The name must end in `_test`, and the user needs permission to create it.

```bash
npm test                      # unit and database tests
npm run build
npm run test:e2e              # browser tests, needs Chromium at /usr/bin/chromium or CHROME_PATH
```

## Where things are

| Path | Contents |
| --- | --- |
| `app/(site)` | Public site |
| `app/(member)` | Member dashboard and messages |
| `app/admin` | Admin dashboard |
| `app/consultant` | Consultant dashboard |
| `app/actions` | Server Actions (form handling) |
| `app/api` | Routes for uploads, chat and CNIC viewing |
| `components` | Reusable JSX components |
| `lib/profile-schema.js` | The one definition of a profile: form sections, validation, the biodata layout, copy text and completion score. |
| `prisma/schema.prisma` | Database schema |

`app/globals.css` is only the Tailwind entry point and design tokens. All styling is in Tailwind classes.
