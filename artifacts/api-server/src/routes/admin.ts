import { Router, type IRouter } from "express";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import {
  db,
  usersTable,
  forumPostsTable,
  forumRepliesTable,
  issuesTable,
} from "@workspace/db";
import {
  AdminLoginBody,
  AdminListUsersQueryParams,
} from "@workspace/api-zod";
import {
  checkAdminCredentials,
  clearAdminSession,
  getAdminEmail,
  setAdminSession,
} from "../lib/adminSession";

const router: IRouter = Router();

router.post("/admin/auth/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;
  if (!checkAdminCredentials(email, password)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  setAdminSession(res, email);
  res.json({ authenticated: true, email });
});

router.post("/admin/auth/logout", (_req, res): void => {
  clearAdminSession(res);
  res.status(204).end();
});

router.get("/admin/auth/me", (req, res): void => {
  const email = getAdminEmail(req);
  if (!email) {
    res.json({ authenticated: false, email: null });
    return;
  }
  res.json({ authenticated: true, email });
});

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

router.get("/admin/stats/users", async (_req, res): Promise<void> => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const windowStart = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  windowStart.setUTCHours(0, 0, 0, 0);

  const allUsers = await db
    .select({
      walletAddress: usersTable.walletAddress,
      createdAt: usersTable.createdAt,
      deactivatedAt: usersTable.deactivatedAt,
    })
    .from(usersTable);

  const totalUsers = allUsers.length;
  const deactivatedUsers = allUsers.filter((u) => u.deactivatedAt !== null).length;
  const newToday = allUsers.filter((u) => u.createdAt >= startOfDay).length;
  const newThisWeek = allUsers.filter((u) => u.createdAt >= weekAgo).length;
  const newThisMonth = allUsers.filter((u) => u.createdAt >= monthAgo).length;

  const dailyMap = new Map<string, { signups: number; deactivations: number }>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(windowStart.getTime() + i * 24 * 60 * 60 * 1000);
    dailyMap.set(ymd(d), { signups: 0, deactivations: 0 });
  }
  for (const u of allUsers) {
    if (u.createdAt >= windowStart) {
      const k = ymd(u.createdAt);
      const e = dailyMap.get(k);
      if (e) e.signups += 1;
    }
    if (u.deactivatedAt && u.deactivatedAt >= windowStart) {
      const k = ymd(u.deactivatedAt);
      const e = dailyMap.get(k);
      if (e) e.deactivations += 1;
    }
  }
  const daily = Array.from(dailyMap.entries()).map(([date, v]) => ({
    date,
    signups: v.signups,
    deactivations: v.deactivations,
  }));

  res.json({
    totalUsers,
    deactivatedUsers,
    newToday,
    newThisWeek,
    newThisMonth,
    daily,
  });
});

router.get("/admin/stats/forum", async (_req, res): Promise<void> => {
  const windowDays = 7;
  const windowStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const [{ totalPosts }] = (await db
    .select({ totalPosts: count() })
    .from(forumPostsTable)
    .where(isNull(forumPostsTable.deletedAt))) as Array<{ totalPosts: number }>;

  const [{ totalComments }] = (await db
    .select({ totalComments: count() })
    .from(forumRepliesTable)
    .where(isNull(forumRepliesTable.deletedAt))) as Array<{ totalComments: number }>;

  const perCountryRows = await db
    .select({
      countryCode: forumPostsTable.countryCode,
      count: count(),
    })
    .from(forumPostsTable)
    .where(isNull(forumPostsTable.deletedAt))
    .groupBy(forumPostsTable.countryCode)
    .orderBy(desc(count()));

  // Recent reply counts per post
  const recentReplies = await db
    .select({
      postId: forumRepliesTable.postId,
      recent: count(),
    })
    .from(forumRepliesTable)
    .where(
      and(
        isNull(forumRepliesTable.deletedAt),
        gte(forumRepliesTable.createdAt, windowStart),
      ),
    )
    .groupBy(forumRepliesTable.postId);

  const recentMap = new Map<string, number>();
  for (const r of recentReplies) recentMap.set(r.postId, Number(r.recent));

  const candidatePostIds = Array.from(recentMap.keys());
  const hotPosts = candidatePostIds.length
    ? await db
        .select()
        .from(forumPostsTable)
        .where(
          and(
            isNull(forumPostsTable.deletedAt),
            inArray(forumPostsTable.id, candidatePostIds),
          ),
        )
    : [];

  // Hot score = recent comment activity (weighted) + post views.
  const hot = hotPosts
    .map((p) => {
      const recent = recentMap.get(p.id) ?? 0;
      return {
        id: p.id,
        countryCode: p.countryCode,
        title: p.title,
        author: p.author,
        replyCount: p.replyCount,
        recentActivity: recent * 3 + p.viewCount,
        createdAt: p.createdAt,
      };
    })
    .sort((a, b) => b.recentActivity - a.recentActivity)
    .slice(0, 10);

  res.json({
    totalPosts: Number(totalPosts),
    totalComments: Number(totalComments),
    windowDays,
    perCountry: perCountryRows.map((r) => ({
      countryCode: r.countryCode,
      count: Number(r.count),
    })),
    hot,
  });
});

