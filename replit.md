# FutureMap AI

A bilingual (KO/EN) global issue map and AI-driven job future report platform. Users explore a 3D globe of world events, then ask "what happens to my job in this country?" and get a heuristic AI report on automation risk, growth, and recommended skills.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server
- `pnpm --filter @workspace/futuremap run dev` — frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required secret: `SESSION_SECRET` — HMAC key for signed auth/nonce cookies
- Optional PayPal env (gracefully disabled if missing): `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_ENV` (`sandbox`|`live`, default sandbox), `PAYPAL_PLAN_ID_PRO`, `PAYPAL_PLAN_ID_ENTERPRISE`
- Optional Stripe env: secret key/publishable come from the Replit Stripe integration (no env vars needed); set `STRIPE_WEBHOOK_SECRET` for webhook signature verification, and `STRIPE_PRICE_ID_PRO` / `STRIPE_PRICE_ID_ENTERPRISE` to enable monthly subscriptions (one-time payments work without them via inline price_data)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Frontend: React + Vite + TanStack Query + wouter + Tailwind + CesiumJS (CDN)

## Where things live

- API spec: `lib/api-spec/openapi.yaml` (single source of truth)
- DB schema: `lib/db/src/schema/` — `countries`, `issues`, `jobReports`, `forumPosts`, `users`, `paymentSessions`, `subscriptions` (both payment tables are provider-agnostic with a `provider` column = `paypal`|`stripe`)
- API routes: `artifacts/api-server/src/routes/` — `countries`, `issues`, `jobs`, `forum`, `dashboard`, `health`, `auth`, `payments`
- Auth/payments libs: `artifacts/api-server/src/lib/` — `session.ts` (HMAC-signed cookie session + nonce), `paypal.ts` (REST client + webhook verify), `stripe.ts` + `stripeClient.ts` (Replit-connector-backed client + Checkout sessions + webhook verify), `userTier.ts` (user upsert + tier helpers)
- Frontend auth: `artifacts/futuremap/src/lib/auth.tsx` (AuthProvider, useAuth), `lib/wallet.ts` (window.ethereum + viem), `components/layout/WalletButton.tsx`
- Job analysis heuristic: `artifacts/api-server/src/lib/jobAnalysis.ts` — keyword classify (tax/dev/nurse/marketing/designer/default) → JobProfile
- Frontend pages: `artifacts/futuremap/src/pages/` — `Home` (globe + signal stream), `JobReport`, `Forum`, `About`
- Frontend i18n: `artifacts/futuremap/src/lib/language.tsx`
- Reference mockup (canvas): `artifacts/mockup-sandbox/src/components/mockups/futuremap/FutureMap.tsx`

## Architecture decisions

- CesiumJS is loaded via CDN script tags at runtime (not as an npm dep) — its Vite integration is fragile. Init is wrapped in a WebGL pre-flight + capture-phase error swallow so it degrades gracefully on headless/no-WebGL clients.
- Job future analysis is a deterministic keyword-based heuristic, not an LLM call — keeps the platform offline-friendly and instant. Country-specific opportunities are templated per ISO code with a default fallback.
- Country detail page derives top-risk / top-growth jobs from the running average of recent `jobReports` for that country, with a curated fallback list when no reports exist yet.
- Bilingual UI is client-side only — Korean strings are the primary copy and sit alongside English in a small dictionary in `lib/language.tsx`. Country `nameKo` is also persisted in the DB.
- Auth = SIWE-style wallet sign-in. Nonce is issued in an HMAC-signed httpOnly cookie (so the server is stateless), the wallet signs a SIWE message containing the nonce, and the server verifies via viem's `verifyMessage`. Session is a separate signed cookie carrying the lowercase wallet address. No `siwe` npm package — it pulls ethers as a peer dep; rolling our own SIWE message is two dozen lines.
- Payments = Stripe (primary) + PayPal (secondary), provider-agnostic in the DB. Stripe uses Checkout (Apple/Google Pay come for free via Checkout's native support) — frontend just `window.location.href`s to the returned `session.url`, then on the success-redirect calls `/api/payments/stripe/sessions/:id/confirm` for an authoritative server-verified upgrade. The Stripe webhook is the source of truth and is mounted at `/api/payments/stripe/webhook` BEFORE `express.json()` so signature verification has the raw body (uses `STRIPE_WEBHOOK_SECRET`). Stripe credentials are pulled fresh per call from the Replit connector — never cache the Stripe client. PayPal still uses its REST API + `@paypal/react-paypal-js` for buttons. Both providers return availability flags from `/payments/config` so the UI can hide unsupported flows.

## Product

- `/` — 3D globe with country pins colored by risk score; click a pin → country panel with summary, top automation-risk jobs, top growth jobs. Live signal stream of recent issues, filterable by category (news / conflict / disease / politics / economy / culture / ai_jobs / tech). Stats ribbon (countries / issues today / reports generated).
- `/job` — Type a job + pick a country → AI future report (automation risk %, growth %, automated tasks, human strengths, future changes, recommended skills, country-specific opportunities). Recently generated reports rail.
- `/forum` — Country-segmented discussion board with post composer.
- `/about` — Manifesto + pricing tiers (Free / Pro / Enterprise) with PayPal checkout (monthly subscription or one-time) gated on wallet connection.
- Header — wallet connect button (MetaMask et al.) showing short address + tier badge once signed in.

## User preferences

- Bilingual KO/EN with Korean as the default and primary copy. Korean strings should feel native (short, punchy headlines), not awkward translations.
- Dark cinematic intelligence-room aesthetic — globe is the hero.

## Gotchas

- After editing `lib/db/src/schema/`, run `pnpm run typecheck:libs` before typechecking artifacts; the `@workspace/db` declarations need to be rebuilt for downstream packages.
- CesiumJS errors must stay swallowed by the capture-phase listener in `Home.tsx` — without it, Vite's runtime overlay trips on internal Cesium warnings.
- The Replit headless screenshot tool reports `WebGL unavailable`, which is expected — the page falls back gracefully and real browsers render the globe correctly.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
