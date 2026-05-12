import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/auth";

declare module "express" {
  interface Request {
    authUser?: { userId: number; role: string };
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  req.authUser = payload;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.authUser || !roles.includes(req.authUser.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
