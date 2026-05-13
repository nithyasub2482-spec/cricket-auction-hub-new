import { db, usersTable, teamsTable, playersTable } from "@workspace/db";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "cricket_salt_2024").digest("hex");
}

async function seed() {
  console.log("Seeding Mega Data...");

  // 1. Create Teams
  console.log("Creating teams...");
  const teams = await db.insert(teamsTable).values([
    { name: "Mumbai Indians", shortName: "MI", primaryColor: "#004BA0", purse: "100000000", remainingPurse: "100000000" },
    { name: "Chennai Super Kings", shortName: "CSK", primaryColor: "#FFFF00", purse: "100000000", remainingPurse: "100000000" },
    { name: "Royal Challengers Bangalore", shortName: "RCB", primaryColor: "#EC1C24", purse: "100000000", remainingPurse: "100000000" },
    { name: "Kolkata Knight Riders", shortName: "KKR", primaryColor: "#2E0854", purse: "100000000", remainingPurse: "100000000" }
  ]).returning();

  // 2. Create Players
  console.log("Creating players...");
  await db.insert(playersTable).values([
    { name: "Virat Kohli", country: "India", category: "batsman", basePrice: "2000000", battingStyle: "Right-hand bat", status: "unsold" },
    { name: "MS Dhoni", country: "India", category: "wicket_keeper", basePrice: "2000000", battingStyle: "Right-hand bat", status: "unsold" },
    { name: "Jasprit Bumrah", country: "India", category: "bowler", basePrice: "1500000", bowlingStyle: "Right-arm fast", status: "unsold" },
    { name: "Rashid Khan", country: "Afghanistan", category: "bowler", basePrice: "1500000", bowlingStyle: "Right-arm legbreak", status: "unsold" },
    { name: "Glenn Maxwell", country: "Australia", category: "all_rounder", basePrice: "1000000", battingStyle: "Right-hand bat", status: "unsold" }
  ]);

  // 3. Create Users
  console.log("Creating users...");
  await db.insert(usersTable).values([
    { email: "admin@cricket.com", name: "Super Admin", passwordHash: hashPassword("admin123"), role: "admin" },
    { email: "auctioneer@cricket.com", name: "Official Auctioneer", passwordHash: hashPassword("auction123"), role: "auctioneer" }
  ]).onConflictDoNothing();

  console.log("Mega Seed complete! Refresh your website.");
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
