import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, auctionsTable, auctionSlotsTable, bidsTable, playersTable, teamsTable } from "@workspace/db";
import {
  GetAuctionParams,
  CreateAuctionBody,
  StartAuctionParams,
  PauseAuctionParams,
  ResumeAuctionParams,
  DeleteAuctionParams,
  SelectNextPlayerParams,
  SelectNextPlayerBody,
  MarkPlayerSoldParams,
  MarkPlayerUnsoldParams,
  ListAuctionSlotsParams,
  GetCurrentSlotParams,
  GetAuctionBidsParams,
  GetSlotBidsParams,
  PlaceBidParams,
  PlaceBidBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { emitToAuction, startTimer, resetTimer, stopTimer, pauseTimer, resumeTimer } from "../lib/socket";

const router: IRouter = Router();

function formatAuction(a: typeof auctionsTable.$inferSelect) {
  return {
    id: a.id,
    name: a.name,
    leagueName: a.leagueName,
    status: a.status,
    currentPlayerId: a.currentPlayerId,
    currentSlotId: a.currentSlotId,
    bidIncrementMin: Number(a.bidIncrementMin),
    timerSeconds: a.timerSeconds,
    biddingMode: a.biddingMode,
    startedAt: a.startedAt?.toISOString() ?? null,
    completedAt: a.completedAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
  };
}

async function formatSlot(slot: typeof auctionSlotsTable.$inferSelect) {
  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, slot.playerId));
  let soldToTeam = null;
  let highestBidTeam = null;

  if (slot.soldToTeamId) {
    const [t] = await db.select().from(teamsTable).where(eq(teamsTable.id, slot.soldToTeamId));
    if (t) soldToTeam = formatTeam(t);
  }
  if (slot.highestBidTeamId) {
    const [t] = await db.select().from(teamsTable).where(eq(teamsTable.id, slot.highestBidTeamId));
    if (t) highestBidTeam = formatTeam(t);
  }

  return {
    id: slot.id,
    auctionId: slot.auctionId,
    playerId: slot.playerId,
    player: player ? formatPlayer(player) : null,
    status: slot.status,
    basePrice: Number(slot.basePrice),
    currentBid: slot.currentBid != null ? Number(slot.currentBid) : null,
    soldPrice: slot.soldPrice != null ? Number(slot.soldPrice) : null,
    soldToTeamId: slot.soldToTeamId,
    soldToTeam,
    highestBidTeamId: slot.highestBidTeamId,
    highestBidTeam,
    bidCount: slot.bidCount,
    createdAt: slot.createdAt.toISOString(),
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

// List auctions
router.get("/auctions", async (_req, res): Promise<void> => {
  const auctions = await db.select().from(auctionsTable).orderBy(desc(auctionsTable.createdAt));
  res.json(auctions.map(formatAuction));
});

// Create auction
router.post("/auctions", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateAuctionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { bidIncrementMin, ...auctionRest } = parsed.data;
  const [auction] = await db.insert(auctionsTable).values({
    ...auctionRest,
    bidIncrementMin: String(bidIncrementMin),
  }).returning();
  res.status(201).json(formatAuction(auction!));
});

// Get auction
router.get("/auctions/:id", async (req, res): Promise<void> => {
  const params = GetAuctionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [auction] = await db
    .select()
    .from(auctionsTable)
    .where(eq(auctionsTable.id, params.data.id));
  if (!auction) {
    res.status(404).json({ error: "Auction not found" });
    return;
  }
  res.json(formatAuction(auction));
});

// Start auction
router.post("/auctions/:id/start", requireAuth, async (req, res): Promise<void> => {
  const params = StartAuctionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [auction] = await db
    .update(auctionsTable)
    .set({ status: "active", startedAt: new Date() })
    .where(eq(auctionsTable.id, params.data.id))
    .returning();
  if (!auction) {
    res.status(404).json({ error: "Auction not found" });
    return;
  }
  const formatted = formatAuction(auction);
  emitToAuction(auction.id, "auction:started", formatted);
  res.json(formatted);
});

