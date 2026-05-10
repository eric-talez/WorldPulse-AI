import { createWalletClient, custom, type WalletClient } from "viem";
import { mainnet } from "viem/chains";

export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, cb: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, cb: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function getProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  return window.ethereum ?? null;
}

export function getWalletClient(): WalletClient | null {
  const provider = getProvider();
  if (!provider) return null;
  return createWalletClient({
    chain: mainnet,
    transport: custom(provider),
  });
}

export async function requestAccounts(): Promise<string[]> {
  const provider = getProvider();
  if (!provider) throw new WalletNotInstalledError();
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  return accounts;
}

export async function signMessage(address: string, message: string): Promise<string> {
  const provider = getProvider();
  if (!provider) throw new WalletNotInstalledError();
  const signature = (await provider.request({
    method: "personal_sign",
    params: [message, address],
  })) as string;
  return signature;
}

export class WalletNotInstalledError extends Error {
  constructor() {
    super("No EVM wallet detected. Please install MetaMask or another EVM wallet.");
  }
}

export function shortAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
