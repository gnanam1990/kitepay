import type { KiteNetwork } from "./kite-chain";

const MAINNET_API = "https://kitescan.ai/api/v2";
const TESTNET_API = "https://testnet.kitescan.ai/api/v2";

function apiBase(network: KiteNetwork = "mainnet"): string {
  return network === "testnet" ? TESTNET_API : MAINNET_API;
}

export class KiteScanError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "KiteScanError";
    this.status = status;
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    if (res.status === 404) throw new KiteScanError("Not found", 404);
    throw new KiteScanError(`KiteScan ${res.status}`, res.status);
  }
  return res.json() as Promise<T>;
}

export interface BlockscoutTxStatus {
  status: "ok" | "error" | null;
  hash: string;
  block_number: number | null;
  timestamp: string | null;
}

export async function getTransaction(
  hash: string,
  network: KiteNetwork = "mainnet"
): Promise<BlockscoutTxStatus> {
  return fetchJson<BlockscoutTxStatus>(`${apiBase(network)}/transactions/${hash}`);
}
