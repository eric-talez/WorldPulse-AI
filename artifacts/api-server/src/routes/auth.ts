import { Router, type IRouter } from "express";
import crypto from "node:crypto";
import { verifyMessage, isAddress } from "viem";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  CreateAuthNonceBody,
  VerifyAuthSignatureBody,
} from "@workspace/api-zod";
import {
  setSession,
  clearSession,
  getActiveSessionWallet,
  setNonce,
  consumeNonce,
} from "../lib/session";
import { ensureUser, getActiveSubscription, buildCurrentUser } from "../lib/userTier";

const router: IRouter = Router();

function buildSiweMessage(walletAddress: string, nonce: string, host: string): string {
  const issuedAt = new Date().toISOString();
  return [
    `${host} wants you to sign in with your Ethereum account:`,
    walletAddress,
    "",
    "Sign in to FutureMap AI.",
    "",
    `URI: https://${host}`,
    `Version: 1`,
    `Chain ID: 1`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join("\n");
}

router.post("/auth/nonce", async (req, res): Promise<void> => {
  const parsed = CreateAuthNonceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const wallet = parsed.data.walletAddress;
  if (!isAddress(wallet)) {
    res.status(400).json({ error: "Invalid wallet address" });
    return;
  }
  const nonce = crypto.randomBytes(16).toString("hex");
  const host = req.get("host") ?? "futuremap.ai";
  const message = buildSiweMessage(wallet, nonce, host);
  setNonce(res, nonce, wallet);
  res.json({ nonce, message });
});

router.post("/auth/verify", async (req, res): Promise<void> => {
  const parsed = VerifyAuthSignatureBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const stored = consumeNonce(req, res);
  if (!stored) {
    res.status(401).json({ error: "Nonce expired or missing" });
    return;
  }
  const { message, signature } = parsed.data;
  if (!message.includes(`Nonce: ${stored.nonce}`)) {
    res.status(401).json({ error: "Nonce mismatch" });
    return;
  }
  let valid = false;
  try {
    valid = await verifyMessage({
      address: stored.walletAddress as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
  } catch {
    valid = false;
  }
  if (!valid) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }
  const wallet = stored.walletAddress.toLowerCase();
  const [existing] = await db
    .select({ deactivatedAt: usersTable.deactivatedAt, suspensionReason: usersTable.suspensionReason })
    .from(usersTable)
    .where(eq(usersTable.walletAddress, wallet));
  if (existing?.deactivatedAt) {
    res.status(403).json({
      error: "Account suspended",
      reason: existing.suspensionReason ?? null,
    });
    return;
  }
  const user = await ensureUser(wallet);
  setSession(res, user.walletAddress);
  const sub = await getActiveSubscription(user.walletAddress);
  res.json(buildCurrentUser(user, sub));
});

router.post("/auth/logout", (_req, res): void => {
  clearSession(res);
  res.status(204).end();
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const wallet = await getActiveSessionWallet(req, res);
  if (!wallet) {
    res.json({ user: null });
    return;
  }
  const user = await ensureUser(wallet);
  const sub = await getActiveSubscription(wallet);
  res.json({ user: buildCurrentUser(user, sub) });
});

export default router;