router.get("/admin/stats/countries", async (_req, res): Promise<void> => {
  const postsByCountry = await db
    .select({ countryCode: forumPostsTable.countryCode, c: count() })
    .from(forumPostsTable)
    .where(isNull(forumPostsTable.deletedAt))
    .groupBy(forumPostsTable.countryCode);

  const issuesByCountry = await db
    .select({ countryCode: issuesTable.countryCode, c: count() })
    .from(issuesTable)
    .groupBy(issuesTable.countryCode);

  const usersByCountry = await db
    .select({ countryCode: forumPostsTable.countryCode, c: sql<number>`count(distinct coalesce(${forumPostsTable.userId}, ${forumPostsTable.author}))` })
    .from(forumPostsTable)
    .where(isNull(forumPostsTable.deletedAt))
    .groupBy(forumPostsTable.countryCode);

  const map = new Map<string, { countryCode: string; posts: number; users: number; issues: number }>();
  const ensure = (code: string) => {
    let row = map.get(code);
    if (!row) {
      row = { countryCode: code, posts: 0, users: 0, issues: 0 };
      map.set(code, row);
    }
    return row;
  };
  for (const r of postsByCountry) ensure(r.countryCode).posts = Number(r.c);
  for (const r of issuesByCountry) ensure(r.countryCode).issues = Number(r.c);
  for (const r of usersByCountry) ensure(r.countryCode).users = Number(r.c);

  res.json(
    Array.from(map.values()).sort((a, b) => b.posts + b.issues - (a.posts + a.issues)),
  );
});

function adminUserShape(u: typeof usersTable.$inferSelect) {
  return {
    walletAddress: u.walletAddress,
    tier: u.tier as "free" | "pro" | "enterprise",
    email: u.email,
    displayName: u.displayName,
    age: u.age,
    gender: u.gender,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
    deactivated: u.deactivatedAt !== null,
    deactivatedAt: u.deactivatedAt,
  };
}

router.get("/admin/users", async (req, res): Promise<void> => {
  const parsed = AdminListUsersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, page, pageSize } = parsed.data;
  const p = page ?? 1;
  const ps = pageSize ?? 20;
  const where: SQL | undefined = search
    ? or(
        ilike(usersTable.walletAddress, `%${search.toLowerCase()}%`),
        ilike(usersTable.email, `%${search}%`),
        ilike(usersTable.displayName, `%${search}%`),
      )
    : undefined;

  const totalRows = await db
    .select({ c: count() })
    .from(usersTable)
    .where(where);
  const total = Number(totalRows[0]?.c ?? 0);

  const items = await db
    .select()
    .from(usersTable)
    .where(where)
    .orderBy(desc(usersTable.createdAt))
    .limit(ps)
    .offset((p - 1) * ps);

  res.json({
    items: items.map(adminUserShape),
    total,
    page: p,
    pageSize: ps,
  });
});

