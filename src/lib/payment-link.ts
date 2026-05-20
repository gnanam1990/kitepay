import { isValidAddress } from "./kite-chain";

export interface PaymentLinkData {
  to: string;
  amount_raw: string;
  token: string;
  decimals: number;
  symbol: string;
  title: string;
  description?: string;
  network?: "mainnet" | "testnet";
  created_at?: number;
}

function utf8ToBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToUtf8(s: string): string {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeLink(data: PaymentLinkData): string {
  return utf8ToBase64Url(JSON.stringify(data));
}

export function decodeLink(encoded: string): PaymentLinkData | null {
  try {
    const parsed = JSON.parse(base64UrlToUtf8(encoded)) as PaymentLinkData;
    if (!parsed.to || !parsed.amount_raw || !parsed.title) return null;
    if (!isValidAddress(parsed.to)) return null;
    if (parsed.token && parsed.token !== "" && !isValidAddress(parsed.token)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function linkUrl(data: PaymentLinkData, origin = window.location.origin): string {
  return `${origin}/p/${encodeLink(data)}`;
}

export function isNativeKite(token: string): boolean {
  if (!token) return true;
  if (token === "") return true;
  if (token.toLowerCase() === "0x0000000000000000000000000000000000000000") return true;
  return false;
}
