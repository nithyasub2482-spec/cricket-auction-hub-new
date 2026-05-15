const crypto = require('crypto');
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const { usersTable, teamsTable, playersTable } = require('../lib/db/src/schema/index.ts');

const DATABASE_URL = 'postgresql://neondb_owner:npg_QDuUHk3Fsh5z@ep-wild-paper-aotrswl6-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

function hashPassword(password) {
  return crypto.createHash("sha256").update(password + "cricket_salt_2024").digest("hex");
}

async function seed() {
  console.log("Seeding Mega Data...");
  
  const pool = new Pool({ connectionString: DATABASE_URL });
  const schema = {
    usersTable, teamsTable, playersTable
  };
  const db = drizzle(pool, { schema });

  try {
    // 1. Create Teams
    console.log("Creating teams...");
    const teams = await db.insert(teamsTable).values([
      { name: "Mumbai Indians", shortName: "MI", primaryColor: "#004BA0", purse: "100000000", remainingPurse: "100000000", ownerName: "Rajesh Masrani", ownerId: null },
      { name: "Chennai Super Kings", shortName: "CSK", primaryColor: "#FFFF00", purse: "100000000", remainingPurse: "100000000", ownerName: "N Srinivasan", ownerId: null },
      { name: "Rajasthan Royals", shortName: "RR", primaryColor: "#EA7260", purse: "100000000", remainingPurse: "100000000", ownerName: "Manoj Badale", ownerId: null },
      { name: "Royal Challengers Bangalore", shortName: "RCB", primaryColor: "#EC1C24", purse: "100000000", remainingPurse: "100000000", ownerName: null, ownerId: null },
      { name: "Kolkata Knight Riders", shortName: "KKR", primaryColor: "#2E0854", purse: "100000000", remainingPurse: "100000000", ownerName: null, ownerId: null }
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
    const miTeam = teams.find(t => t.shortName === "MI");
    const cskTeam = teams.find(t => t.shortName === "CSK");
    const rrTeam = teams.find(t => t.shortName === "RR");

    await db.insert(usersTable).values([
      { email: "admin@cricket.com", name: "Super Admin", passwordHash: hashPassword("admin123"), role: "admin" },
      { email: "auctioneer@cricket.com", name: "Official Auctioneer", passwordHash: hashPassword("auction123"), role: "auctioneer" },
      { email: "mumbai@cricket.com", name: "Rajesh Masrani", passwordHash: hashPassword("mumbai@123"), role: "team_owner", teamId: miTeam?.id },
      { email: "chennai@cricket.com", name: "N Srinivasan", passwordHash: hashPassword("chennai@123"), role: "team_owner", teamId: cskTeam?.id },
      { email: "rajasthan@cricket.com", name: "Manoj Badale", passwordHash: hashPassword("rajasthan@123"), role: "team_owner", teamId: rrTeam?.id }
    ]).onConflictDoNothing();

    console.log("Mega Seed complete!");
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

seed();
