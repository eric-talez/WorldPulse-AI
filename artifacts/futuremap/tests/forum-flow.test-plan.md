# Forum Post + Reply Flow — Automated UI Test Plan

This is the persistent test plan for the FutureMap forum surface (post creation,
country segmentation, threaded replies). Feed it to the `testing` skill
(`runTest`) to re-run end-to-end coverage.

## How to run

In an agent session:

```js
const fs = await import("node:fs/promises");
const testPlan = await fs.readFile(
  "artifacts/futuremap/tests/forum-flow.test-plan.md",
  "utf8",
);
const result = await runTest({ testPlan });
console.log(result.status, result.testOutput);
```

Both the `artifacts/futuremap: web` and `artifacts/api-server: API Server`
workflows must be running. No wallet / SIWE login is needed — `/api/forum/*`
accepts unauthenticated writes (the session, when present, is just stamped
onto `userId`).

## What it covers

- **Test A** — Creating a forum post under a specific country tab makes the
  post appear in that country's list (and not in another country's list),
  proving country-segmented filtering works end-to-end.
- **Test B** — Opening a post dialog, adding a top-level reply, then adding
  a nested reply (대댓글) renders both at the correct indent depth and
  bumps the post's reply count.

---

Goal: Cover the FutureMap forum end-to-end via the real UI in
`artifacts/futuremap/src/pages/Forum.tsx`, going through the same React
Query hooks the user does. The forum page is mounted at `/forum`.

Test data (use timestamps so re-runs do not collide):
  RUN_ID         = `Date.now().toString(36)` evaluated once at the top of
                   each test, e.g. `lqj4t8a2`.
  POST_TITLE     = `E2E Forum Post ${RUN_ID}`
  POST_BODY      = `Automated test body ${RUN_ID}`
  POST_AUTHOR    = `tester-${RUN_ID}`
  REPLY_BODY     = `top-level reply ${RUN_ID}`
  REPLY_AUTHOR   = `replier-${RUN_ID}`
  NESTED_BODY    = `nested reply ${RUN_ID}`
  NESTED_AUTHOR  = `nested-${RUN_ID}`

──────────────── TEST A — create a post under a country tab ────────────────

A1. [New Context] Fresh browser context. Navigate to `/forum` and wait for
    the page to be interactive (the heading "글로벌 인사이트 포럼" /
    "Global Insight Forum" is visible, and the country tab strip has
    rendered at least one country button next to the "🌐 글로벌" /
    "🌐 Global" tab).

A2. [Browser] In the country tab strip, find the FIRST country tab AFTER
    the "글로벌" / "Global" tab (it is the first `<button>` inside the
    tab strip whose text does NOT start with "🌐"). Read its visible
    text into TARGET_COUNTRY_LABEL and click it. The clicked button must
    end up with the active styling (its className contains
    `border-primary` and `text-primary`). Also pick a SECOND distinct
    country tab and read its label into OTHER_COUNTRY_LABEL — do NOT
    click it yet.

A3. [Browser] In the right-hand "새 포스트 작성" / "Create New Post"
    card, fill the form:
      - 작성자명 / Author name input → POST_AUTHOR
      - 제목 / Title input          → POST_TITLE
      - 내용 / body textarea         → POST_BODY
    Then click the submit button (its accessible name is "등록하기" /
    "Post"). It must NOT be disabled at click time. Wait for the
    submit button to leave its "작성 중..." / "Posting..." pending
    state and for the title and body fields to be cleared (the page
    clears them onSuccess).

A4. [Verify under TARGET_COUNTRY_LABEL]
    - A `Card` whose `<h3>` text equals POST_TITLE is now visible in
      the post list.
    - That same card contains the POST_AUTHOR string and the text
      "0 답글" or "0 replies".

A5. [Browser] Click the OTHER_COUNTRY_LABEL tab.
A6. [Verify under OTHER_COUNTRY_LABEL]
    - No card with `<h3>` text equal to POST_TITLE is visible (i.e.
      the post is country-segmented, not global). If the other-country
      list is empty, the empty-state text "포스트가 없습니다." /
      "No posts found." being rendered is also a PASS for this
      assertion.

──────────────── TEST B — top-level reply + nested reply ────────────────

Reuse the same browser context as Test A (the post created in A is the
target post for B).

