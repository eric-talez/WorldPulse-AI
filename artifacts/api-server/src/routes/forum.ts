import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, forumPostsTable } from "@workspace/db";
import {
  ListForumPostsQueryParams,
  ListForumPostsResponse,
  CreateForumPostBody,
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

export default router;
