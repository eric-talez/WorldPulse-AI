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
- Optional news stream env: `NEWS_STREAM_INTERVAL_MIN` (default 15), `NEWS_STREAM_BATCH` (default 4), `NEWS_STREAM_RETENTION_DAYS` (default 30 — streamed `issues` rows with `source_url` are pruned beyond this window; seeded items with `source_url IS NULL` are kept), `NEWS_STREAM_DISABLED=1` to disable
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
- DB schema: `lib/db/src/schema/` — `countries`, `cities`, `issues`, `jobReports`, `forumPosts`, `forumReplies`, `countryBanners`, `forecasts`, `users`, `paymentSessions`, `subscriptions` (issues/jobReports carry a `planet` column, default `'earth'`; issues carry an optional `cityId`; both payment tables are provider-agnostic with a `provider` column = `paypal`|`stripe`)
- API routes: `artifacts/api-server/src/routes/` — `countries`, `cities` (`/countries/:code/cities`, `/cities/:id/issues`), `issues` (`/issues`, `/issues/summary`, `/issues/:id` — `summary` route is registered before `:id` so Express matches it first), `jobs`, `forum`, `dashboard`, `planets`, `forecasts`, `countryBanners`, `auth`, `payments`, `health`
- City seed data: `artifacts/api-server/src/lib/citiesSeed.ts` (~55 cities + ~95 city-tagged issues across 14 countries)
- Planet catalog (Earth/Moon/Mars + Moon & Mars locations + NASA Trek imagery URLs + space-only signal categories): `artifacts/api-server/src/lib/planets.ts`
- Auth/payments libs: `artifacts/api-server/src/lib/` — `session.ts` (HMAC-signed cookie session + nonce), `paypal.ts` (REST client + webhook verify), `stripe.ts` + `stripeClient.ts` (Replit-connector-backed client + Checkout sessions + webhook verify), `userTier.ts` (user upsert + tier helpers)
- Frontend auth: `artifacts/futuremap/src/lib/auth.tsx` (AuthProvider, useAuth), `lib/wallet.ts` (window.ethereum + viem), `components/layout/WalletButton.tsx`
- Job analysis heuristic: `artifacts/api-server/src/lib/jobAnalysis.ts` — keyword classify (tax/dev/nurse/marketing/designer/default) → JobProfile; space planets route through `analyzeSpaceJob()` with SPACE_PROFILES (space_construction/geology/robotics/agriculture/default) and `PLANET_LOCATION_CONTEXT_KO`
- Frontend pages: `artifacts/futuremap/src/pages/` — `Home` (globe + signal stream), `JobReport`, `Forum`, `About`
- Frontend i18n: `artifacts/futuremap/src/lib/language.tsx`
- Reference mockup (canvas): `artifacts/mockup-sandbox/src/components/mockups/futuremap/FutureMap.tsx`

## Architecture decisions