// Pause auction
router.post("/auctions/:id/pause", requireAuth, async (req, res): Promise<void> => {
  const params = PauseAuctionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [auction] = await db
    .update(auctionsTable)
    .set({ status: "paused" })
    .where(eq(auctionsTable.id, params.data.id))
    .returning();
  if (!auction) {
    res.status(404).json({ error: "Auction not found" });
    return;
  }
  const formatted = formatAuction(auction);
  pauseTimer(auction.id);
  emitToAuction(auction.id, "auction:paused", formatted);
  res.json(formatted);
});

// Resume auction
router.post("/auctions/:id/resume", requireAuth, async (req, res): Promise<void> => {
  const params = ResumeAuctionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [auction] = await db
    .update(auctionsTable)
    .set({ status: "active" })
    .where(eq(auctionsTable.id, params.data.id))
    .returning();
  if (!auction) {
    res.status(404).json({ error: "Auction not found" });
    return;
  }
  const formatted = formatAuction(auction);
  resumeTimer(auction.id);
  emitToAuction(auction.id, "auction:resumed", formatted);
  res.json(formatted);
});

// Delete auction (restore players and refund team purses)
router.delete("/auctions/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteAuctionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const auctionId = params.data.id;

  try {
    // Get the auction
    const [auction] = await db
      .select()
      .from(auctionsTable)
      .where(eq(auctionsTable.id, auctionId));

    if (!auction) {
      res.status(404).json({ error: "Auction not found" });
      return;
    }

    // Get all slots for this auction
    const slots = await db
      .select()
      .from(auctionSlotsTable)
      .where(eq(auctionSlotsTable.auctionId, auctionId));

    // Track refunded teams and restored players
    const refundedTeamsMap = new Map<number, number>(); // teamId -> totalRefund
    const playersToRestore = new Set<number>();

    // Process each slot
    for (const slot of slots) {
      // Collect players to restore
      playersToRestore.add(slot.playerId);

      // If the slot was sold, refund the team
      if (slot.status === "sold" && slot.soldToTeamId && slot.soldPrice) {
        const currentRefund = refundedTeamsMap.get(slot.soldToTeamId) || 0;
        refundedTeamsMap.set(slot.soldToTeamId, currentRefund + Number(slot.soldPrice));
      }
    }

    // Update team purses - refund all money spent on players in this auction
    for (const [teamId, refundAmount] of refundedTeamsMap.entries()) {
      const [team] = await db
        .select()
        .from(teamsTable)
        .where(eq(teamsTable.id, teamId));

      if (team) {
        const newPurse = Number(team.remainingPurse) + refundAmount;
        await db
          .update(teamsTable)
          .set({ remainingPurse: String(newPurse) })
          .where(eq(teamsTable.id, teamId));
      }
    }

    // Update all players in this auction back to 'available'
    for (const playerId of playersToRestore) {
      await db
        .update(playersTable)
        .set({ status: "available" })
        .where(eq(playersTable.id, playerId));
    }

    // Delete all bids for this auction
    await db.delete(bidsTable).where(eq(bidsTable.auctionId, auctionId));

    // Delete all slots for this auction
    await db.delete(auctionSlotsTable).where(eq(auctionSlotsTable.auctionId, auctionId));

    // Delete the auction
    await db.delete(auctionsTable).where(eq(auctionsTable.id, auctionId));

    // Stop any active timers
    stopTimer(auctionId);

    // Emit deletion event
    emitToAuction(auctionId, "auction:deleted", {
      auctionId,
      message: "Auction has been deleted. All players have been restored and team purses have been refunded.",
    });

    res.json({
      success: true,
      message: `Auction deleted successfully. Restored ${playersToRestore.size} players and refunded ${refundedTeamsMap.size} teams.`,
      deletedAuctionId: auctionId,
      restoredPlayers: playersToRestore.size,
      refundedTeams: refundedTeamsMap.size,
    });
  } catch (error) {
    console.error("Error deleting auction:", error);
    res.status(500).json({ error: "Failed to delete auction" });
  }
});

