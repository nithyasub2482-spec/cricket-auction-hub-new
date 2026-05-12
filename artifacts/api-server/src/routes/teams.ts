import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, teamsTable, playersTable, auctionSlotsTable } from "@workspace/db";
import {
  GetTeamParams,
  UpdateTeamParams,
  UpdateTeamBody,
  CreateTeamBody,
  GetTeamSquadParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function formatTeam(t: typeof teamsTable.$inferSelect) {
  return {
    id: t.id,
    name: t.name,
    shortName: t.shortName,
    primaryColor: t.primaryColor,
    secondaryColor: t.secondaryColor,
    logoUrl: t.logoUrl,
    purse: Number(t.purse),
    remainingPurse: Number(t.remainingPurse),
    maxPlayers: t.maxPlayers,
    maxOverseas: t.maxOverseas,
    ownerId: t.ownerId,
    ownerName: t.ownerName,
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/teams", async (_req, res): Promise<void> => {
  const teams = await db.select().from(teamsTable).orderBy(teamsTable.name);
  res.json(teams.map(formatTeam));
});

router.post("/teams", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [team] = await db
    .insert(teamsTable)
    .values({
      ...parsed.data,
      purse: String(parsed.data.purse),
      remainingPurse: String(parsed.data.purse),
    })
    .returning();

  res.status(201).json(formatTeam(team!));
});

router.get("/teams/:id", async (req, res): Promise<void> => {
  const params = GetTeamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, params.data.id));
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  res.json(formatTeam(team));
});

router.patch("/teams/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateTeamParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { purse, remainingPurse, ...rest } = parsed.data;
  const [team] = await db
    .update(teamsTable)
    .set({
      ...rest,
      ...(purse !== undefined ? { purse: String(purse) } : {}),
      ...(remainingPurse !== undefined ? { remainingPurse: String(remainingPurse) } : {}),
    })
    .where(eq(teamsTable.id, params.data.id))
    .returning();

  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  res.json(formatTeam(team));
});

router.get("/teams/:id/squad", async (req, res): Promise<void> => {
  const params = GetTeamSquadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, params.data.id));
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  // Get sold slots for this team
  const soldSlots = await db
    .select({
      slot: auctionSlotsTable,
      player: playersTable,
    })
    .from(auctionSlotsTable)
    .innerJoin(playersTable, eq(auctionSlotsTable.playerId, playersTable.id))
    .where(eq(auctionSlotsTable.soldToTeamId, params.data.id));

  const squadPlayers = soldSlots.map(({ slot, player }) => ({
    id: player.id,
    name: player.name,
    category: player.category,
    country: player.country,
    soldPrice: Number(slot.soldPrice ?? slot.currentBid ?? player.basePrice),
    battingStyle: player.battingStyle,
    bowlingStyle: player.bowlingStyle,
    photoUrl: player.photoUrl,
    rating: player.rating != null ? Number(player.rating) : null,
  }));

  const overseas = squadPlayers.filter(
    (p) => !["India", "IND"].includes(soldSlots.find((s) => s.player.id === p.id)?.player.country ?? ""),
  ).length;

  const stats = {
    totalPlayers: squadPlayers.length,
    batsmen: squadPlayers.filter((p) => p.category === "batsman").length,
    bowlers: squadPlayers.filter((p) => p.category === "bowler").length,
    allRounders: squadPlayers.filter((p) => p.category === "all_rounder").length,
    wicketKeepers: squadPlayers.filter((p) => p.category === "wicket_keeper").length,
    overseas,
    spent: Number(team.purse) - Number(team.remainingPurse),
    remaining: Number(team.remainingPurse),
    avgPrice:
      squadPlayers.length > 0
        ? squadPlayers.reduce((a, p) => a + p.soldPrice, 0) / squadPlayers.length
        : 0,
  };

  res.json({ team: formatTeam(team), players: squadPlayers, stats });
});

export default router;
