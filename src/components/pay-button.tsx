import { useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { usePayment } from "../lib/payment";
import { TxStatus, type TxState } from "./tx-status";
import { kiteMainnet, kiteTestnet, type KiteNetwork } from "../lib/kite-chain";

interface PayButtonProps {
  token: string;
  to: string;
  amountRaw: bigint;
  amountLabel: string;
  symbol: string;
  network: KiteNetwork;
}

export function PayButton({ token, to, amountRaw, amountLabel, symbol, network }: PayButtonProps) {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { pay } = usePayment();
  const [state, setState] = useState<TxState>({ kind: "idle" });

  const targetChainId = network === "mainnet" ? kiteMainnet.id : kiteTestnet.id;
  const wrongNetwork = isConnected && chainId !== targetChainId;
  const selfPay = isConnected && address && address.toLowerCase() === to.toLowerCase();

  const handlePay = async () => {
    setState({ kind: "awaiting_signature" });
    try {
      if (wrongNetwork) {
        await switchChainAsync({ chainId: targetChainId });
      }
      const hash = await pay(token, to, amountRaw);
      setState({ kind: "pending", hash });
      // We optimistically promote to success after the wallet returns the hash; KitePay v0.1 doesn't poll for inclusion.
      setTimeout(() => setState({ kind: "success", hash }), 600);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message.split("\n")[0]
          : typeof err === "string"
            ? err
            : "Unknown error";
      setState({ kind: "failed", error: message });
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col gap-3 items-stretch">
        <p className="text-xs text-kite-fg/60 text-center">
          Connect a wallet to pay {amountLabel} {symbol}
        </p>
        <div className="self-center">
          <ConnectButton label="Connect wallet to pay" />
        </div>
      </div>
    );
  }

  if (selfPay) {
    return (
      <div className="px-4 py-3 rounded-lg bg-kite-muted border border-kite-border text-sm text-kite-fg/70">
        This is your own address — you can't pay yourself. Share the link with someone else.
      </div>
    );
  }

  const disabled = state.kind === "awaiting_signature" || state.kind === "pending";

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handlePay}
        disabled={disabled}
        className="w-full h-14 rounded-xl bg-kite-primary text-kite-bg font-semibold text-base tracking-tight shadow-sm hover:bg-kite-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 font-mono"
      >
        {wrongNetwork
          ? `Switch to Kite ${network === "mainnet" ? "Mainnet" : "Testnet"}, then pay`
          : `Pay ${amountLabel} ${symbol}`}
      </button>
      <TxStatus state={state} network={network} />
      {state.kind === "failed" && (
        <button
          onClick={() => setState({ kind: "idle" })}
          className="text-xs text-kite-fg/60 hover:text-kite-fg underline underline-offset-2 self-center"
        >
          Try again
        </button>
      )}
    </div>
  );
}
