import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { getActiveSessionWallet } from "./session";

const ADMIN_COOKIE = "fm_admin";
const ADMIN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  const s = process.env["SESSION_SECRET"];
  if (!s) throw new Error("SESSION_SECRET is required");
  return s;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function pack(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function unpack<T = Record<string, unknown>>(token: string): T | null {
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return null;
  const body = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = sign(body);
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

const isProd = process.env["NODE_ENV"] === "production";

export function getAdminCredentials(): { email: string; password: string } {
  return {
    email: process.env["ADMIN_EMAIL"] ?? "admin@futuremap.ai",
    password: process.env["ADMIN_PASSWORD"] ?? "futuremap-admin",
  };
}

export function checkAdminCredentials(email: string, password: string): boolean {
  const creds = getAdminCredentials();
  const a = Buffer.from(email);
  const b = Buffer.from(creds.email);
  const c = Buffer.from(password);
  const d = Buffer.from(creds.password);
  if (a.length !== b.length || c.length !== d.length) return false;
  return crypto.timingSafeEqual(a, b) && crypto.timingSafeEqual(c, d);
}

export function setAdminSession(res: Response, email: string): void {
  const token = pack({ e: email, exp: Date.now() + ADMIN_TTL_MS });
  res.cookie(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: ADMIN_TTL_MS,
    path: "/",
  });
}

export function clearAdminSession(res: Response): void {
  res.clearCookie(ADMIN_COOKIE, { path: "/" });
}

export function getAdminEmail(req: Request): string | null {
  const token = req.cookies?.[ADMIN_COOKIE];
  if (!token) return null;
  const data = unpack<{ e: string; exp: number }>(token);
  if (!data) return null;
  if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
  return typeof data.e === "string" ? data.e : null;
}

/**
 * Returns the lowercased set of wallet addresses that should be treated as
 * admins. Sourced from the `ADMIN_WALLETS` env var (comma-separated). This
 * lets a wallet user be elevated to admin without needing the email/password
 * login flow.
 */
export function getAdminWallets(): Set<string> {
  const raw = process.env["ADMIN_WALLETS"] ?? "";
  const out = new Set<string>();
  for (const piece of raw.split(",")) {
    const v = piece.trim().toLowerCase();
    if (v) out.add(v);
  }
  return out;
}

/**
 * Resolves the current admin identity. Either the email-based admin session,
 * OR a wallet session whose address is in `ADMIN_WALLETS` AND whose user
 * record is not suspended (`getActiveSessionWallet` returns null + clears the
 * session cookie when the wallet is deactivated, so suspended wallet users
 * cannot retain admin privileges). Returns null when the caller is not an
 * admin. Async because the suspension check hits the DB.
 */
export async function getAdminIdentity(
  req: Request,
  res: Response,
): Promise<string | null> {
  const email = getAdminEmail(req);
  if (email) return email;
  const adminWallets = getAdminWallets();
  if (adminWallets.size === 0) return null;
  const wallet = await getActiveSessionWallet(req, res);
  if (!wallet) return null;
  return adminWallets.has(wallet.toLowerCase()) ? wallet : null;
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (await getAdminIdentity(req, res)) {
    next();
    return;
  }
  res.status(401).json({ error: "Admin authentication required" });
}
