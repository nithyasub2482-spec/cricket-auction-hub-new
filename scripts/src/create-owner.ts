import { db, usersTable, teamsTable } from "@workspace/db";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "cricket_salt_2024").digest("hex");
}

async function run() {
  // get first team
  const teams = await db.select().from(teamsTable).limit(1);
  if (teams.length === 0) {
    console.log("No teams found. Please create a franchise in the admin panel first.");
    process.exit(1);
  }
  const team = teams[0];
  
  await db.insert(usersTable).values({
    email: "owner@cricket.com",
    name: "Team Owner",
    passwordHash: hashPassword("owner123"),
    role: "team_owner",
    teamId: team.id
  }).onConflictDoUpdate({
    target: usersTable.email,
    set: { teamId: team.id, role: "team_owner" }
  });
  
  console.log(`Successfully created Team Owner account!`);
  console.log(`Email: owner@cricket.com`);
  console.log(`Password: owner123`);
  console.log(`Assigned to Team: ${team.name}`);
  process.exit(0);
}

run();
