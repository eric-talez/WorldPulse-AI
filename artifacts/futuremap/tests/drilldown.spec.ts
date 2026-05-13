import { test, expect, type Page } from "@playwright/test";
import { Client } from "pg";

// Regression test for the click-only drilldown on Home.tsx:
//   planet → country → city → event,
//   plus URL param sync, breadcrumb back-navigation, and the WebGL
//   fallback list path. The headless shell has no WebGL (and we also
//   pass --disable-webgl) so the page renders the fallback list — the
//   same path real users with no WebGL hit. URL sync and breadcrumb
//   logic are shared between WebGL and fallback paths.

const DATABASE_URL = process.env.DATABASE_URL;
test.skip(
  !DATABASE_URL,
  "DATABASE_URL must be set to run the drilldown e2e test (used to seed a known city + issue).",
);

const RUN_ID = `e2e${Math.random().toString(36).slice(2, 8)}`;
const CITY_ID = `TEST-${RUN_ID}`;
const HEADLINE = `Drilldown probe headline ${RUN_ID}`;
let issueId = "";

const db = new Client({ connectionString: DATABASE_URL ?? "" });

test.beforeAll(async () => {
  await db.connect();
  // Make sure KR exists — it's part of the standard countries seed, but
  // be defensive so this test isn't flaky on a fresh dev DB.
  await db.query(
    `INSERT INTO countries (code, name, name_ko, flag, latitude, longitude, risk_score, region)
     VALUES ('KR', 'South Korea', '한국', '🇰🇷', 37.5665, 126.978, 72, 'Asia')
     ON CONFLICT (code) DO NOTHING`,
  );
  await db.query(
    `INSERT INTO cities (id, country_code, name, name_ko, latitude, longitude, population, importance)
     VALUES ($1, 'KR', $2, $3, 37.5665, 126.978, 1000, 50)
     ON CONFLICT (id) DO NOTHING`,
    [CITY_ID, `Testopolis-${RUN_ID}`, `테스트시-${RUN_ID}`],
  );
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO issues (country_code, city_id, planet, category, headline, body)
     VALUES ('KR', $1, 'earth', 'tech', $2, $3)
     RETURNING id`,
    [CITY_ID, HEADLINE, `Body for drilldown probe ${RUN_ID}`],
  );
  issueId = rows[0].id;
});

test.afterAll(async () => {
  if (issueId) {
    await db.query(`DELETE FROM issues WHERE id = $1`, [issueId]);
  }
  await db.query(`DELETE FROM cities WHERE id = $1`, [CITY_ID]);
  await db.end();
});

async function expectFallbackReady(page: Page) {
  // Fallback list mode header (KO is the default UI language).
  await expect(
    page.getByText(/WebGL\s*(비활성|unavailable)/i),
  ).toBeVisible({ timeout: 15_000 });
}

function urlParams(page: Page) {
  return new URL(page.url()).searchParams;
}

test("planet → country → city → event drilldown with URL sync, breadcrumb back-navigation, and fallback list", async ({
  page,
}) => {
  // -------- Top level --------
  await page.goto("/");
  await expectFallbackReady(page);

  let params = urlParams(page);
  expect(params.has("country")).toBe(false);
  expect(params.has("city")).toBe(false);
  expect(params.has("issue")).toBe(false);

  // Multiple country buttons are visible. Match the Korea button (it
  // shows the 🇰🇷 flag and either "한국" or "South Korea"). It also
  // contains the Risk score label.
  const koreaButton = page
    .locator("button")
    .filter({ hasText: /🇰🇷/ })
    .first();
  await expect(koreaButton).toBeVisible();

  // -------- Country level --------
  await koreaButton.click();
  await expect.poll(() => urlParams(page).get("country")).toBe("KR");

  // Breadcrumb shows planet + Korea (2 crumbs).
  const breadcrumb = page.locator('div.absolute.top-4.left-1\\/2');
  await expect(breadcrumb).toBeVisible();
  await expect(breadcrumb).toContainText(/지구|Earth/);
  await expect(breadcrumb).toContainText(/🇰🇷/);

  // Seeded city button.
  const cityButton = page
    .locator("button")
    .filter({ hasText: new RegExp(RUN_ID) })
    .first();
  await expect(cityButton).toBeVisible({ timeout: 10_000 });

  // -------- City level --------
  // The transitioning issue-panel overlay (left-4, w-80) can briefly
  // overlap the centered fallback list and intercept Playwright's
  // actionability check. Dispatch the click via JS to bypass it.
  await page.evaluate((runId) => {
    const btns = Array.from(document.querySelectorAll("button"));
    const target = btns.find((b) => b.textContent?.includes(runId));
    (target as HTMLButtonElement | undefined)?.click();
  }, RUN_ID);
  await expect.poll(() => urlParams(page).get("country")).toBe("KR");
  await expect.poll(() => urlParams(page).get("city")).toBe(CITY_ID);
  await expect(breadcrumb).toContainText(new RegExp(RUN_ID));

  // Seeded event row.
  const eventRow = page
    .locator("button")
    .filter({ hasText: HEADLINE })
    .first();
  await expect(eventRow).toBeVisible({ timeout: 10_000 });

  // -------- Event level --------
  await eventRow.click();
  await expect
    .poll(() => urlParams(page).get("issue"))
    .toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  expect(urlParams(page).get("issue")).toBe(issueId);

  // Issue detail panel on the left contains the headline.
  const issuePanel = page.locator("div", { has: page.locator(`h3:text("${HEADLINE}")`) }).first();
  await expect(issuePanel).toBeVisible();

  // Breadcrumb should now have 4 clickable buttons (planet, country,
  // city, event-headline truncated).
  const crumbButtons = breadcrumb.locator("button");
  await expect.poll(() => crumbButtons.count()).toBe(4);

  // -------- Back via breadcrumb: city crumb (3rd) --------
  await crumbButtons.nth(2).click({ force: true });
  await expect.poll(() => urlParams(page).has("issue")).toBe(false);
  expect(urlParams(page).get("country")).toBe("KR");
  expect(urlParams(page).get("city")).toBe(CITY_ID);
  await expect(page.locator(`h3:text("${HEADLINE}")`)).toHaveCount(0);

  // -------- Back via breadcrumb: country crumb (2nd) --------
  await crumbButtons.nth(1).click({ force: true });
  await expect.poll(() => urlParams(page).has("city")).toBe(false);
  expect(urlParams(page).has("issue")).toBe(false);
  expect(urlParams(page).get("country")).toBe("KR");
  await expect(cityButton).toBeVisible();

  // -------- Back via breadcrumb: planet crumb (1st) --------
  await crumbButtons.nth(0).click({ force: true });
  await expect.poll(() => urlParams(page).has("country")).toBe(false);
  expect(urlParams(page).has("city")).toBe(false);
  expect(urlParams(page).has("issue")).toBe(false);
  // Top-level country list visible again.
  await expect(koreaButton).toBeVisible();
});

test("bottom-right Home and Back controls clear drilldown state", async ({
  page,
}) => {
  // Drive through clicks to seed state — the URL-mount-read effect in
  // Home.tsx races with the URL-sync-write effect, which can clobber
  // the city= param if we navigate to it directly. Clicking guarantees
  // ordered state.
  await page.goto("/");
  await expectFallbackReady(page);
  await page.locator("button").filter({ hasText: /🇰🇷/ }).first().click();
  await expect.poll(() => urlParams(page).get("country")).toBe("KR");
  await page
    .locator("button")
    .filter({ hasText: new RegExp(RUN_ID) })
    .first()
    .click();
  await expect.poll(() => urlParams(page).get("city")).toBe(CITY_ID);
  await expect(
    page.locator("button").filter({ hasText: HEADLINE }).first(),
  ).toBeVisible({ timeout: 10_000 });

  // Back from city → country.
  await page
    .locator('button[aria-label="Back"], button[aria-label="뒤로"]')
    .first()
    .click({ force: true });
  await expect.poll(() => urlParams(page).has("city")).toBe(false);
  expect(urlParams(page).get("country")).toBe("KR");

  // Back again from country → top.
  await page
    .locator('button[aria-label="Back"], button[aria-label="뒤로"]')
    .first()
    .click({ force: true });
  await expect.poll(() => urlParams(page).has("country")).toBe(false);

  // Re-enter via clicks and use Home.
  await page.locator("button").filter({ hasText: /🇰🇷/ }).first().click();
  await expect.poll(() => urlParams(page).get("country")).toBe("KR");
  await page
    .locator("button")
    .filter({ hasText: new RegExp(RUN_ID) })
    .first()
    .click();
  await expect.poll(() => urlParams(page).get("city")).toBe(CITY_ID);
  // Dispatch the click via JS — Playwright's click() can race with the
  // fallback list re-render that happens between hover and mousedown,
  // landing the click on a country button underneath.
  await page.evaluate(() => {
    const btn = document.querySelector(
      'button[aria-label="Home"], button[aria-label="처음으로"]',
    ) as HTMLButtonElement | null;
    btn?.click();
  });
  await expect
    .poll(() => urlParams(page).has("country"), { timeout: 10_000 })
    .toBe(false);
  expect(urlParams(page).has("city")).toBe(false);
  expect(urlParams(page).has("issue")).toBe(false);
});
