import crypto from "crypto";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "cricket_salt_2024").digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateToken(userId: number, role: string): string {
  const payload = { userId, role, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64");
  const sig = crypto
    .createHmac("sha256", process.env["SESSION_SECRET"] ?? "fallback_secret")
    .update(data)
    .digest("hex");
  return `${data}.${sig}`;
}

export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    const [data, sig] = token.split(".");
    if (!data || !sig) return null;
    const expectedSig = crypto
      .createHmac("sha256", process.env["SESSION_SECRET"] ?? "fallback_secret")
      .update(data)
      .digest("hex");
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(data, "base64").toString("utf8"));
    if (Date.now() > payload.exp) return null;
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}
