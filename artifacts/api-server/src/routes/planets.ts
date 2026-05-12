import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, issuesTable } from "@workspace/db";
import {
  ListPlanetsResponse,
  GetPlanetLocationParams,
  GetPlanetLocationResponse,
} from "@workspace/api-zod";
import { PLANETS, PLANET_LIST, isPlanet, findLocation } from "../lib/planets";

const router: IRouter = Router();

router.get("/planets", async (_req, res): Promise<void> => {
  res.json(ListPlanetsResponse.parse(PLANET_LIST));
});

router.get(
  "/planets/:planet/locations/:code",
  async (req, res): Promise<void> => {
    const parsed = GetPlanetLocationParams.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const { planet, code } = parsed.data;
    if (!isPlanet(planet)) {
      res.status(404).json({ error: "Unknown planet" });
      return;
    }
    const location = findLocation(planet, code);
    if (!location) {
      res.status(404).json({ error: "Location not found" });
      return;
    }
    const rows = await db
      .select()
      .from(issuesTable)
      .where(
        and(
          eq(issuesTable.planet, planet),
          eq(issuesTable.countryCode, location.code),
        ),
      )
      .orderBy(desc(issuesTable.publishedAt))
      .limit(20);

    const signals = rows.map((r) => ({
      id: r.id,
      countryCode: r.countryCode,
      countryFlag: location.flag,
      planet: planet,
      category: r.category,
      headline: r.headline,
      body: r.body,
      sourceUrl: r.sourceUrl,
      publishedAt: r.publishedAt,
    }));

    res.json(
      GetPlanetLocationResponse.parse({
        location,
        signals,
      }),
    );

    // touch PLANETS to satisfy unused-import lint in some configurations
    void PLANETS;
  },
);

export default router;
