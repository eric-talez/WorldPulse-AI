import { eq } from "drizzle-orm";
import {
  db,
  usersTable,
  subscriptionsTable,
  type User,
  type Subscription,
} from "@workspace/db";

export type UserTier = "free" | "pro" | "enterprise";

export async function ensureUser(walletAddress: string): Promise<User> {
  const wallet = walletAddress.toLowerCase();
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.walletAddress, wallet));
  if (existing) {
    const [updated] = await db
      .update(usersTable)
      .set({ lastLoginAt: new Date() })
      .where(eq(usersTable.walletAddress, wallet))
      .returning();
    return updated!;
  }
  const [created] = await db
    .insert(usersTable)
    .values({ walletAddress: wallet, tier: "free" })
    .returning();
  return created!;
}

export async function setUserTier(walletAddress: string, tier: UserTier): Promise<User> {
  const [updated] = await db
    .update(usersTable)
    .set({ tier })
    .where(eq(usersTable.walletAddress, walletAddress.toLowerCase()))
    .returning();
  if (!updated) throw new Error(`User ${walletAddress} not found`);
  return updated;
}

export async function getActiveSubscription(walletAddress: string): Promise<Subscription | null> {
  const rows = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.walletAddress, walletAddress.toLowerCase()));
  const active = rows.find((r) => r.status === "ACTIVE" || r.status === "APPROVAL_PENDING" || r.status === "APPROVED");
  return active ?? null;
}

export function buildCurrentUser(user: User, subscription: Subscription | null) {
  return {
    walletAddress: user.walletAddress,
    tier: user.tier as UserTier,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    activeSubscription: subscription
      ? {
          paypalSubscriptionId: subscription.paypalSubscriptionId,
          plan: subscription.plan as UserTier,
          status: subscription.status,
          nextBillingAt: subscription.nextBillingAt,
        }
      : null,
  };
}