router.get("/admin/users/:walletAddress", async (req, res): Promise<void> => {
  const wallet = req.params.walletAddress.toLowerCase();
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.walletAddress, wallet));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Posts: match either userId or author == walletAddress (legacy)
  const posts = await db
    .select()
    .from(forumPostsTable)
    .where(
      or(
        eq(forumPostsTable.userId, wallet),
        eq(forumPostsTable.author, wallet),
      ),
    )
    .orderBy(desc(forumPostsTable.createdAt));

  const comments = await db
    .select({
      id: forumRepliesTable.id,
      postId: forumRepliesTable.postId,
      body: forumRepliesTable.body,
      createdAt: forumRepliesTable.createdAt,
      deletedAt: forumRepliesTable.deletedAt,
      postTitle: forumPostsTable.title,
    })
    .from(forumRepliesTable)
    .leftJoin(forumPostsTable, eq(forumRepliesTable.postId, forumPostsTable.id))
    .where(
      or(
        eq(forumRepliesTable.userId, wallet),
        eq(forumRepliesTable.author, wallet),
      ),
    )
    .orderBy(desc(forumRepliesTable.createdAt));

  res.json({
    user: adminUserShape(user),
    posts: posts.map((p) => ({
      id: p.id,
      countryCode: p.countryCode,
      title: p.title,
      replyCount: p.replyCount,
      createdAt: p.createdAt,
      deleted: p.deletedAt !== null,
    })),
    comments: comments.map((c) => ({
      id: c.id,
      postId: c.postId,
      postTitle: c.postTitle ?? "(삭제된 글)",
      body: c.body,
      createdAt: c.createdAt,
      deleted: c.deletedAt !== null,
    })),
  });
});

router.get("/admin/forum/posts", async (req, res): Promise<void> => {
  const country = typeof req.query.country === "string" ? req.query.country : undefined;
  const author = typeof req.query.author === "string" ? req.query.author : undefined;
  const fromRaw = typeof req.query.from === "string" ? req.query.from : undefined;
  const toRaw = typeof req.query.to === "string" ? req.query.to : undefined;
  const from = fromRaw ? new Date(fromRaw) : undefined;
  const to = toRaw ? new Date(toRaw) : undefined;
  if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) {
    res.status(400).json({ error: "Invalid from/to date" });
    return;
  }
  const conds: SQL[] = [];
  if (country) conds.push(eq(forumPostsTable.countryCode, country.toUpperCase()));
  if (author) conds.push(ilike(forumPostsTable.author, `%${author}%`));
  if (from) conds.push(gte(forumPostsTable.createdAt, from));
  if (to) conds.push(lte(forumPostsTable.createdAt, to));

  const rows = await db
    .select()
    .from(forumPostsTable)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(forumPostsTable.createdAt));

  res.json(
    rows.map((p) => ({
      id: p.id,
      countryCode: p.countryCode,
      author: p.author,
      userId: p.userId,
      title: p.title,
      body: p.body,
      replyCount: p.replyCount,
      createdAt: p.createdAt,
      deleted: p.deletedAt !== null,
    })),
  );
});

router.get("/admin/forum/posts/:id", async (req, res): Promise<void> => {
  const [post] = await db
    .select()
    .from(forumPostsTable)
    .where(eq(forumPostsTable.id, req.params.id));
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  const comments = await db
    .select()
    .from(forumRepliesTable)
    .where(eq(forumRepliesTable.postId, post.id))
    .orderBy(asc(forumRepliesTable.createdAt));

  res.json({
    post: {
      id: post.id,
      countryCode: post.countryCode,
      author: post.author,
      userId: post.userId,
      title: post.title,
      body: post.body,
      replyCount: post.replyCount,
      createdAt: post.createdAt,
      deleted: post.deletedAt !== null,
    },
    comments: comments.map((c) => ({
      id: c.id,
      postId: c.postId,
      parentReplyId: c.parentReplyId,
      author: c.author,
      userId: c.userId,
      body: c.body,
      createdAt: c.createdAt,
      deleted: c.deletedAt !== null,
    })),
  });
});

router.delete("/admin/forum/posts/:id", async (req, res): Promise<void> => {
  await db
    .update(forumPostsTable)
    .set({ deletedAt: new Date() })
    .where(eq(forumPostsTable.id, req.params.id));
  res.status(204).end();
});

router.delete("/admin/forum/replies/:id", async (req, res): Promise<void> => {
  const [updated] = await db
    .update(forumRepliesTable)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(forumRepliesTable.id, req.params.id),
        isNull(forumRepliesTable.deletedAt),
      ),
    )
    .returning();
  if (updated) {
    await db
      .update(forumPostsTable)
      .set({ replyCount: sql`GREATEST(${forumPostsTable.replyCount} - 1, 0)` })
      .where(eq(forumPostsTable.id, updated.postId));
  }
  res.status(204).end();
});

export default router;
