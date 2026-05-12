import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playersTable = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  city: text("city"),
  age: integer("age"),
  category: text("category", {
    enum: ["batsman", "bowler", "all_rounder", "wicket_keeper"],
  }).notNull(),
  battingStyle: text("batting_style").notNull().default("Right-hand bat"),
  bowlingStyle: text("bowling_style").notNull().default("Right-arm medium"),
  basePrice: numeric("base_price", { precision: 15, scale: 2 }).notNull(),
  status: text("status", {
    enum: ["available", "sold", "unsold", "in_auction"],
  })
    .notNull()
    .default("available"),
  photoUrl: text("photo_url"),
  matches: integer("matches"),
  runs: integer("runs"),
  wickets: integer("wickets"),
  strikeRate: numeric("strike_rate", { precision: 8, scale: 2 }),
  economy: numeric("economy", { precision: 8, scale: 2 }),
  average: numeric("average", { precision: 8, scale: 2 }),
  fifties: integer("fifties"),
  hundreds: integer("hundreds"),
  rating: numeric("rating", { precision: 4, scale: 2 }),
  tags: text("tags").array().notNull().default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPlayerSchema = createInsertSchema(playersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof playersTable.$inferSelect;
