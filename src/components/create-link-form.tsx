import { useMemo, useState } from "react";
import { parseUnits } from "viem";
import { useAccount } from "wagmi";
import { Wand2 } from "lucide-react";
import {
  MAINNET_USDC_ADDRESS,
  MAINNET_USDC_DECIMALS,
  TESTNET_USDT_ADDRESS,
  TESTNET_USDT_DECIMALS,
  isValidAddress,
  type KiteNetwork,
} from "../lib/kite-chain";
import { encodeLink, type PaymentLinkData } from "../lib/payment-link";

type TokenChoice = {
  id: string;
  label: string;
  description: string;
  address: string;
  decimals: number;
  symbol: string;
  network: KiteNetwork | "any";
};

const TOKEN_CHOICES: TokenChoice[] = [
  {
    id: "usdc-mainnet",
    label: "USDC.e (Mainnet)",
    description: "Bridged USDC on Kite Mainnet — 6 decimals",
    address: MAINNET_USDC_ADDRESS,
    decimals: MAINNET_USDC_DECIMALS,
    symbol: "USDC.e",
    network: "mainnet",
  },
  {
    id: "kite-native",
    label: "KITE (native)",
    description: "Native Kite token — works on either network",
    address: "",
    decimals: 18,
    symbol: "KITE",
    network: "any",
  },
  {
    id: "test-usdt",
    label: "Test USDT (Testnet)",
    description: "Testnet stablecoin — 18 decimals, for testing only",
    address: TESTNET_USDT_ADDRESS,
    decimals: TESTNET_USDT_DECIMALS,
    symbol: "tUSDT",
    network: "testnet",
  },
];

interface CreateLinkFormProps {
  network: KiteNetwork;
  onCreated: (encoded: string) => void;
}

export function CreateLinkForm({ network, onCreated }: CreateLinkFormProps) {
  const { address: connectedAddress } = useAccount();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [description, setDescription] = useState("");
  const [tokenId, setTokenId] = useState(
    network === "mainnet" ? "usdc-mainnet" : "test-usdt"
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const recipientToUse = recipient || connectedAddress || "";
  const token = useMemo(
    () => TOKEN_CHOICES.find((t) => t.id === tokenId) ?? TOKEN_CHOICES[0],
    [tokenId]
  );

  const availableTokens = TOKEN_CHOICES.filter(
    (t) => t.network === "any" || t.network === network
  );

  const recipientError =
    recipientToUse && !isValidAddress(recipientToUse) ? "Not a valid 0x address" : null;
  const titleError = title.length > 80 ? "Max 80 characters" : null;
  const descriptionError = description.length > 280 ? "Max 280 characters" : null;
  const amountError = (() => {
    if (!amount) return null;
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) return "Must be a positive number";
    return null;
  })();

  const canSubmit =
    title.trim() !== "" &&
    amount !== "" &&
    recipientToUse !== "" &&
    !recipientError &&
    !titleError &&
    !descriptionError &&
    !amountError;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!canSubmit) return;
    try {
      const amountRaw = parseUnits(amount, token.decimals).toString();
      const data: PaymentLinkData = {
        to: recipientToUse,
        amount_raw: amountRaw,
        token: token.address,
        decimals: token.decimals,
        symbol: token.symbol,
        title: title.trim(),
        description: description.trim() || undefined,
        network,
        created_at: Date.now(),
      };
      const encoded = encodeLink(data);
      onCreated(encoded);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not create link");
    }
  };

  const useConnectedAddress = () => {
    if (connectedAddress) setRecipient(connectedAddress);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-kite-muted/70 border border-kite-border rounded-xl px-4 py-3 mb-6 text-xs text-kite-fg/75 leading-relaxed">
        <strong className="font-semibold text-kite-fg">v0.1 is stateless.</strong> Link data is
        encoded in the URL itself — no server, no database. You can't edit a link after creating
        it; you just make a new one. Keeping it dumb on purpose.
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-kite-card border border-kite-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-5"
      >
        <div>
          <label htmlFor="title" className="block text-xs uppercase tracking-widest text-kite-fg/50 font-semibold mb-1.5">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Coffee Tutorial"
            maxLength={80}
            className="w-full bg-kite-bg border border-kite-border focus:border-kite-primary focus:outline-none focus:ring-1 focus:ring-kite-primary/40 rounded-md px-3 py-2 text-sm text-kite-fg placeholder-kite-fg/35 transition-colors"
          />
          {titleError && <p className="text-xs text-kite-destructive mt-1">{titleError}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
          <div>
            <label htmlFor="amount" className="block text-xs uppercase tracking-widest text-kite-fg/50 font-semibold mb-1.5">
              Amount
            </label>
            <input
              id="amount"
              type="number"
              step="any"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="5.00"
              className="w-full bg-kite-bg border border-kite-border focus:border-kite-primary focus:outline-none focus:ring-1 focus:ring-kite-primary/40 rounded-md px-3 py-2 text-sm font-mono text-kite-fg placeholder-kite-fg/35 transition-colors"
            />
            {amountError && <p className="text-xs text-kite-destructive mt-1">{amountError}</p>}
          </div>
          <div>
            <label htmlFor="token" className="block text-xs uppercase tracking-widest text-kite-fg/50 font-semibold mb-1.5">
              Token
            </label>
            <select
              id="token"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              className="w-full bg-kite-bg border border-kite-border focus:border-kite-primary focus:outline-none focus:ring-1 focus:ring-kite-primary/40 rounded-md px-3 py-2 text-sm text-kite-fg transition-colors"
            >
              {availableTokens.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-[11px] text-kite-fg/50 -mt-3">{token.description}</p>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="recipient" className="block text-xs uppercase tracking-widest text-kite-fg/50 font-semibold">
              Recipient address
            </label>
            {connectedAddress && (
              <button
                type="button"
                onClick={useConnectedAddress}
                className="text-[11px] font-mono text-kite-primary hover:text-kite-fg flex items-center gap-1"
              >
                <Wand2 className="w-3 h-3" /> Use connected
              </button>
            )}
          </div>
          <input
            id="recipient"
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder={connectedAddress ? `Defaults to ${connectedAddress.slice(0, 8)}…` : "0x…"}
            className="w-full bg-kite-bg border border-kite-border focus:border-kite-primary focus:outline-none focus:ring-1 focus:ring-kite-primary/40 rounded-md px-3 py-2 text-sm font-mono text-kite-fg placeholder-kite-fg/35 transition-colors"
          />
          {recipientError && <p className="text-xs text-kite-destructive mt-1">{recipientError}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-xs uppercase tracking-widest text-kite-fg/50 font-semibold mb-1.5">
            Note <span className="text-kite-fg/35 normal-case tracking-normal">(optional)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this for?"
            rows={3}
            maxLength={280}
            className="w-full bg-kite-bg border border-kite-border focus:border-kite-primary focus:outline-none focus:ring-1 focus:ring-kite-primary/40 rounded-md px-3 py-2 text-sm text-kite-fg placeholder-kite-fg/35 transition-colors resize-none"
          />
          <div className="flex justify-between text-[11px] text-kite-fg/45 mt-1">
            <span>{descriptionError ?? ""}</span>
            <span className="font-mono">{description.length} / 280</span>
          </div>
        </div>

        {submitError && (
          <div className="px-3 py-2 rounded-md bg-kite-destructive/10 border border-kite-destructive/30 text-kite-destructive text-xs">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full h-12 rounded-xl bg-kite-primary text-kite-bg font-semibold text-sm tracking-tight shadow-sm hover:bg-kite-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
        >
          Create payment link
        </button>
      </form>
    </div>
  );
}
