import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { env } from "../lib/env";

const COOKIE_NAME = "nubf_admin";

function sign(value: string): string {
  return crypto.createHmac("sha256", env.sessionSecret).update(value).digest("hex");
}

export function makeAdminToken(): string {
  const ts = Date.now().toString();
  const sig = sign(ts);
  return `${ts}.${sig}`;
}

export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  const [ts, sig] = token.split(".");
  if (!ts || !sig) return false;
  // 30-day session
  if (Date.now() - Number(ts) > 30 * 24 * 60 * 60 * 1000) return false;
  return sign(ts) === sig;
}

export function adminCookieName() {
  return COOKIE_NAME;
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!env.adminPassword) {
    res.status(503).json({ error: "ADMIN_PASSWORD is not configured" });
    return;
  }
  // In production, refuse to honor admin cookies signed with the dev fallback secret.
  if (process.env.NODE_ENV === "production" && env.sessionSecret === "dev-secret-change-me") {
    res.status(503).json({ error: "SESSION_SECRET is not configured" });
    return;
  }
  const token = req.cookies?.[COOKIE_NAME];
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
