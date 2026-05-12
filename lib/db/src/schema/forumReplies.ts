import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { forumPostsTable } from "./forumPosts";

export const forumRepliesTable = pgTable("forum_replies", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id")
    .notNull()
    .references(() => forumPostsTable.id, { onDelete: "cascade" }),
  parentReplyId: uuid("parent_reply_id"),
  author: text("author").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ForumReply = typeof forumRepliesTable.$inferSelect;