B1. [Browser] Click the TARGET_COUNTRY_LABEL tab again to make the new
    post visible, then click the post card whose `<h3>` text equals
    POST_TITLE. A dialog opens whose title equals POST_TITLE (the
    `<h2>` inside `[role="dialog"]`).

B2. [Browser] Inside the dialog, find the bottom composer (the one
    rendered when no reply is being targeted — its placeholder is
    "댓글을 입력하세요..." / "Write a reply..."). Fill:
      - "작성자명" / "Your name" input → REPLY_AUTHOR
      - reply textarea                  → REPLY_BODY
    Click the button whose accessible name is "댓글 달기" /
    "Post reply". Wait for the textarea to be cleared (onSuccess).

B3. [Verify top-level reply]
    - A reply block inside the dialog now shows REPLY_AUTHOR and
      REPLY_BODY.
    - That reply block's outer wrapper (the `<div>` with
      `style="margin-left: 0px"` — depth 0) is the ancestor of the
      REPLY_BODY text. Read its inline style and assert
      `marginLeft === "0px"`.
    - The reply-count header inside the dialog now reads "1 답글" or
      "1 replies".

B4. [Browser] Inside the just-rendered top-level reply block, click
    its inline "답글" / "Reply" button. A nested composer appears
    directly under that reply (its placeholder is
    "대댓글을 입력하세요..." / "Write a nested reply..."). Fill:
      - author input  → NESTED_AUTHOR
      - body textarea → NESTED_BODY
    Click the nested composer's submit button (accessible name
    "등록" / "Post"). Wait for the nested composer to disappear
    (it unmounts onSuccess via `setReplyingTo(null)`).

B5. [Verify nested reply]
    - A second reply block now shows NESTED_AUTHOR and NESTED_BODY.
    - That reply block's outer wrapper has inline
      `style="margin-left: 16px"` (depth 1 → `Math.min(1,4) * 16`).
    - The original top-level reply block's wrapper still has
      `margin-left: 0px` (it did not move).
    - The reply-count header inside the dialog now reads "2 답글" or
      "2 replies".

B6. [Browser] Close the dialog (press Escape or click the dialog's
    close affordance). The dialog must unmount.

B7. [Verify replyCount on the post card]
    - Back in the country list, the card whose `<h3>` text equals
      POST_TITLE now shows "2 답글" or "2 replies" (the create-reply
      handler invalidates `["/forum/posts"]`, so the list refetches).
      A short wait/poll up to ~5s is acceptable here.

──────────────── Final report ────────────────

Overall PASS only if every assertion in A and B passes. For any
failure: capture a screenshot of the relevant browser state and
include the failing element's text content (or the failing fetch's
status + JSON body, if the failure was a network call).

──────────────── Relevant technical context ────────────────

- Frontend at `/` via the proxy. The forum page is at `/forum`. API at
  `/api/*` same origin.
- Forum routes (artifacts/api-server/src/routes/forum.ts):
    GET  /api/forum/posts?country=XX        — list posts (filter by
                                              uppercase ISO country code)
    POST /api/forum/posts                   — body
        { countryCode, author, title, body? } → 201 ForumPost.
        No auth required; if a session cookie is present the lowercase
        wallet is stamped onto userId.
    GET  /api/forum/posts/:postId/replies   — list replies (also bumps
                                              the post's viewCount).
    POST /api/forum/posts/:postId/replies   — body
        { author, body, parentReplyId? } → 201 ForumReply. Bumps the
        post's replyCount by 1.
- Forum page component: `artifacts/futuremap/src/pages/Forum.tsx`.
  Country tabs render the first 10 earth countries plus space
  locations. The "글로벌" / "Global" tab is the first button and is
  the only one whose text starts with the 🌐 emoji.
- Reply indent: `ReplyItem` renders `<div style={{ marginLeft:
  Math.min(depth, 4) * 16 }}>`, so depth 0 → 0px, depth 1 → 16px,
  capped at 64px for depth ≥ 4.
- onSuccess of a reply, the page invalidates both
  `getListForumRepliesQueryKey(postId)` and `["/api/forum/posts"]`
  (the prefix of the orval-generated `getListForumPostsQueryKey`),
  which is why the post card's reply count updates without a manual
  refresh.
- The post composer's submit button is disabled until `title`,
  `author`, and a `selectedCountry` are all present — clicking a
  country tab in step A2 is what enables submission in step A3.
