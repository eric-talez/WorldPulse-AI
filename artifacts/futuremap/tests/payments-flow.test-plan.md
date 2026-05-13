# Payments + Wallet Flow — Automated UI Test Plan

This is the persistent test plan for the FutureMap payments + wallet (SIWE)
flow. Feed it to the `testing` skill (`runTest`) to re-run end-to-end coverage.

## How to run

In an agent session:

```js
const fs = await import("node:fs/promises");
const testPlan = await fs.readFile(
  "artifacts/futuremap/tests/payments-flow.test-plan.md",
  "utf8",
);
const result = await runTest({ testPlan });
console.log(result.status, result.testOutput);
```

Both the `artifacts/futuremap: web` and `artifacts/api-server: API Server`
workflows must be running. The browser context signs SIWE messages by
dynamically importing viem from `https://esm.sh/viem@2/accounts`, so the
sandbox needs outbound network access (the standard testing environment has
this).

## What it covers

- **Test A** — `/about` shows the wallet-gated CTA on Pro / Enterprise plans
  when the visitor is not signed in, and the Free CTA stays enabled.
- **Test B** — Browser-driven SIWE login using the well-known Hardhat/Anvil
  test account #1, then `GET /api/auth/me` returns the lowercase wallet
  address and `free` tier.
- **Test C** — `POST /api/payments/stripe/checkout` returns `401 "Not
  authenticated"` without a session cookie, and `200 {id, url}` (or `503`
  when Stripe credentials are missing) with the authenticated session cookie
  from Test B.

---

Goal: Cover FutureMap payments + wallet flow end-to-end, signing inside the
browser via `page.evaluate` (esm.sh) since the Node-side test runtime cannot
dynamic-import viem.

Constants:
  PRIVATE_KEY = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
  ADDRESS     = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
  ADDRESS_LC  = 0x70997970c51812dc3a010c7d01b50e0d17dc79c8

──────────────── TEST A — wallet-gated CTA on /about ────────────────

A1. [New Context] Fresh browser context. No window.ethereum, no cookies.
A2. [Browser] Navigate to /about and wait for it to load.
A3. [Verify]
    - Three pricing cards titled "무료", "Pro", "Enterprise" are rendered.
    - Pro card CTA button text === "지갑 연결 후 선택" OR "Connect Wallet to Choose".
    - Enterprise card CTA button text === "지갑 연결 후 선택" OR "Connect Wallet to Choose".
    - Free card CTA text === "선택하기" OR "Choose Plan", and is enabled (not disabled).
    - The "결제 방식 선택" / "Choose Payment Type" dialog is NOT open.

──────────────── TEST B — SIWE login (browser-driven) + /auth/me ────────────────

Use the SAME browser context for all of B (so cookies persist between page.request calls).

B1. [Browser] Navigate to /about so a page is loaded for page.evaluate.
B2. [Browser] Drive the SIWE flow inside the page using a single page.evaluate that:
    a) fetch('/api/auth/nonce', { method:'POST', credentials:'include',
         headers:{'Content-Type':'application/json'},
         body: JSON.stringify({ walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' }) })
       → parse JSON, capture { message }. Assert response.ok.
    b) Inside the page:
         const { privateKeyToAccount } = await import('https://esm.sh/viem@2/accounts');
         const account = privateKeyToAccount('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d');
         const signature = await account.signMessage({ message });
    c) fetch('/api/auth/verify', { method:'POST', credentials:'include',
         headers:{'Content-Type':'application/json'},
         body: JSON.stringify({ message, signature }) }) → parse JSON. Assert response.ok.
    d) Return { verifyStatus, verifyJson } back to the test runner.
B3. [Verify]
    - verifyStatus === 200
    - verifyJson.walletAddress === ADDRESS_LC
    - verifyJson.tier === "free"

B4. [Browser] In the same context, page.evaluate fetch('/api/auth/me', { credentials:'include' }) → parse JSON.
B5. [Verify]
    - HTTP 200
    - response.user is non-null
    - response.user.walletAddress === ADDRESS_LC
    - response.user.tier === "free"

──────────────── TEST C — Stripe Checkout: 401 unauth, 200/503 authed ────────────────

C1. [New Context] Brand-new browser context with no cookies. Navigate to /about, then page.evaluate:
       const r = await fetch('/api/payments/stripe/checkout', { method:'POST', credentials:'include',
                              headers:{'Content-Type':'application/json'},
                              body: JSON.stringify({ plan:'pro', mode:'one_time',
                                                    successUrl:'https://example.com/s',
                                                    cancelUrl:'https://example.com/c' }) });
       return { status: r.status, body: await r.json() };
    Assert status === 401 and body.error === "Not authenticated".

C2. Reuse the AUTHED context from Test B. Same fetch as C1.
    Assert status is 200 OR 503.
      • 200 → body.id is a non-empty string and body.url starts with "https://".
      • 503 → body.error mentions "stripe" or "configured" (case-insensitive).
    Either branch is a PASS for this test (the dev environment may or may not
    have Stripe credentials wired). Report which branch occurred.

──────────────── Final report ────────────────

Overall PASS only if every assertion in A, B, and C passes.
For any failure: capture a screenshot of the relevant browser state and
include the failing fetch's status + JSON body in the report.

──────────────── Relevant technical context ────────────────

- Frontend at "/" via the proxy. API at "/api/*" same origin, so
  credentials: 'include' inside page.evaluate is sufficient for cookies.
- Auth endpoints (artifacts/api-server/src/routes/auth.ts):
    POST /api/auth/nonce  body { walletAddress } → { nonce, message } + Set-Cookie fm_nonce (httpOnly)
    POST /api/auth/verify body { message, signature } (needs fm_nonce cookie) → CurrentUser JSON + Set-Cookie fm_session (httpOnly)
    GET  /api/auth/me     → { user: CurrentUser | null }
- The server validates the personal_sign signature over the EXACT 'message'
  string returned by /auth/nonce using viem.verifyMessage. Sign that string
  verbatim with viem.account.signMessage({ message }).
- Payments (artifacts/api-server/src/routes/payments.ts):
    POST /api/payments/stripe/checkout — requireAuth → 401
    {"error":"Not authenticated"} when no fm_session.
    Body: { plan: "pro"|"enterprise", mode: "subscription"|"one_time",
            successUrl: string, cancelUrl: string }.
    Success → 200 { id, url }. Stripe missing → 503 { error }.
- About page: artifacts/futuremap/src/pages/About.tsx. Pricing cards titled
  "무료" / "Pro" / "Enterprise"; one CTA <button> per card. CTA text when
  user is null: "지갑 연결 후 선택" / "Connect Wallet to Choose" for
  Pro/Enterprise.
- Hardhat/Anvil test account #1: priv
  0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d → addr
  0x70997970C51812dc3A010C7d01b50e0d17dc79C8. Server lowercases the address.
- esm.sh ships browser-ready ESM bundles for npm packages;
  `await import('https://esm.sh/viem@2/accounts')` inside a page.evaluate
  works with no app changes.
