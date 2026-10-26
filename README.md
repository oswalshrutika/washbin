# Washbin

Booking website for Washbin home-cleaning services: public site, pincode check, OTP login,
booking wizard with price breakdown and slots, mock payments, and a customer account area.

Built with Next.js 16 (App Router), React 19, Tailwind CSS v4, PostgreSQL + Drizzle ORM.

> This is a server-rendered app with a database, so it **cannot run on GitHub Pages** (static only).
> Host the code on GitHub and deploy it on a Node host such as Vercel, Render or Railway.

## Run locally

Requirements: Node 22+, PostgreSQL 16 (Homebrew `postgresql@16`, or `docker compose up -d`).

```bash
npm install
cp .env.example .env          # then set SESSION_SECRET (openssl rand -hex 32)
npm run db:migrate            # create tables
npm run db:seed               # services, areas, slots, coupons
npm run dev                   # http://localhost:3000
```

In dev the login OTP is shown on screen (no SMS is sent).

## Deploy (Vercel + Neon example)

1. Push this repo to GitHub.
2. Create a Postgres database (e.g. [Neon](https://neon.tech) free tier) and copy its connection string.
3. Run the migrations and seed against it once from your machine:
   ```bash
   DATABASE_URL="<hosted url>" npm run db:migrate
   DATABASE_URL="<hosted url>" npm run db:seed
   ```
4. Import the repo on [Vercel](https://vercel.com/new) and add the environment variables
   `DATABASE_URL` and `SESSION_SECRET`. Deploy.

This setup is meant for demos:
- **OTP / SMS, WhatsApp, email and Razorpay are mocks** (`src/lib/providers/`). While the mock OTP
  sender is in use, the OTP is shown on the login screen, so any phone number works.
- **Photo uploads are saved to local disk** (`storage/uploads`; `/tmp` on Vercel, where they are
  temporary). Swap `src/server/uploads.ts` for S3/R2/GCS storage for real use.
- Business values (prices, GST, slots, fees, pincodes, support number) are placeholders in
  `src/config/business.ts` and `src/db/seed-data.ts`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev server, production build, production server |
| `npm test` | Unit tests (vitest) |
| `npm run lint` / `typecheck` | ESLint / TypeScript |
| `npm run db:generate` | New migration after editing `src/db/schema.ts` |
| `npm run db:migrate` / `db:seed` | Apply migrations / load seed data |
| `npm run db:reset` | Drop, migrate and seed (refuses in production) |
