import { Router, type IRouter } from "express";
import { eq, ilike, and, SQL } from "drizzle-orm";
import { db, playersTable } from "@workspace/db";
import {
  ListPlayersQueryParams,
  CreatePlayerBody,
  GetPlayerParams,
  UpdatePlayerParams,
  UpdatePlayerBody,
  DeletePlayerParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function formatPlayer(p: typeof playersTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    country: p.country,
    city: p.city,
    age: p.age,
    category: p.category,
    battingStyle: p.battingStyle,
    bowlingStyle: p.bowlingStyle,
    basePrice: Number(p.basePrice),
    status: p.status,
    photoUrl: p.photoUrl,
    matches: p.matches,
    runs: p.runs,
    wickets: p.wickets,
    strikeRate: p.strikeRate != null ? Number(p.strikeRate) : null,
    economy: p.economy != null ? Number(p.economy) : null,
    average: p.average != null ? Number(p.average) : null,
    fifties: p.fifties,
    hundreds: p.hundreds,
    rating: p.rating != null ? Number(p.rating) : null,
    tags: p.tags ?? [],
    notes: p.notes,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/players", async (req, res): Promise<void> => {
  const params = ListPlayersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions: SQL[] = [];
  if (params.data.category) conditions.push(eq(playersTable.category, params.data.category as "batsman" | "bowler" | "all_rounder" | "wicket_keeper"));
  if (params.data.country) conditions.push(eq(playersTable.country, params.data.country));
  if (params.data.status) conditions.push(eq(playersTable.status, params.data.status as "available" | "sold" | "unsold" | "in_auction"));
  if (params.data.search) conditions.push(ilike(playersTable.name, `%${params.data.search}%`));

  const players = await db
    .select()
    .from(playersTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(playersTable.name);

  res.json(players.map(formatPlayer));
});

router.post("/players", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreatePlayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [player] = await db.insert(playersTable).values(parsed.data).returning();
  res.status(201).json(formatPlayer(player!));
});

router.get("/players/:id", async (req, res): Promise<void> => {
  const params = GetPlayerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [player] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.id, params.data.id));

  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  res.json(formatPlayer(player));
});

router.patch("/players/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdatePlayerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdatePlayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [player] = await db
    .update(playersTable)
    .set(parsed.data)
    .where(eq(playersTable.id, params.data.id))
    .returning();

  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  res.json(formatPlayer(player));
});

router.delete("/players/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeletePlayerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [player] = await db
    .delete(playersTable)
    .where(eq(playersTable.id, params.data.id))
    .returning();

  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
