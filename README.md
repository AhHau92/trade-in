# DeviceTradeIn — Device Trade-In Booking Platform

A full-stack Next.js app that lets customers get an instant trade-in quote for
a phone or laptop and book a drop-off (in-store) or pickup appointment, plus
an admin panel to manage the product catalog, pricing, branches, and incoming
bookings.

## 1. What this is

A two-sided e-commerce-style booking system, structurally similar to what
carriers/retailers (e.g. Apple Trade In, Carousell, ShopBack) run for device
trade-ins:

- **Public storefront** — browse by category (Phone / Macbook) → brand →
  product → condition, answer a few condition questions (screen, battery,
  accessories, etc.), get a live price, and book either a store visit or a
  home pickup.
- **Admin panel** — manage categories, brands, products, variants
  (storage/capacity tiers), reusable "question templates" (condition
  questions + price adjustments), branches, bookings, site settings, and
  admin accounts (role-based: `admin` / `superadmin`, with one hardcoded
  root superadmin who alone can promote/demote roles).

## 2. Business problem it solves

Trade-in pricing is inherently variable — a cracked screen or a missing
charger changes the payout — and a naive implementation lets that pricing
be **client-controlled**, which is a direct financial exploit (a customer
edits `finalPrice` in DevTools before submitting and the business pays out
more than the device is worth). This project's core design problem was
building a booking flow where:

- price is always **computed and re-verified server-side**, never trusted
  from the client;
- concurrent bookings never collide on the same human-readable reference
  number;
- money is never silently corrupted by floating-point rounding;
- the admin side lets non-technical staff manage a large, frequently
  changing product/pricing catalog without touching code.

## 3. Complex design work / what makes this more than a CRUD demo

- **Server-authoritative pricing** (`src/lib/bookingPricing.ts`). Both the
  price-preview endpoint (`/api/public/bookings/quote`) and the actual
  booking-creation endpoint (`/api/public/bookings`) call the *same*
  `resolveBookingPricing()` function, so a quote and the final charged price
  can never drift apart. The client only ever sends *which* variant and
  *which* answers were picked — never a price. If a customer's local price
  is stale (e.g. an admin changed pricing mid-session), the booking flow
  quotes first, and only shows a confirm-price-changed modal if the number
  actually differs — it doesn't hard-reject.
- **Race-condition-free sequential booking references.** Booking refs look
  like `TI-20260712-011` (day + zero-padded sequence) rather than a random
  UUID, because staff need to read them off over the phone. That ruled out
  the naive `COUNT(*) + 1` approach, which two concurrent requests can
  read identically and then both try to insert the same ref. Instead, a
  `DailyBookingCounter` row is `upsert`'d per calendar day — Postgres
  serializes concurrent upserts on the same primary key via row locking, so
  no two requests can ever be handed the same number. The counter
  increment is deliberately **not** wrapped in the same transaction as the
  booking insert; if it were, a `bookingRef` collision would roll back the
  counter increment too and a retry would recompute the exact same doomed
  number, looping forever. Keeping them separate means a collision only
  costs a small gap in the sequence, and a bounded retry loop (10 attempts)
  always makes forward progress. Verified under 12 concurrent requests with
  no collisions.
- **Money stored as integer cents, never floats.** Every price field
  (`basePriceCents`, `finalPriceCents`, `pickupFeeCents`,
  `priceAdjustCents`) is an `Int` in the schema, converted at the UI
  boundary via a single shared module (`src/lib/money.ts`). Summing option
  adjustments and subtracting a pickup fee in floating-point dollars is
  exactly the kind of arithmetic where `0.1 + 0.2 !== 0.3` silently
  corrupts a real payout; integer cents make that class of bug impossible.
- **Strict input validation on public, unauthenticated endpoints.** The
  booking endpoints are the only part of the system reachable from the open
  internet without auth, so every field is validated with Zod
  (`src/schemas/booking.ts`) — bounded string lengths, real email/phone/date
  formats, a discriminated union so `store` vs `pickup` bookings each
  require their own correct fields — plus a body-size guard
  (`src/lib/readJsonBody.ts`) before the payload ever touches Prisma.
- **In-place option syncing instead of delete-and-recreate.** Question
  template options keep stable IDs across edits, because recreating them
  would cascade-delete any per-variant price overrides pointing at the old
  IDs — i.e. saving a template with `isActive` toggled would silently wipe
  unrelated pricing customizations. Options are diffed and updated in
  place, only deleting the ones actually removed.

## 4. Demo

