import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, countryBannersTable } from "@workspace/db";
import {
  ListCountryBannersQueryParams,
  ListCountryBannersResponse,
  AdminListCountryBannersResponse,
  AdminCreateCountryBannerBody,
  AdminUpdateCountryBannerBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/forum/banners", async (req, res): Promise<void> => {
  const parsed = ListCountryBannersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { country } = parsed.data;
  const rows = await (country
    ? db
        .select()
        .from(countryBannersTable)
        .where(
          and(
            eq(countryBannersTable.countryCode, country.toUpperCase()),
            eq(countryBannersTable.active, true),
          ),
        )
        .orderBy(desc(countryBannersTable.createdAt))
    : db
        .select()
        .from(countryBannersTable)
        .where(eq(countryBannersTable.active, true))
        .orderBy(desc(countryBannersTable.createdAt)));
  res.json(ListCountryBannersResponse.parse(rows));
});

router.get("/admin/country-banners", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(countryBannersTable)
    .orderBy(desc(countryBannersTable.createdAt));
  res.json(AdminListCountryBannersResponse.parse(rows));
});

router.post("/admin/country-banners", async (req, res): Promise<void> => {
  const parsed = AdminCreateCountryBannerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { countryCode, title, subtitle, imageUrl, linkUrl, active } =
    parsed.data;
  const [row] = await db
    .insert(countryBannersTable)
    .values({
      countryCode: countryCode.toUpperCase(),
      title,
      subtitle: subtitle ?? null,
      imageUrl,
      linkUrl: linkUrl ?? null,
      active: active ?? true,
    })
    .returning();
  res.status(201).json(row);
});

router.patch("/admin/country-banners/:id", async (req, res): Promise<void> => {
  const parsed = AdminUpdateCountryBannerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const update: Record<string, unknown> = {};
  if (data.countryCode !== undefined)
    update.countryCode = data.countryCode.toUpperCase();
  if (data.title !== undefined) update.title = data.title;
  if (data.subtitle !== undefined) update.subtitle = data.subtitle;
  if (data.imageUrl !== undefined) update.imageUrl = data.imageUrl;
  if (data.linkUrl !== undefined) update.linkUrl = data.linkUrl;
  if (data.active !== undefined) update.active = data.active;

  const [row] = await db
    .update(countryBannersTable)
    .set(update)
    .where(eq(countryBannersTable.id, req.params.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Banner not found" });
    return;
  }
  res.json(row);
});

router.delete("/admin/country-banners/:id", async (req, res): Promise<void> => {
  const [row] = await db
    .delete(countryBannersTable)
    .where(eq(countryBannersTable.id, req.params.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Banner not found" });
    return;
  }
  res.status(204).send();
});

export default router;
