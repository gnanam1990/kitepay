# KitePay

> Stripe-style payment links on the Kite blockchain — create a link, share the URL, get paid in stablecoins or native KITE.

## Overview

KitePay is a stateless payment-link dApp for the [Kite](https://gokite.ai) blockchain. You enter a title, amount, and recipient address; KitePay encodes that into a shareable URL. Anyone who opens the link connects a Kite-compatible wallet and pays in a single signature. There is no backend and no database — every link carries its own payment data, so the app is purely client-side.

## Features

- **Stateless payment links** — the full payment payload (recipient, amount, token, decimals, symbol, title, optional note, network) is base64url-encoded into the URL path (`/p/{encoded}`). No server or database is involved.
- **One-signature payments** — pay ERC-20 tokens via `transfer`, or send native KITE directly, using the connected wallet.
- **Multiple tokens** — USDC.e (bridged USDC on Kite Mainnet), Test USDT (testnet), and native KITE.
- **Mainnet / Testnet toggle** — switch networks in the header; the choice is persisted in `localStorage` and can be overridden via a `?network=` query param or per-link.
- **Wallet connection** via RainbowKit, with automatic network switching when the connected chain does not match the link's network.
- **Share view with QR code** — after creating a link you get a copyable URL and a scannable QR.
- **Link validation** — malformed or incomplete links resolve to a "Link not found" state; encoded data is sanity-checked (valid `0x` address, positive integer amount, sane decimals) on decode.

## Tech stack

- **Vite 8** + **React 19** + **TypeScript**
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **wagmi 2** + **viem 2** for chain interaction
- **RainbowKit 2** for wallet connection
- **@tanstack/react-query** (wagmi peer)
- **qrcode.react** for the share QR
- **lucide-react** for icons

## Getting started

### Prerequisites

- Node.js (an LTS release is recommended)
- [pnpm](https://pnpm.io) (the repo ships a `pnpm-lock.yaml`)

### Installation

```bash
pnpm install
```

### Configuration

KitePay reads the following environment variables (Vite-exposed vars must be prefixed with `VITE_`):

| Variable                        | Purpose                                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project id used by RainbowKit. Falls back to a placeholder if unset — set a real id before deploying. |
| `DISABLE_HMR`                   | Optional. Set to `true` to disable Vite HMR and file watching during development.                         |

There is no `.env.example` in the repo; create a `.env` (or `.env.local`) with the variables above as needed.

### Running

```bash
pnpm dev        # dev server on http://localhost:3010
pnpm build      # production build to dist/
pnpm preview    # serve the built output
pnpm lint       # type-check only (tsc --noEmit)
```

## Usage

1. **Create a link.** From the landing page, choose *Create a payment link*, fill in a title, amount, token, and recipient address (or use your connected address), and submit.
2. **Share it.** KitePay encodes the payment data into a URL of the form `/p/{base64url}` and shows a copyable link plus a QR code.
3. **Pay.** Whoever opens the link sees a payment card, connects a wallet, and signs the transfer. ERC-20 tokens are paid via `transfer`; native KITE is sent directly.
4. **Confirm.** After the wallet returns a transaction hash, the UI shows a KiteScan link for the transaction.

### Link encoding

A link's path segment is the base64url encoding of a JSON object with these fields: `to`, `amount_raw` (smallest-unit integer string), `token` (contract address; empty for native KITE), `decimals`, `symbol`, `title`, optional `description`, optional `network`, and optional `created_at`. Decoding and validation happen entirely client-side, so anyone with the URL can inspect and pay it.

### Networks and tokens

| Network         | Chain ID | RPC                              | Explorer                       |
| --------------- | -------- | -------------------------------- | ------------------------------ |
| Kite Mainnet    | 2366     | `https://rpc.gokite.ai`          | `https://kitescan.ai`          |
| Kite Testnet    | 2368     | `https://rpc-testnet.gokite.ai`  | `https://testnet.kitescan.ai`  |

| Network  | Token  | Address                                        | Decimals |
| -------- | ------ | ---------------------------------------------- | -------- |
| Mainnet  | USDC.e | `0x7aB6f3ed87C42eF0aDb67Ed95090f8bF5240149e`   | 6        |
| Testnet  | tUSDT  | `0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63`   | 18       |
| Either   | KITE   | native (no contract)                           | 18       |

## Project structure

```
src/
  App.tsx                  # routing (path/query-based), providers, landing/create/share/pay views
  main.tsx                 # React entry point
  lib/
    kite-chain.ts          # Kite chain definitions, token addresses, explorer helpers
    payment-link.ts        # base64url encode/decode + validation of link data
    payment.ts             # usePayment hook (ERC-20 transfer / native send)
    erc20-abi.ts           # minimal ERC-20 ABI
    kitescan-api.ts        # KiteScan (Blockscout) transaction lookup helper
    cache.ts               # small in-memory TTL cache
  components/              # site chrome, create form, payment/share cards, tx status, etc.
public/brand/             # logo assets
```

## Status

**v0.1 — preview / MVP, stateless.** What is real today:

- Wallet-based payments only: create, share, connect, and sign transfers for ERC-20 tokens or native KITE.
- Mainnet and Testnet support with a persisted toggle.

Known limitations:

- **Optimistic confirmation.** After the wallet returns a transaction hash, the UI optimistically shows "Payment sent" without polling the chain for inclusion. A failed or dropped transaction may still display the success state; always verify on KiteScan. (A KiteScan transaction-status helper exists in `lib/kitescan-api.ts` but is not yet wired into the pay flow.)
- **Agent auto-pay is not implemented.** The "Agent flow" (kpass session + x402 auto-pay) is labeled as a preview targeted for v0.2; today only wallet signatures are supported.
- No on-chain or server-side record of links — links exist only as URLs.

## License

No license specified.
