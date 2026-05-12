import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const teamsTable = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  primaryColor: text("primary_color").notNull().default("#1a56db"),
  secondaryColor: text("secondary_color"),
  logoUrl: text("logo_url"),
  purse: numeric("purse", { precision: 15, scale: 2 }).notNull().default("1000000"),
  remainingPurse: numeric("remaining_purse", { precision: 15, scale: 2 }).notNull().default("1000000"),
  maxPlayers: integer("max_players").notNull().default(25),
  maxOverseas: integer("max_overseas").notNull().default(8),
  ownerId: integer("owner_id"),
  ownerName: text("owner_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTeamSchema = createInsertSchema(teamsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teamsTable.$inferSelect;
