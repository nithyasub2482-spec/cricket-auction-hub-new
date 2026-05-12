import { Router, type IRouter } from "express";
import { eq, count, sum, max, desc } from "drizzle-orm";
import { db, playersTable, teamsTable, auctionSlotsTable, bidsTable } from "@workspace/db";
import {
  GetLeagueSummaryQueryParams,
  GetTeamStatsQueryParams,
  GetBidActivityQueryParams,
  GetPlayerPoolQueryParams,
} from "@workspace/api-zod";

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

router.get("/analytics/league-summary", async (req, res): Promise<void> => {
  const params = GetLeagueSummaryQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [playerCounts] = await db
    .select({
      total: count(playersTable.id),
    })
    .from(playersTable);

  const [soldCount] = await db
    .select({ cnt: count() })
    .from(playersTable)
    .where(eq(playersTable.status, "sold"));

  const [unsoldCount] = await db
    .select({ cnt: count() })
    .from(playersTable)
    .where(eq(playersTable.status, "unsold"));

  const [bidStats] = await db
    .select({
      total: count(bidsTable.id),
      maxBid: max(bidsTable.amount),
    })
    .from(bidsTable);

  const soldSlots = await db
    .select()
    .from(auctionSlotsTable)
    .where(eq(auctionSlotsTable.status, "sold"));

  const totalSpent = soldSlots.reduce((sum, s) => sum + Number(s.soldPrice ?? 0), 0);
  const avgSoldPrice = soldSlots.length > 0 ? totalSpent / soldSlots.length : 0;

  // Most expensive player (highest sold slot)
  const mostExpSlot = soldSlots.sort((a, b) => Number(b.soldPrice ?? 0) - Number(a.soldPrice ?? 0))[0];
  let mostExpensivePlayer = null;
  if (mostExpSlot) {
    const [p] = await db.select().from(playersTable).where(eq(playersTable.id, mostExpSlot.playerId));
    if (p) mostExpensivePlayer = formatPlayer(p);
  }

  // Highest spending team
  const teams = await db.select().from(teamsTable);
  const highestSpendingTeam = teams.reduce((best, t) => {
    const spent = Number(t.purse) - Number(t.remainingPurse);
    if (!best || spent > Number(best.purse) - Number(best.remainingPurse)) return t;
    return best;
  }, null as typeof teamsTable.$inferSelect | null);

  res.json({
    totalPlayers: playerCounts?.total ?? 0,
    soldPlayers: soldCount?.cnt ?? 0,
    unsoldPlayers: unsoldCount?.cnt ?? 0,
    remainingPlayers: Math.max(0, (playerCounts?.total ?? 0) - (soldCount?.cnt ?? 0) - (unsoldCount?.cnt ?? 0)),
    totalBids: bidStats?.total ?? 0,
    highestBid: bidStats?.maxBid != null ? Number(bidStats.maxBid) : 0,
    mostExpensivePlayer: mostExpensivePlayer ?? null,
    highestSpendingTeam: highestSpendingTeam ? formatTeam(highestSpendingTeam) : null,
    avgSoldPrice,
    totalSpent,
  });
});

router.get("/analytics/team-stats", async (req, res): Promise<void> => {
  const params = GetTeamStatsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const teams = await db.select().from(teamsTable);

  const teamStats = await Promise.all(
    teams.map(async (team) => {
      const soldSlots = await db
        .select({ slot: auctionSlotsTable, player: playersTable })
        .from(auctionSlotsTable)
        .innerJoin(playersTable, eq(auctionSlotsTable.playerId, playersTable.id))
        .where(eq(auctionSlotsTable.soldToTeamId, team.id));

      const spent = Number(team.purse) - Number(team.remainingPurse);
      const budgetEfficiency =
        Number(team.purse) > 0 ? (spent / Number(team.purse)) * 100 : 0;

      const overseas = soldSlots.filter(
        ({ player }) => player.country !== "India" && player.country !== "IND",
      ).length;

      return {
        team: formatTeam(team),
        playerCount: soldSlots.length,
        spent,
        remainingPurse: Number(team.remainingPurse),
        batsmen: soldSlots.filter(({ player }) => player.category === "batsman").length,
        bowlers: soldSlots.filter(({ player }) => player.category === "bowler").length,
        allRounders: soldSlots.filter(({ player }) => player.category === "all_rounder").length,
        wicketKeepers: soldSlots.filter(({ player }) => player.category === "wicket_keeper").length,
        overseas,
        budgetEfficiency,
      };
    }),
  );

  res.json(teamStats);
});

router.get("/analytics/bid-activity", async (req, res): Promise<void> => {
  const params = GetBidActivityQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const limit = params.data.limit ?? 20;

  const recentBids = await db
    .select({
      bid: bidsTable,
      team: teamsTable,
      player: playersTable,
    })
    .from(bidsTable)
    .innerJoin(teamsTable, eq(bidsTable.teamId, teamsTable.id))
    .innerJoin(auctionSlotsTable, eq(bidsTable.slotId, auctionSlotsTable.id))
    .innerJoin(playersTable, eq(auctionSlotsTable.playerId, playersTable.id))
    .orderBy(desc(bidsTable.createdAt))
    .limit(limit);

  res.json(
    recentBids.map(({ bid, team, player }) => ({
      id: bid.id,
      playerName: player.name,
      teamName: team.name,
      teamColor: team.primaryColor,
      amount: Number(bid.amount),
      createdAt: bid.createdAt.toISOString(),
    })),
  );
});

router.get("/analytics/player-pool", async (req, res): Promise<void> => {
  const params = GetPlayerPoolQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const allPlayers = await db.select().from(playersTable);

  const categories = ["batsman", "bowler", "all_rounder", "wicket_keeper"] as const;
  const byCategory = categories.map((cat) => {
    const catPlayers = allPlayers.filter((p) => p.category === cat);
    return {
      category: cat,
      total: catPlayers.length,
      available: catPlayers.filter((p) => p.status === "available").length,
      sold: catPlayers.filter((p) => p.status === "sold").length,
    };
  });

  res.json({
    total: allPlayers.length,
    available: allPlayers.filter((p) => p.status === "available").length,
    sold: allPlayers.filter((p) => p.status === "sold").length,
    unsold: allPlayers.filter((p) => p.status === "unsold").length,
    byCategory,
  });
});

export default router;