// Select next player
router.post("/auctions/:id/next-player", requireAuth, async (req, res): Promise<void> => {
  const params = SelectNextPlayerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = SelectNextPlayerBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [player] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.id, body.data.playerId));

  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  // Mark player as in_auction
  await db
    .update(playersTable)
    .set({ status: "in_auction" })
    .where(eq(playersTable.id, player.id));

  // Create a new slot
  const [slot] = await db
    .insert(auctionSlotsTable)
    .values({
      auctionId: params.data.id,
      playerId: player.id,
      basePrice: player.basePrice,
      status: "active",
    })
    .returning();

  // Update auction with current player/slot
  await db
    .update(auctionsTable)
    .set({ currentPlayerId: player.id, currentSlotId: slot!.id })
    .where(eq(auctionsTable.id, params.data.id));

  // Fetch auction to get configured timer duration
  const [auctionForTimer] = await db
    .select()
    .from(auctionsTable)
    .where(eq(auctionsTable.id, params.data.id));

  const formattedSlot = await formatSlot(slot!);
  emitToAuction(params.data.id, "player:selected", {
    slot: formattedSlot,
    player: formatPlayer(player),
  });

  // Start the countdown timer
  startTimer(params.data.id, auctionForTimer?.timerSeconds ?? 60);

  res.json(formattedSlot);
});

// Mark player sold
router.post("/auctions/:id/sold", requireAuth, async (req, res): Promise<void> => {
  const params = MarkPlayerSoldParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  // Get the slot by ID
  const [slot] = await db
    .select()
    .from(auctionSlotsTable)
    .where(eq(auctionSlotsTable.id, params.data.id));
  if (!slot) {
    res.status(404).json({ error: "Slot not found" });
    return;
  }

  // Get the auction
  const [auction] = await db
    .select()
    .from(auctionsTable)
    .where(eq(auctionsTable.id, slot.auctionId));
  if (!auction) {
    res.status(404).json({ error: "Auction not found" });
    return;
  }

  // Validate slot has bids
  if (!slot.highestBidTeamId || !slot.currentBid) {
    res.status(400).json({ error: "No bids placed on this slot" });
    return;
  }

  // Mark slot as sold
  const [updatedSlot] = await db
    .update(auctionSlotsTable)
    .set({
      status: "sold",
      soldPrice: slot.currentBid,
      soldToTeamId: slot.highestBidTeamId,
      updatedAt: new Date(),
    })
    .where(eq(auctionSlotsTable.id, slot.id))
    .returning();

  // Update player status
  await db
    .update(playersTable)
    .set({ status: "sold" })
    .where(eq(playersTable.id, slot.playerId));

  // Deduct from team purse
  const [team] = await db
    .select()
    .from(teamsTable)
    .where(eq(teamsTable.id, slot.highestBidTeamId));
  if (team) {
    await db
      .update(teamsTable)
      .set({
        remainingPurse: String(
          Math.max(0, Number(team.remainingPurse) - Number(slot.currentBid)),
        ),
      })
      .where(eq(teamsTable.id, team.id));
  }

  // Clear current slot on auction
  await db
    .update(auctionsTable)
    .set({ currentPlayerId: null, currentSlotId: null })
    .where(eq(auctionsTable.id, slot.auctionId));

  stopTimer(slot.auctionId);

  const formattedSlot = await formatSlot(updatedSlot!);
  emitToAuction(slot.auctionId, "player:sold", {
    slot: formattedSlot,
    player: formattedSlot.player,
    team: formattedSlot.soldToTeam,
    amount: Number(slot.currentBid),
  });
  res.json(formattedSlot);
});

