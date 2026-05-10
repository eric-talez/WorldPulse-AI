import crypto from "node:crypto";
import type { Request, Response, NextFunction } from "express";

const SESSION_COOKIE = "fm_session";
const NONCE_COOKIE = "fm_nonce";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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

export function setSession(res: Response, walletAddress: string): void {
  const token = pack({ w: walletAddress.toLowerCase(), exp: Date.now() + SESSION_TTL_MS });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

export function clearSession(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

export function getSessionWallet(req: Request): string | null {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  const data = unpack<{ w: string; exp: number }>(token);
  if (!data) return null;
  if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
  return typeof data.w === "string" ? data.w : null;
}

export function setNonce(res: Response, nonce: string, walletAddress: string): void {
  const token = pack({ n: nonce, w: walletAddress.toLowerCase(), exp: Date.now() + 10 * 60 * 1000 });
  res.cookie(NONCE_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
    path: "/",
  });
}

export function consumeNonce(req: Request, res: Response): { nonce: string; walletAddress: string } | null {
  const token = req.cookies?.[NONCE_COOKIE];
  if (!token) return null;
  res.clearCookie(NONCE_COOKIE, { path: "/" });
  const data = unpack<{ n: string; w: string; exp: number }>(token);
  if (!data) return null;
  if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
  if (typeof data.n !== "string" || typeof data.w !== "string") return null;
  return { nonce: data.n, walletAddress: data.w };
}

export interface AuthedRequest extends Request {
  walletAddress: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const wallet = getSessionWallet(req);
  if (!wallet) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  (req as AuthedRequest).walletAddress = wallet;
  next();
}
