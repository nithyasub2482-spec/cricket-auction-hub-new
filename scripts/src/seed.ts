import { db, usersTable, teamsTable, playersTable, bidsTable, auctionSlotsTable, auctionsTable } from "../../lib/db/src/index.ts";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "cricket_salt_2024").digest("hex");
}

async function seed() {
  console.log("🧹 Clearing existing data...");

  // Delete all data in order of foreign key dependencies
  await db.delete(bidsTable);
  await db.delete(auctionSlotsTable);
  await db.delete(auctionsTable);
  await db.delete(usersTable);
  await db.delete(playersTable);
  await db.delete(teamsTable);

  console.log("✅ Existing data cleared");
  console.log("Seeding Mega Data...");

  // 1. Create Teams (Only 3 unique teams)
  console.log("Creating 3 unique teams...");
  const teams = await db.insert(teamsTable).values([
    { name: "Mumbai Indians", shortName: "MI", primaryColor: "#004BA0", purse: "100000000", remainingPurse: "100000000", ownerName: "Rajesh Masrani", ownerId: null },
    { name: "Chennai Super Kings", shortName: "CSK", primaryColor: "#FFFF00", purse: "100000000", remainingPurse: "100000000", ownerName: "N Srinivasan", ownerId: null },
    { name: "Rajasthan Royals", shortName: "RR", primaryColor: "#EA7260", purse: "100000000", remainingPurse: "100000000", ownerName: "Manoj Badale", ownerId: null }
  ]).returning();

  // 2. Create 30 Unique Players (NO DUPLICATES)
  console.log("Creating 30 unique players...");
  await db.insert(playersTable).values([
    // Indian Batsmen (6)
    { name: "Virat Kohli", country: "India", category: "batsman", basePrice: "2000000", battingStyle: "Right-hand bat", status: "unsold" },
    { name: "Rohit Sharma", country: "India", category: "batsman", basePrice: "1800000", battingStyle: "Right-hand bat", status: "unsold" },
    { name: "Suryakumar Yadav", country: "India", category: "batsman", basePrice: "1200000", battingStyle: "Right-hand bat", status: "unsold" },
    { name: "Hardik Pandya", country: "India", category: "all_rounder", basePrice: "1500000", battingStyle: "Right-hand bat", status: "unsold" },
    { name: "KL Rahul", country: "India", category: "batsman", basePrice: "1400000", battingStyle: "Right-hand bat", status: "unsold" },
    { name: "Rishabh Pant", country: "India", category: "wicket_keeper", basePrice: "1600000", battingStyle: "Left-hand bat", status: "unsold" },

    // Indian Bowlers (4)
    { name: "Jasprit Bumrah", country: "India", category: "bowler", basePrice: "1500000", bowlingStyle: "Right-arm fast", status: "unsold" },
    { name: "Bhuvneshwar Kumar", country: "India", category: "bowler", basePrice: "900000", bowlingStyle: "Right-arm medium", status: "unsold" },
    { name: "Yuzvendra Chahal", country: "India", category: "bowler", basePrice: "800000", bowlingStyle: "Right-arm legbreak", status: "unsold" },
    { name: "Mohammed Siraj", country: "India", category: "bowler", basePrice: "700000", bowlingStyle: "Right-arm fast", status: "unsold" },

    // Indian Wicket Keepers (2)
    { name: "MS Dhoni", country: "India", category: "wicket_keeper", basePrice: "2000000", battingStyle: "Right-hand bat", status: "unsold" },
    { name: "Ishan Kishan", country: "India", category: "wicket_keeper", basePrice: "1100000", battingStyle: "Left-hand bat", status: "unsold" },

    // Australian Players (5)
    { name: "Glenn Maxwell", country: "Australia", category: "all_rounder", basePrice: "1000000", battingStyle: "Right-hand bat", status: "unsold" },
    { name: "Marcus Stoinis", country: "Australia", category: "all_rounder", basePrice: "900000", battingStyle: "Right-hand bat", status: "unsold" },
    { name: "David Warner", country: "Australia", category: "batsman", basePrice: "1200000", battingStyle: "Left-hand bat", status: "unsold" },
    { name: "Steve Smith", country: "Australia", category: "batsman", basePrice: "1400000", battingStyle: "Right-hand bat", status: "unsold" },
    { name: "Pat Cummins", country: "Australia", category: "bowler", basePrice: "1100000", bowlingStyle: "Right-arm fast", status: "unsold" },

    // International Bowlers (4)
    { name: "Rashid Khan", country: "Afghanistan", category: "bowler", basePrice: "1500000", bowlingStyle: "Right-arm legbreak", status: "unsold" },
    { name: "Mustafizur Rahman", country: "Bangladesh", category: "bowler", basePrice: "800000", bowlingStyle: "Left-arm fast", status: "unsold" },
    { name: "Trent Boult", country: "New Zealand", category: "bowler", basePrice: "1000000", bowlingStyle: "Left-arm fast", status: "unsold" },
    { name: "Mark Wood", country: "England", category: "bowler", basePrice: "700000", bowlingStyle: "Right-arm fast", status: "unsold" },

    // Other Overseas (3)
    { name: "Shimron Hetmyer", country: "West Indies", category: "batsman", basePrice: "800000", battingStyle: "Left-hand bat", status: "unsold" },
    { name: "Romesh Shepherd", country: "West Indies", category: "bowler", basePrice: "600000", bowlingStyle: "Right-arm fast", status: "unsold" },
    { name: "Jason Roy", country: "England", category: "batsman", basePrice: "900000", battingStyle: "Right-hand bat", status: "unsold" },
    { name: "Eoin Morgan", country: "England", category: "batsman", basePrice: "600000", battingStyle: "Left-hand bat", status: "unsold" },

    // Young Indian Talents (4)
    { name: "Arjun Tendulkar", country: "India", category: "bowler", basePrice: "500000", bowlingStyle: "Left-arm medium", status: "unsold" },
    { name: "Yashasvi Jaiswal", country: "India", category: "batsman", basePrice: "700000", battingStyle: "Left-hand bat", status: "unsold" },
    { name: "Abhishek Sharma", country: "India", category: "all_rounder", basePrice: "600000", battingStyle: "Left-hand bat", status: "unsold" },
    { name: "Mukesh Kumar", country: "India", category: "bowler", basePrice: "550000", bowlingStyle: "Right-arm fast", status: "unsold" },

    // Additional International (2)
    { name: "Reece Topley", country: "England", category: "bowler", basePrice: "650000", bowlingStyle: "Left-arm fast", status: "unsold" },
    { name: "Tim Seifert", country: "New Zealand", category: "wicket_keeper", basePrice: "550000", battingStyle: "Right-hand bat", status: "unsold" }
  ]);

  // 3. Create Users
  console.log("Creating users...");

  // Get team IDs from the teams we just created
  const miTeam = teams.find(t => t.shortName === "MI");
  const cskTeam = teams.find(t => t.shortName === "CSK");
  const rrTeam = teams.find(t => t.shortName === "RR");

  await db.insert(usersTable).values([
    { email: "admin@cricket.com", name: "Super Admin", passwordHash: hashPassword("admin123"), role: "admin" },
    { email: "auctioneer@cricket.com", name: "Official Auctioneer", passwordHash: hashPassword("auction123"), role: "auctioneer" },
    { email: "mumbai@cricket.com", name: "Rajesh Masrani", passwordHash: hashPassword("mumbai@123"), role: "team_owner", teamId: miTeam?.id },
    { email: "chennai@cricket.com", name: "N Srinivasan", passwordHash: hashPassword("chennai@123"), role: "team_owner", teamId: cskTeam?.id },
    { email: "rajasthan@cricket.com", name: "Manoj Badale", passwordHash: hashPassword("rajasthan@123"), role: "team_owner", teamId: rrTeam?.id }
  ]);

  console.log("✅ Mega Seed complete!");
  console.log("📊 Created: 3 unique teams, 30 unique players, 5 user accounts");
  console.log("🚀 All duplicates removed!");
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