// Mark player unsold
router.post("/auctions/:id/unsold", requireAuth, async (req, res): Promise<void> => {
  const params = MarkPlayerUnsoldParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  // Get the slot by ID
  const [slot] = await db
    .select()
    .from(auctionSlotsTable)
    .where(eq(auctionSlotsTable.id, params.data.id));
  if (!slot) {
    res.status(404).json({ error: "Slot not found" });
    return;
  }

  // Get the auction
  const [auction] = await db
    .select()
    .from(auctionsTable)
    .where(eq(auctionsTable.id, slot.auctionId));
  if (!auction) {
    res.status(404).json({ error: "Auction not found" });
    return;
  }

  const [updatedSlot] = await db
    .update(auctionSlotsTable)
    .set({ status: "unsold", updatedAt: new Date() })
    .where(eq(auctionSlotsTable.id, params.data.id))
    .returning();

  if (updatedSlot) {
    await db
      .update(playersTable)
      .set({ status: "unsold" })
      .where(eq(playersTable.id, updatedSlot.playerId));
  }

  await db
    .update(auctionsTable)
    .set({ currentPlayerId: null, currentSlotId: null })
    .where(eq(auctionsTable.id, slot.auctionId));

  stopTimer(slot.auctionId);

  const formattedSlot = await formatSlot(updatedSlot!);
  emitToAuction(slot.auctionId, "player:unsold", {
    slot: formattedSlot,
    player: formattedSlot.player,
  });
  res.json(formattedSlot);
});

// List auction slots (history)
router.get("/auctions/:id/slots", async (req, res): Promise<void> => {
  const params = ListAuctionSlotsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const slots = await db
    .select()
    .from(auctionSlotsTable)
    .where(eq(auctionSlotsTable.auctionId, params.data.id))
    .orderBy(desc(auctionSlotsTable.createdAt));

  const formatted = await Promise.all(slots.map(formatSlot));
  res.json(formatted);
});

// Get current slot
router.get("/auctions/:id/current-slot", async (req, res): Promise<void> => {
  const params = GetCurrentSlotParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [auction] = await db
    .select()
    .from(auctionsTable)
    .where(eq(auctionsTable.id, params.data.id));
  if (!auction || !auction.currentSlotId) {
    res.json(null);
    return;
  }
  const [slot] = await db
    .select()
    .from(auctionSlotsTable)
    .where(eq(auctionSlotsTable.id, auction.currentSlotId));
  if (!slot) {
    res.status(404).json({ error: "Slot not found" });
    return;
  }
  res.json(await formatSlot(slot));
});

// Get auction bids
router.get("/auctions/:id/bids", async (req, res): Promise<void> => {
  const params = GetAuctionBidsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const bids = await db
    .select({
      bid: bidsTable,
      team: teamsTable,
    })
    .from(bidsTable)
    .innerJoin(teamsTable, eq(bidsTable.teamId, teamsTable.id))
    .where(eq(bidsTable.auctionId, params.data.id))
    .orderBy(desc(bidsTable.createdAt));

  res.json(
    bids.map(({ bid, team }) => ({
      id: bid.id,
      auctionId: bid.auctionId,
      slotId: bid.slotId,
      teamId: bid.teamId,
      team: {
        id: team.id,
        name: team.name,
        shortName: team.shortName,
        primaryColor: team.primaryColor,
        secondaryColor: team.secondaryColor,
        logoUrl: team.logoUrl,
        purse: Number(team.purse),
        remainingPurse: Number(team.remainingPurse),
        maxPlayers: team.maxPlayers,
        maxOverseas: team.maxOverseas,
        ownerId: team.ownerId,
        ownerName: team.ownerName,
        createdAt: team.createdAt.toISOString(),
      },
      amount: Number(bid.amount),
      createdAt: bid.createdAt.toISOString(),
    })),
  );
});

