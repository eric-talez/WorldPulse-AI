import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";

export const forumPostsTable = pgTable("forum_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  countryCode: text("country_code").notNull(),
  author: text("author").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  replyCount: integer("reply_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ForumPost = typeof forumPostsTable.$inferSelect;
