import { Router, type IRouter } from "express";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db, forumPostsTable, forumRepliesTable } from "@workspace/db";
import {
  ListForumPostsQueryParams,
  ListForumPostsResponse,
  CreateForumPostBody,
  ListForumRepliesResponse,
  CreateForumReplyBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/forum/posts", async (req, res): Promise<void> => {
  const parsed = ListForumPostsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { country } = parsed.data;
  const rows = await (country
    ? db
        .select()
        .from(forumPostsTable)
        .where(eq(forumPostsTable.countryCode, country.toUpperCase()))
        .orderBy(desc(forumPostsTable.createdAt))
    : db.select().from(forumPostsTable).orderBy(desc(forumPostsTable.createdAt)));
  res.json(ListForumPostsResponse.parse(rows));
});

router.post("/forum/posts", async (req, res): Promise<void> => {
  const parsed = CreateForumPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { countryCode, author, title, body } = parsed.data;
  const [post] = await db
    .insert(forumPostsTable)
    .values({
      countryCode: countryCode.toUpperCase(),
      author,
      title,
      body: body ?? null,
    })
    .returning();
  res.status(201).json(post);
});

router.get("/forum/posts/:postId/replies", async (req, res): Promise<void> => {
  const { postId } = req.params;
  const rows = await db
    .select()
    .from(forumRepliesTable)
    .where(eq(forumRepliesTable.postId, postId))
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
  const [reply] = await db
    .insert(forumRepliesTable)
    .values({
      postId,
      author,
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
