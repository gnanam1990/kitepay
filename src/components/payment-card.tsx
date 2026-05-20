import { formatUnits } from "viem";
import { AddressDisplay } from "./address-display";
import { PayButton } from "./pay-button";
import { PreviewBadge } from "./preview-badge";
import type { PaymentLinkData } from "../lib/payment-link";
import type { KiteNetwork } from "../lib/kite-chain";

interface PaymentCardProps {
  data: PaymentLinkData;
  network: KiteNetwork;
}

export function PaymentCard({ data, network }: PaymentCardProps) {
  const amountFormatted = (() => {
    try {
      return parseFloat(formatUnits(BigInt(data.amount_raw), data.decimals)).toLocaleString(
        "en-US",
        { maximumFractionDigits: 6 }
      );
    } catch {
      return "—";
    }
  })();

  return (
    <div className="w-full max-w-xl mx-auto bg-kite-card border border-kite-border rounded-2xl shadow-sm p-6 sm:p-10">
      <div className="text-xs font-bold uppercase tracking-widest text-kite-fg/45 mb-3">
        Payment request
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-kite-fg mb-6 break-words">
        {data.title}
      </h1>

      <div className="space-y-5 mb-8">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-kite-fg/45 font-semibold mb-1">
            To
          </div>
          <AddressDisplay address={data.to} className="text-base" />
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-widest text-kite-fg/45 font-semibold mb-1">
            Amount
          </div>
          <div className="font-mono font-bold text-4xl sm:text-5xl tracking-tight text-kite-fg tabular-nums break-all">
            {amountFormatted}{" "}
            <span className="text-kite-fg/40 text-2xl sm:text-3xl font-medium">{data.symbol}</span>
          </div>
        </div>

        {data.description && (
          <div>
            <div className="text-[11px] uppercase tracking-widest text-kite-fg/45 font-semibold mb-1">
              Note
            </div>
            <p className="text-sm text-kite-fg/75 leading-relaxed whitespace-pre-wrap">
              {data.description}
            </p>
          </div>
        )}
      </div>

      <PayButton
        token={data.token}
        to={data.to}
        amountRaw={BigInt(data.amount_raw)}
        amountLabel={amountFormatted}
        symbol={data.symbol}
        network={network}
      />

      <div className="mt-6 pt-5 border-t border-kite-border/60 text-xs text-kite-fg/55 leading-relaxed">
        <div className="flex items-center gap-2 mb-1.5">
          <PreviewBadge
            label="Agent flow"
            tooltip="Auto-pay via kpass session + x402 lands in v0.2. v0.1 is wallet-based only."
          />
          <span className="font-semibold uppercase tracking-wider text-[10px]">v0.2</span>
        </div>
        <p>
          Agent-callable payments (kpass session + x402 auto-pay) are coming in v0.2. Today, only
          wallet signatures.
        </p>
      </div>
    </div>
  );
}