Live portfolio demo: [trade-in-omega.vercel.app](https://trade-in-omega.vercel.app)

The public catalogue is intentionally seeded with illustrative products,
original AI-generated device imagery, fictional branches/bookings, and
conservative sample prices. It is not a real trade-in business and the
displayed estimates are not commercial offers.

## 5. Test account

The admin dashboard is available at `/admin/login`, but this public deployment
does not display shared write credentials. To create an initial admin locally,
set `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and `ROOT_ADMIN_EMAIL`, then run
`npx prisma db seed`.

The seed is idempotent: it upserts the demo catalogue, pricing questions,
branches, and fictional dashboard bookings without deleting historical
bookings. It never ships a default password.

## 6. Architecture

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│   Public storefront (SSR)   │        │   Admin panel (protected)     │
│  (site)/…/[category]/[brand]│        │  admin/(protected)/…          │
│  /[product]/[condition]     │        │  categories, brands, products,│
│  /booking                   │        │  templates, branches,         │
└──────────────┬───────────────┘        │  bookings, settings, admins   │
               │                        └───────────────┬────────────────┘
               │ fetch                                   │ fetch (session-gated)
               ▼                                          ▼
        ┌─────────────────────────────────────────────────────────┐
        │                    Next.js API routes                    │
        │  /api/public/*        (no auth, Zod-validated, price      │
        │                         always re-derived server-side)    │
        │  /api/admin/*         (NextAuth session required)         │
        │  /api/auth/[...nextauth]  (credentials + bcrypt + JWT)    │
        └───────────────────────────┬────────────────────────────┘
                                     │ Prisma Client
                                     ▼
                          ┌────────────────────┐
                          │  Postgres (Neon)    │
                          │  Admin, Booking,     │
                          │  Category/Brand/     │
                          │  Product/Variant,     │
                          │  QuestionTemplate +   │
                          │  Options/Overrides,   │
                          │  DailyBookingCounter, │
                          │  Settings, Branch     │
                          └────────────────────┘

  Image uploads → Cloudinary        Emails (booking confirm/notify) → Resend
```

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 ·
Prisma 5 + Postgres (Neon) · NextAuth (credentials + JWT) · Zod · Cloudinary
· Resend · `@dnd-kit` for admin drag-to-reorder.

## 7. Key technical decisions

| Decision | Why |
|---|---|
| Integer cents over `Decimal`/`Float` for money | Simpler to reason about and control end-to-end (client and server both just do integer math) than `Decimal`, and immune to binary float rounding that `Float` has. |
| Per-day counter table over UUID booking refs | Staff need to read a booking ref aloud over the phone; UUIDs aren't usable for that, so the harder-but-necessary path was making sequential numbering safe under concurrency instead of giving up sequential numbering. |
| Price always recomputed server-side | The only price a customer can affect is *which options they pick* — never the number itself. Closes a direct financial exploit. |
| Zod discriminated unions for booking payloads | `store` and `pickup` appointments need different required fields (branch+visit date vs. address+collection date/time); a discriminated union enforces that at the type level, not just at runtime. |
| NextAuth JWT sessions + module augmentation | Avoids `as any` casts on `session.user` throughout the codebase by declaring the custom `id`/`role` fields once (`src/types/next-auth.d.ts`). |
| In-place option syncing (not delete+recreate) | Recreating rows would cascade-delete per-variant price overrides tied to old IDs, silently corrupting pricing data on unrelated edits. |

## 8. Screenshots

_Add screenshots here — e.g. drag PNGs into `docs/screenshots/` and reference
them below. (Auto-capture wasn't available in this session because the
screenshot tool couldn't persist images to disk; run the app locally and
capture manually.)_

```md
![Homepage — category selection](docs/screenshots/homepage.png)
![Product page — condition questions + live price](docs/screenshots/product.png)
![Booking confirmation](docs/screenshots/booking-confirmed.png)
![Admin dashboard](docs/screenshots/admin-dashboard.png)
![Admin — product/variant pricing](docs/screenshots/admin-product.png)
```

## 9. Running locally

**Prerequisites:** Node 20+, a Postgres database (this project was built
against [Neon](https://neon.tech)'s free tier), a [Cloudinary](https://cloudinary.com)
account (image uploads), and a [Resend](https://resend.com) API key (email —
optional, the app degrades gracefully if `notifyEmail` isn't set).

```bash
git clone https://github.com/AhHau92/trade-in.git
cd trade-in
npm install

cp .env.example .env
# fill in DATABASE_URL, NEXTAUTH_SECRET, admin seed values,
# Cloudinary, and Resend keys

npx prisma migrate deploy   # apply migrations
npx prisma db seed          # creates the root admin (see §5) + default settings

npm run dev
```

Then open `http://localhost:3000` for the storefront, or
`http://localhost:3000/admin/login` for the admin panel.

```bash
npm run lint    # ESLint — passes clean
npm run build   # production build + TypeScript typecheck
```

## 10. Known limitations

- **No automated test suite yet.** There's no `npm run test` script —
  correctness so far has been verified by hand (manual API/UI testing,
  including concurrency testing for the booking-ref race condition and a
  live price-tampering attempt via DevTools). Adding unit tests for
  `bookingPricing.ts` and the Zod schemas would be the natural next step.
- **Email sending uses Resend's sandbox sender** (`onboarding@resend.dev`),
  which only reliably delivers to the account owner's own verified email in
  Resend's free tier. Production use needs a verified custom sending domain.
- **Single hardcoded root admin** (`ROOT_ADMIN_EMAIL` in `src/lib/auth.ts`)
  who alone can change other admins' roles — fine for a small team, not a
  general permissions system.
- **No rate limiting** on the public booking/quote endpoints beyond a
  request body size cap; a determined attacker could still spam bookings.
- Built and tested primarily on macOS (darwin-arm64) with a Neon serverless
  Postgres backend; the Prisma engine and Next.js SWC binaries are
  platform-specific native binaries, so cross-platform dev environments
  (e.g. Linux ARM containers) may need `npm install` to fetch the matching
  native package before `npm run build` / `npx prisma migrate dev` work.

## 11. AI-assisted development

AI-assisted development tools were used for implementation acceleration,
while architecture, data modeling, business rules, validation strategy, and
testing decisions were designed and reviewed by me. In particular, the
server-authoritative pricing model, the atomic per-day booking-counter
design, the integer-cents money representation, and the Zod validation
strategy on public endpoints (§3 and §7 above) were deliberate design
choices made to close specific correctness/security problems, not default
scaffolding.
