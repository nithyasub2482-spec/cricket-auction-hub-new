import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const auctionsTable = pgTable("auctions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  leagueName: text("league_name").notNull(),
  status: text("status", {
    enum: ["draft", "active", "paused", "completed"],
  })
    .notNull()
    .default("draft"),
  currentPlayerId: integer("current_player_id"),
  currentSlotId: integer("current_slot_id"),
  bidIncrementMin: numeric("bid_increment_min", { precision: 15, scale: 2 }).notNull().default("100000"),
  timerSeconds: integer("timer_seconds").notNull().default(30),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auctionSlotsTable = pgTable("auction_slots", {
  id: serial("id").primaryKey(),
  auctionId: integer("auction_id").notNull(),
  playerId: integer("player_id").notNull(),
  status: text("status", {
    enum: ["active", "sold", "unsold"],
  })
    .notNull()
    .default("active"),
  basePrice: numeric("base_price", { precision: 15, scale: 2 }).notNull(),
  currentBid: numeric("current_bid", { precision: 15, scale: 2 }),
  soldPrice: numeric("sold_price", { precision: 15, scale: 2 }),
  soldToTeamId: integer("sold_to_team_id"),
  highestBidTeamId: integer("highest_bid_team_id"),
  bidCount: integer("bid_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bidsTable = pgTable("bids", {
  id: serial("id").primaryKey(),
  auctionId: integer("auction_id").notNull(),
  slotId: integer("slot_id").notNull(),
  teamId: integer("team_id").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAuctionSchema = createInsertSchema(auctionsTable).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
});
export type InsertAuction = z.infer<typeof insertAuctionSchema>;
export type Auction = typeof auctionsTable.$inferSelect;

export const insertAuctionSlotSchema = createInsertSchema(auctionSlotsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAuctionSlot = z.infer<typeof insertAuctionSlotSchema>;
export type AuctionSlot = typeof auctionSlotsTable.$inferSelect;

export const insertBidSchema = createInsertSchema(bidsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertBid = z.infer<typeof insertBidSchema>;
export type Bid = typeof bidsTable.$inferSelect;
