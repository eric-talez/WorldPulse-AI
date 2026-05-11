import React, { createContext, useCallback, useContext, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCurrentUser,
  getGetCurrentUserQueryKey,
  getCreateAuthNonceUrl,
  getVerifyAuthSignatureUrl,
  getLogoutUrl,
} from "@workspace/api-client-react";
import { requestAccounts, signMessage, WalletNotInstalledError } from "./wallet";

export type Tier = "free" | "pro" | "enterprise";

export interface CurrentUser {
  walletAddress: string;
  tier: Tier;
  createdAt: string;
  lastLoginAt: string;
  activeSubscription: null | {
    provider: "paypal" | "stripe";
    providerSubscriptionId: string;
    plan: Tier;
    status: string;
    nextBillingAt: string | null;
  };
}

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  connect: () => Promise<CurrentUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const { data, isLoading } = useGetCurrentUser({
    query: { staleTime: 30_000, retry: false, queryKey: getGetCurrentUserQueryKey() },
  });

  const user = (data?.user ?? null) as CurrentUser | null;

  const refresh = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
  }, [qc]);

  const connect = useCallback(async (): Promise<CurrentUser> => {
    const accounts = await requestAccounts();
    const address = accounts[0];
    if (!address) throw new WalletNotInstalledError();
    const nonceRes = await fetch(getCreateAuthNonceUrl(), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: address }),
    });
    if (!nonceRes.ok) throw new Error(`Nonce request failed: ${nonceRes.status}`);
    const { message } = (await nonceRes.json()) as { message: string };
    const signature = await signMessage(address, message);
    const verifyRes = await fetch(getVerifyAuthSignatureUrl(), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, signature }),
    });
    if (!verifyRes.ok) throw new Error(`Signature verification failed`);
    const verified = (await verifyRes.json()) as CurrentUser;
    qc.setQueryData(getGetCurrentUserQueryKey(), { user: verified });
    return verified;
  }, [qc]);

  const logout = useCallback(async () => {
    await fetch(getLogoutUrl(), { method: "POST", credentials: "include" });
    qc.setQueryData(getGetCurrentUserQueryKey(), { user: null });
  }, [qc]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading: isLoading, connect, logout, refresh }),
    [user, isLoading, connect, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