- CesiumJS is loaded via CDN script tags at runtime (not as an npm dep) — its Vite integration is fragile. Init is wrapped in a WebGL pre-flight + capture-phase error swallow so it degrades gracefully on headless/no-WebGL clients.
- Earth uses cinematic atmospherics with **no ion token required**: built-in starfield skyBox, sky atmosphere shell with tinted hue/saturation, sun-direction `dynamicAtmosphereLighting`, HDR tonemapping (`scene.highDynamicRange`), distance fog, and a second imagery layer overlay (ESRI `World_Boundaries_and_Places`, alpha 0.85) for country borders, place names, and roads. Moon/Mars deliberately keep `skyBox: false` and `skyAtmosphere: false` to read as airless. True 3D world terrain (`createWorldTerrainAsync`) and Cesium OSM Buildings require a Cesium ion access token — not enabled.
- Earth realism stack (chosen for the "photo-of-Earth" look without ion or paid tiles): `globe.enableLighting = true` + `dynamicAtmosphereLighting` for a real sun-driven day/night terminator, base ESRI imagery layer dimmed on the night side via `nightAlpha = 0.45` so continents stay readable, and a NASA GIBS `VIIRS_CityLights_2012` overlay added with `dayAlpha = 0` / `nightAlpha = 1` so the night hemisphere lights up with city lights instead of going black. Atmosphere shell hue/saturation/fog density are tuned for the now-lit Earth (slightly less brightness shift, slightly thinner fog). Lighting is Earth-only — Moon/Mars stay on flat shading so the whole airless body is visible at once.
- Pin occlusion: every globe entity (country/city pins on Earth, location/site pins on Moon & Mars, plus their labels) used to set `disableDepthTestDistance: Number.POSITIVE_INFINITY`, which made far-side pins bleed through the sphere. Those overrides are removed and a single `Cesium.EllipsoidalOccluder` is consulted in the viewer's `preRender` (throttled to ~30fps) to toggle `entity.show` per-frame. Because depth testing is now active, simply leaving a selected pin's `show = true` is not enough — the globe still occludes it. So when the currently selected entity (matched against `selectedCityIdRef`/`selectedCountryCodeRef`/`selectedLocationCodeRef`) rotates behind the horizon, the listener auto-flies the camera back to face it (debounced to 2s so we don't fight the user's drag). The pin's pixel size is also shrunk to 6px while occluded, with the original size stashed on `entity._fmFullSize` and restored on the next visible frame.
- The viewer is fully torn down and rebuilt on planet switch, with a per-planet `Cesium.Ellipsoid(r,r,r)` (Moon 1,737,400m / Mars 3,396,000m) and a `UrlTemplateImageryProvider`. Earth uses **ESRI World Imagery** (public, no ion token, WebMercator); Moon/Mars use **NASA Trek WMTS** tiles with `GeographicTilingScheme` + `maximumLevel: 7`. Each provider's `errorEvent` is wired to log once and degrade to the per-planet `globe.baseColor`. Never pass `imageryProvider: false` for a planet you actually want imagery on — that disables the default base layer and leaves a flat-colored sphere. Atmosphere/lighting are Earth-only. The Earth `baseLayer` color tweaks (`brightness/contrast/saturation/gamma`) are tuned **for ESRI's natural-color tiles** — if you swap the Earth imagery source, retune these values or continents will crush down to the same blue as the ocean.
- Job future analysis is a deterministic keyword-based heuristic, not an LLM call — keeps the platform offline-friendly and instant. Country-specific opportunities are templated per ISO code with a default fallback. When the request carries a non-Earth `planet`, we instead pick from `SPACE_PROFILES` and the per-location `PLANET_LOCATION_CONTEXT_KO` opportunities.
- Country detail page derives top-risk / top-growth jobs from the running average of recent `jobReports` for that country, with a curated fallback list when no reports exist yet.
- Bilingual UI is client-side only — Korean strings are the primary copy and sit alongside English in a small dictionary in `lib/language.tsx`. Country `nameKo` is also persisted in the DB.
- Auth = SIWE-style wallet sign-in. Nonce is issued in an HMAC-signed httpOnly cookie (so the server is stateless), the wallet signs a SIWE message containing the nonce, and the server verifies via viem's `verifyMessage`. Session is a separate signed cookie carrying the lowercase wallet address. No `siwe` npm package — it pulls ethers as a peer dep; rolling our own SIWE message is two dozen lines.
- Payments = Stripe (primary) + PayPal (secondary), provider-agnostic in the DB. Stripe uses Checkout (Apple/Google Pay come for free via Checkout's native support) — frontend just `window.location.href`s to the returned `session.url`, then on the success-redirect calls `/api/payments/stripe/sessions/:id/confirm` for an authoritative server-verified upgrade. The Stripe webhook is the source of truth and is mounted at `/api/payments/stripe/webhook` BEFORE `express.json()` so signature verification has the raw body (uses `STRIPE_WEBHOOK_SECRET`). Stripe credentials are pulled fresh per call from the Replit connector — never cache the Stripe client. PayPal still uses its REST API + `@paypal/react-paypal-js` for buttons. Both providers return availability flags from `/payments/config` so the UI can hide unsupported flows.

## Product

- `/` — 3D globe with click-only drilldown: planet → country → city → event. Country pins colored by risk; clicking a country flies to ~1,500km, loads city pins; clicking a city flies to ~50km and shows the city's signals; clicking an event flies to ~25km and opens the event detail. Top-center breadcrumb shows the current path and each crumb is clickable to jump back. Bottom-right control cluster: Home (return to whole planet), Back (one level up), Zoom +/−. URL is kept in sync via `?planet=&country=&city=&location=&issue=`. When WebGL is unavailable the page falls back to a hierarchical click-only list (countries → cities → events). Live signal stream of recent issues, filterable by category. Stats ribbon (countries / issues today / reports generated).
- `/job` — Type a job + pick a country → AI future report (automation risk %, growth %, automated tasks, human strengths, future changes, recommended skills, country-specific opportunities). Recently generated reports rail.
- `/forum` — Country-segmented discussion board with post composer. When a country tab is selected, active banners for that country render above the post list (admin-managed at `/admin`). Posts open a dialog with full body, threaded replies (대댓글, indented up to 4 levels), and inline composers for top-level + nested replies.
- `/admin` — Admin console (login at `/admin/login`, gated by `ADMIN_EMAIL`/`ADMIN_PASSWORD` env, defaults `admin@futuremap.ai` / `futuremap-admin`). Tabs: dashboard (signups timeseries, forum stats, per-country activity), `/admin/users` (search + paginate, detail page with posts/comments), `/admin/forum` (filter by country/author/date, view post + comments, soft-delete posts/replies), `/admin/banners` (country banner CRUD). All `/admin/*` server endpoints are gated by an HMAC-signed `fm_admin` cookie except `/admin/auth/login|logout|me`. Forum posts/replies carry `userId` (lowercase wallet) populated from the session cookie at create time.
- `/about` — Manifesto + pricing tiers (Free / Pro / Enterprise) with Stripe Checkout (primary) + PayPal (secondary), gated on wallet sign-in.
- Header — wallet connect button (MetaMask et al.) showing short address + tier badge once signed in.

## User preferences

- Bilingual KO/EN with Korean as the default and primary copy. Korean strings should feel native (short, punchy headlines), not awkward translations.
- Dark cinematic intelligence-room aesthetic — globe is the hero.

## Tests

- `artifacts/futuremap/tests/payments-flow.test-plan.md` — runnable test plan for the wallet/SIWE + Stripe checkout flow. Feed it to the testing skill (`runTest`) to re-cover the `/about` CTA gating, browser-driven SIWE login, and the Stripe checkout 401/200 branches.

## Gotchas

- After editing `lib/db/src/schema/`, run `pnpm run typecheck:libs` before typechecking artifacts; the `@workspace/db` declarations need to be rebuilt for downstream packages.
- CesiumJS errors must stay swallowed by the capture-phase listener in `Home.tsx` — without it, Vite's runtime overlay trips on internal Cesium warnings.
- The Replit headless screenshot tool reports `WebGL unavailable`, which is expected — the page falls back gracefully and real browsers render the globe correctly.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
