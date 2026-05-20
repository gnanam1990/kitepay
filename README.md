# KitePay

Stripe-style payment links on the [Kite](https://gokite.ai) blockchain. Sister project to [AgentID](https://agentid-seven.vercel.app) and [KiteLeaderboard](https://kiteleaderboard.vercel.app).

Create a payment link with a title + amount + recipient. Share the URL. Anyone with a Kite-compatible wallet pays in USDC.e (mainnet), Test USDT (testnet), or native KITE.

## Live deployment

- Web app: <https://kitepay-weld.vercel.app>
- Host: Vercel (`kitepay`)
- Build: `pnpm build`
- Output: `dist`

## v0.1 scope

- **Stateless** — link data is encoded into the URL itself (`/p/{base64}`). No backend, no database.
- **Wallet-based payments only.** Agent flow (kpass session + x402 auto-pay) is **PREVIEW**, lands in v0.2.
- Mainnet ↔ Testnet toggle persisted in localStorage.
- Connect wallet via [RainbowKit](https://rainbowkit.com), sign tx via [wagmi](https://wagmi.sh).

## Stack

Vite 8 + React 19 + TypeScript + Tailwind v4. wagmi 2 + viem 2 + RainbowKit 2. `qrcode.react` for the share QR. Same warm sand/cream/olive palette and Geist typography as AgentID.

## Develop

```bash
pnpm install
pnpm dev      # http://localhost:3010
pnpm build
pnpm lint     # tsc --noEmit
```

**Before deploying to mainnet:** swap the WalletConnect placeholder in `src/App.tsx` (`WALLETCONNECT_PROJECT_ID`) for a real one from <https://cloud.walletconnect.com>.

## Token addresses

| Network  | Token   | Address                                        | Decimals |
| -------- | ------- | ---------------------------------------------- | -------- |
| Mainnet  | USDC.e  | `0x7aB6f3ed87C42eF0aDb67Ed95090f8bF5240149e`   | 6        |
| Testnet  | tUSDT   | `0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63`   | 18       |
| Either   | KITE    | (native, no contract)                          | 18       |

## How the link encoding works

A payment link looks like `/p/{base64url-encoded-json}`. The JSON carries `to`, `amount_raw` (wei), `token` contract address, `decimals`, `symbol`, `title`, optional `description`, and the network it was created on. The decode + payment flow happens entirely client-side. Anyone with the URL can verify the data and pay.