// Get bids for a specific slot
router.get("/auctions/:id/slots/:slotId/bids", async (req, res): Promise<void> => {
  const params = GetSlotBidsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [slot] = await db
    .select()
    .from(auctionSlotsTable)
    .where(eq(auctionSlotsTable.id, params.data.slotId));

  if (!slot || slot.auctionId !== params.data.id) {
    res.status(404).json({ error: "Slot not found" });
    return;
  }

  const bids = await db
    .select({ bid: bidsTable, team: teamsTable })
    .from(bidsTable)
    .innerJoin(teamsTable, eq(bidsTable.teamId, teamsTable.id))
    .where(eq(bidsTable.slotId, params.data.slotId))
    .orderBy(desc(bidsTable.createdAt));

  res.json(
    bids.map(({ bid, team }) => ({
      id: bid.id,
      auctionId: bid.auctionId,
      slotId: bid.slotId,
      teamId: bid.teamId,
      team: {
        id: team.id,
        name: team.name,
        shortName: team.shortName,
        primaryColor: team.primaryColor,
        secondaryColor: team.secondaryColor,
        logoUrl: team.logoUrl,
        purse: Number(team.purse),
        remainingPurse: Number(team.remainingPurse),
        maxPlayers: team.maxPlayers,
        maxOverseas: team.maxOverseas,
        ownerId: team.ownerId,
        ownerName: team.ownerName,
        createdAt: team.createdAt.toISOString(),
      },
      amount: Number(bid.amount),
      createdAt: bid.createdAt.toISOString(),
    })),
  );
});

// Place a bid
router.post("/auctions/:id/bids", requireAuth, async (req, res): Promise<void> => {
  const params = PlaceBidParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = PlaceBidBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [auction] = await db
    .select()
    .from(auctionsTable)
    .where(eq(auctionsTable.id, params.data.id));
  if (!auction || auction.status !== "active") {
    res.status(400).json({ error: "Auction is not active" });
    return;
  }
  if (auction.currentSlotId !== body.data.slotId) {
    res.status(400).json({ error: "Slot is not active" });
    return;
  }

  const [slot] = await db
    .select()
    .from(auctionSlotsTable)
    .where(eq(auctionSlotsTable.id, body.data.slotId));
  if (!slot || slot.status !== "active") {
    res.status(400).json({ error: "Slot is not accepting bids" });
    return;
  }

  const minBid = slot.currentBid
    ? Number(slot.currentBid) + Number(auction.bidIncrementMin)
    : Number(slot.basePrice);

  if (body.data.amount < minBid) {
    res.status(400).json({ error: `Minimum bid is ${minBid}` });
    return;
  }

  const [team] = await db
    .select()
    .from(teamsTable)
    .where(eq(teamsTable.id, body.data.teamId));
  if (!team || Number(team.remainingPurse) < body.data.amount) {
    res.status(400).json({ error: "Insufficient purse" });
    return;
  }

  const [bid] = await db
    .insert(bidsTable)
    .values({
      auctionId: params.data.id,
      slotId: body.data.slotId,
      teamId: body.data.teamId,
      amount: String(body.data.amount),
    })
    .returning();

  // Update slot with new highest bid
  await db
    .update(auctionSlotsTable)
    .set({
      currentBid: String(body.data.amount),
      highestBidTeamId: body.data.teamId,
      bidCount: slot.bidCount + 1,
      updatedAt: new Date(),
    })
    .where(eq(auctionSlotsTable.id, body.data.slotId));

  const bidResult = {
    id: bid!.id,
    auctionId: bid!.auctionId,
    slotId: bid!.slotId,
    teamId: bid!.teamId,
    team: {
      id: team.id,
      name: team.name,
      shortName: team.shortName,
      primaryColor: team.primaryColor,
      secondaryColor: team.secondaryColor,
      logoUrl: team.logoUrl,
      purse: Number(team.purse),
      remainingPurse: Number(team.remainingPurse),
      maxPlayers: team.maxPlayers,
      maxOverseas: team.maxOverseas,
      ownerId: team.ownerId,
      ownerName: team.ownerName,
      createdAt: team.createdAt.toISOString(),
    },
    amount: body.data.amount,
    createdAt: bid!.createdAt.toISOString(),
  };

  const updatedSlot = await formatSlot({ ...slot, currentBid: String(body.data.amount), highestBidTeamId: body.data.teamId, bidCount: slot.bidCount + 1 });
  emitToAuction(params.data.id, "bid:placed", { bid: bidResult, slot: updatedSlot });

  // Reset countdown on every new bid
  resetTimer(params.data.id);

  res.status(201).json(bidResult);
});

export default router;
