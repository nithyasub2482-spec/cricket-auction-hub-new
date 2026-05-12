import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { LoginBody, CreateUserBody } from "@workspace/api-zod";
import { hashPassword, verifyPassword, generateToken } from "../lib/auth";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, parsed.data.email));

  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = generateToken(user.id, user.role);
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      teamId: user.teamId,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.authUser!.userId));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    teamId: user.teamId,
    createdAt: user.createdAt.toISOString(),
  });
});

router.get("/auth/users", requireAuth, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      teamId: u.teamId,
      createdAt: u.createdAt.toISOString(),
    })),
  );
});

router.post("/auth/users", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { password, ...rest } = parsed.data;
  const [user] = await db
    .insert(usersTable)
    .values({
      ...rest,
      passwordHash: hashPassword(password),
    })
    .returning();

  res.status(201).json({
    id: user!.id,
    email: user!.email,
    name: user!.name,
    role: user!.role,
    teamId: user!.teamId,
    createdAt: user!.createdAt.toISOString(),
  });
});

export default router;
