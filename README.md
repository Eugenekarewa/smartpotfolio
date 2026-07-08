Pesa Command — a personal finance command center for the Kenyan market. Net worth and cash flow tracking, investments/assets/liabilities, bills, small-business P&L, and premium market intelligence (CBK auctions, MMF yields, crypto/NSE prices).

## Prerequisites

- Node.js 20+
- A MongoDB instance — either:
  - **MongoDB Atlas** (recommended, matches production), or
  - **Local MongoDB** for development (see below)
- A Resend API key (email), IntaSend keys (billing), and Google OAuth credentials — all optional for basic local dev; features that need them degrade gracefully or log a warning when unset.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` in the project root:

   ```bash
   MONGODB_URI=mongodb://localhost:27017/pesa-command   # or your Atlas connection string

   AUTH_SECRET=some-random-string       # openssl rand -base64 32
   AUTH_GOOGLE_ID=
   AUTH_GOOGLE_SECRET=

   RESEND_API_KEY=
   EMAIL_FROM=Pesa Command <noreply@pesacommand.co.ke>

   CRON_SECRET=some-random-string       # protects /api/cron/* routes

   INTASEND_PUBLISHABLE_KEY=
   INTASEND_SECRET_KEY=
   INTASEND_WEBHOOK_SECRET=
   INTASEND_TEST_MODE=true

   COINGECKO_API_KEY=

   APP_URL=http://localhost:3000
   ```

## Running

```bash
npm run dev      # dev server with hot reload, http://localhost:3000
```

```bash
npm run build    # production build
npm start        # serve the production build
```

Both `dev` and `build` are wired to Next.js's webpack compiler (`next dev --webpack` / `next build --webpack`) instead of Turbopack — this repo was built on a machine where Turbopack's native bindings were blocked by a Windows Application Control policy. If your machine doesn't have that restriction, Turbopack (`next dev` / `next build` without `--webpack`) works too and is faster.

**Known local-environment quirk:** on a machine where native SWC bindings can't load at all (falling back to Next.js's WASM SWC), `next dev` can throw a Rust/WASM panic (`invalid type: unit value, expected usize`) specifically on POST/PUT/DELETE route handlers, while GET requests and `next build && next start` work fine. If mutations 500 in dev but the exact same request works after `npm run build && npm start`, this is why — use the production server for local testing until it's resolved upstream or native bindings are unblocked.

## Running MongoDB locally

If you don't want to use Atlas for local dev (e.g. your network blocks outbound port 27017 to Atlas, or you just want an isolated local DB):

1. Download the MongoDB Community "portable" zip for Windows (no installer) from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community) and extract it anywhere, e.g. `C:\mongodb`.
2. Create a data directory: `C:\mongodb\data`.
3. Start it:

   ```powershell
   C:\mongodb\mongodb-win32-x86_64-windows-<version>\bin\mongod.exe --dbpath C:\mongodb\data --port 27017
   ```

4. Point `.env.local` at it: `MONGODB_URI=mongodb://localhost:27017/pesa-command`.

Production (Vercel) should still use Atlas — a local port block on one machine doesn't affect Vercel's network.

## Scheduled jobs

`/api/cron/*` routes (bill reminders, subscription grace/downgrade, crypto price refresh, weekly digest) are meant to be invoked by a scheduler (Vercel Cron in production) with `Authorization: Bearer $CRON_SECRET`. There's no local scheduler wired up — trigger them manually while developing:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/bill-reminders
```

## Deploy

Deploy to [Vercel](https://vercel.com/new). Set the environment variables above in the Vercel project settings, and configure the cron routes under `vercel.json` (already present in this repo) to hit each `/api/cron/*` endpoint on its schedule.
