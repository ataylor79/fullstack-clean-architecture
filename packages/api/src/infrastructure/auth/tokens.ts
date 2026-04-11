import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET ?? "dev-access-secret";
const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_BYTES = 48;
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function generateAccessToken(userId: string): string {
  return jwt.sign(
    { sub: userId, jti: crypto.randomUUID() },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL },
  );
}

export function verifyAccessToken(token: string): { sub: string } {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as { sub: string };
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
