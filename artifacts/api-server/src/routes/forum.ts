import { Router, type IRouter } from "express";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { db, forumPostsTable, forumRepliesTable } from "@workspace/db";
import {
  ListForumPostsQueryParams,
  ListForumPostsResponse,
  CreateForumPostBody,
  ListForumRepliesResponse,
  CreateForumReplyBody,
} from "@workspace/api-zod";
import { getActiveSessionWallet } from "../lib/session";

const router: IRouter = Router();

router.get("/forum/posts", async (req, res): Promise<void> => {
  const parsed = ListForumPostsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { country } = parsed.data;
  const where = country
    ? and(
        isNull(forumPostsTable.deletedAt),
        eq(forumPostsTable.countryCode, country.toUpperCase()),
      )
    : isNull(forumPostsTable.deletedAt);
  const rows = await db
    .select()
    .from(forumPostsTable)
    .where(where)
    .orderBy(desc(forumPostsTable.createdAt));
  res.json(ListForumPostsResponse.parse(rows));
});

router.post("/forum/posts", async (req, res): Promise<void> => {
  const parsed = CreateForumPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { countryCode, author, title, body } = parsed.data;
  const userId = await getActiveSessionWallet(req, res);
  const [post] = await db
    .insert(forumPostsTable)
    .values({
      countryCode: countryCode.toUpperCase(),
      author,
      userId,
      title,
      body: body ?? null,
    })
    .returning();
  res.status(201).json(post);
});

router.get("/forum/posts/:postId/replies", async (req, res): Promise<void> => {
  const { postId } = req.params;
  // Treat fetching a post's replies as a "view" — drives the hot-post score.
  await db
    .update(forumPostsTable)
    .set({ viewCount: sql`${forumPostsTable.viewCount} + 1` })
    .where(eq(forumPostsTable.id, postId));
  const rows = await db
    .select()
    .from(forumRepliesTable)
    .where(
      and(
        eq(forumRepliesTable.postId, postId),
        isNull(forumRepliesTable.deletedAt),
      ),
    )
    .orderBy(asc(forumRepliesTable.createdAt));
  res.json(ListForumRepliesResponse.parse(rows));
});

router.post("/forum/posts/:postId/replies", async (req, res): Promise<void> => {
  const { postId } = req.params;
  const parsed = CreateForumReplyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { author, body, parentReplyId } = parsed.data;
  const userId = await getActiveSessionWallet(req, res);
  const [reply] = await db
    .insert(forumRepliesTable)
    .values({
      postId,
      author,
      userId,
      body,
      parentReplyId: parentReplyId ?? null,
    })
    .returning();
  await db
    .update(forumPostsTable)
    .set({ replyCount: sql`${forumPostsTable.replyCount} + 1` })
    .where(eq(forumPostsTable.id, postId));
  res.status(201).json(reply);
});

export default router;
