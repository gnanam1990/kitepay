import { useEffect, useMemo, useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, getDefaultConfig, lightTheme } from "@rainbow-me/rainbowkit";
import {
  Link as LinkIcon,
  Zap,
  CheckCircle2,
  ArrowRight,
  Search,
  AlertTriangle,
} from "lucide-react";

import { kiteMainnet, kiteTestnet, type KiteNetwork } from "./lib/kite-chain";
import { decodeLink, linkUrl, type PaymentLinkData } from "./lib/payment-link";
import { formatUnits } from "viem";

import { SiteHeader } from "./components/site-header";
import { SiteFooter } from "./components/site-footer";
import { PaymentCard } from "./components/payment-card";
import { CreateLinkForm } from "./components/create-link-form";
import { LinkShareCard } from "./components/link-share-card";

const NETWORK_STORAGE_KEY = "kitepay:network";
const WALLETCONNECT_PROJECT_ID =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID";

const wagmiConfig = getDefaultConfig({
  appName: "KitePay",
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [kiteMainnet, kiteTestnet],
  ssr: false,
});

const queryClient = new QueryClient();

const rainbowTheme = lightTheme({
  accentColor: "#9B8564",
  accentColorForeground: "#FEF8F0",
  borderRadius: "medium",
  fontStack: "system",
  overlayBlur: "small",
});

type View =
  | { kind: "landing" }
  | { kind: "create" }
  | { kind: "share"; encoded: string }
  | { kind: "pay"; data: PaymentLinkData }
  | { kind: "not_found" };

function readView(): View {
  if (typeof window === "undefined") return { kind: "landing" };
  const path = window.location.pathname;
  const search = new URLSearchParams(window.location.search);

  if (path.startsWith("/p/")) {
    const encoded = path.slice(3);
    const data = decodeLink(encoded);
    return data ? { kind: "pay", data } : { kind: "not_found" };
  }
  const created = search.get("created");
  if (created) return { kind: "share", encoded: created };
  if (search.get("create") === "true") return { kind: "create" };
  return { kind: "landing" };
}

function readInitialNetwork(): KiteNetwork {
  if (typeof window === "undefined") return "mainnet";
  const search = new URLSearchParams(window.location.search);
  const urlNet = search.get("network");
  if (urlNet === "mainnet" || urlNet === "testnet") return urlNet;
  const stored = window.localStorage.getItem(NETWORK_STORAGE_KEY);
  return stored === "testnet" ? "testnet" : "mainnet";
}

function navigate(target: string) {
  window.history.pushState({}, "", target);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function LandingView({ network }: { network: KiteNetwork }) {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasted, setPasted] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);

  const handlePaste = () => {
    setPasteError(null);
    const trimmed = pasted.trim();
    if (!trimmed) return;
    try {
      const url = new URL(trimmed, window.location.origin);
      const path = url.pathname;
      if (path.startsWith("/p/")) {
        navigate(path + url.search);
        return;
      }
    } catch {
      // fall through
    }
    // Maybe they pasted just the encoded blob
    const data = decodeLink(trimmed);
    if (data) {
      navigate(`/p/${trimmed}`);
      return;
    }
    setPasteError("That doesn't look like a KitePay link. Make sure it starts with /p/.");
  };

  return (
    <div>
      <section className="kite-gradient border-b border-kite-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-kite-fg mb-5">
            Payments any agent can make.
          </h1>
          <p className="text-base sm:text-lg text-kite-fg/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Create a link. Share it. Agents (or humans) pay you in USDC.e on Kite. No checkout
            forms, no Stripe accounts, no chargebacks.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <button
              onClick={() => navigate("/?create=true")}
              className="h-12 px-6 rounded-xl bg-kite-primary text-kite-bg font-semibold text-sm tracking-tight shadow-sm hover:bg-kite-primary/90 transition-all duration-150 inline-flex items-center gap-2"
            >
              Create a payment link <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPasteOpen((v) => !v)}
              className="h-12 px-6 rounded-xl border border-kite-border bg-kite-bg/60 text-kite-fg font-semibold text-sm tracking-tight hover:bg-kite-bg transition-all duration-150 inline-flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              I have a link to pay
            </button>
          </div>

          {pasteOpen && (
            <div className="mt-6 max-w-xl mx-auto bg-kite-card border border-kite-border rounded-xl p-4 text-left">
              <label className="block text-xs uppercase tracking-widest text-kite-fg/50 font-semibold mb-1.5">
                Paste a KitePay link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pasted}
                  onChange={(e) => setPasted(e.target.value)}
                  placeholder="https://kitepay.app/p/…"
                  className="flex-1 bg-kite-bg border border-kite-border focus:border-kite-primary focus:outline-none rounded-md px-3 py-2 text-xs font-mono text-kite-fg"
                />
                <button
                  onClick={handlePaste}
                  className="px-3 rounded-md bg-kite-primary text-kite-bg text-xs font-semibold hover:bg-kite-primary/90 transition-colors"
                >
                  Open
                </button>
              </div>
              {pasteError && (
                <p className="text-xs text-kite-destructive mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {pasteError}
                </p>
              )}
            </div>
          )}

          <p className="text-xs text-kite-fg/45 mt-8 font-mono">
            {network === "mainnet" ? "Kite Mainnet · Chain 2366" : "Kite Testnet · Chain 2368"}
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <FeatureCard
            icon={LinkIcon}
            title="Stateless links"
            body="The link itself carries all payment data. No backend. No database. Just paste and pay."
          />
          <FeatureCard
            icon={Zap}
            title="Pay in seconds"
            body="One signature in your wallet. The recipient sees a KiteScan tx confirmation. Done."
          />
          <FeatureCard
            icon={CheckCircle2}
            title="Built for agents"
            body="Today: wallet payments. Tomorrow (v0.2): agents pay via kpass + x402 with no human in the loop."
          />
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="text-2xl font-bold tracking-tight text-kite-fg mb-6">How it works</h2>
        <ol className="space-y-4">
          {[
            "You create a link with a title, amount, and your recipient address.",
            "KitePay encodes that into a URL like /p/eyJ0byI6Ij…",
            "You share the URL. Whoever opens it sees the payment card and signs the transfer.",
            "The transaction settles on Kite Mainnet. You see the funds; they see the KiteScan link.",
          ].map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-kite-fg/80">
              <span className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-kite-primary/15 text-kite-primary text-xs font-mono font-bold">
                {i + 1}
              </span>
              <span className="leading-relaxed pt-1">{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof LinkIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-kite-card border border-kite-border rounded-xl p-5">
      <div className="w-9 h-9 rounded-lg bg-kite-primary/15 text-kite-primary flex items-center justify-center mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-base font-semibold tracking-tight text-kite-fg mb-1.5">{title}</h3>
      <p className="text-sm text-kite-fg/65 leading-relaxed">{body}</p>
    </div>
  );
}

function NotFoundView() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-20">
      <div className="max-w-md text-center">
        <AlertTriangle className="w-10 h-10 text-kite-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold tracking-tight text-kite-fg mb-2">
          Link not found
        </h1>
        <p className="text-sm text-kite-fg/65 mb-6">
          This payment link is malformed or incomplete. KitePay links are stateless — if any of
          the encoded data is missing, the link can't be reconstructed.
        </p>
        <button
          onClick={() => navigate("/")}
          className="h-10 px-5 rounded-lg bg-kite-primary text-kite-bg font-semibold text-sm hover:bg-kite-primary/90 transition-colors"
        >
          Back to KitePay
        </button>
      </div>
    </div>
  );
}

function ShareView({ encoded }: { encoded: string }) {
  const data = useMemo(() => decodeLink(encoded), [encoded]);
  if (!data) return <NotFoundView />;
  const url = linkUrl(data);
  const amountLabel = (() => {
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
    <div className="flex-1 flex items-start justify-center px-4 py-12">
      <LinkShareCard
        url={url}
        title={data.title}
        amountLabel={amountLabel}
        symbol={data.symbol}
        onCreateAnother={() => navigate("/?create=true")}
      />
    </div>
  );
}

function InnerApp() {
  const [view, setView] = useState<View>(() => readView());
  const [network, setNetwork] = useState<KiteNetwork>(() => readInitialNetwork());

  useEffect(() => {
    const onPop = () => setView(readView());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(NETWORK_STORAGE_KEY, network);
    }
  }, [network]);

  // If the payment-link encodes a network, prefer that for the pay view.
  const effectiveNetwork: KiteNetwork =
    view.kind === "pay" && view.data.network ? view.data.network : network;

  const toggleNetwork = () => {
    setNetwork((n) => (n === "mainnet" ? "testnet" : "mainnet"));
  };

  return (
    <div className="min-h-screen flex flex-col bg-kite-bg text-kite-fg">
      <SiteHeader network={effectiveNetwork} onToggleNetwork={toggleNetwork} />

      {view.kind === "landing" && <LandingView network={network} />}

      {view.kind === "create" && (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-xl mx-auto mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-kite-fg mb-2">
              Create a payment link
            </h1>
            <p className="text-sm text-kite-fg/65">
              Fill this in, get a shareable URL. Anyone with a Kite wallet can pay it.
            </p>
          </div>
          <CreateLinkForm
            network={network}
            onCreated={(encoded) => navigate(`/?created=${encoded}`)}
          />
        </main>
      )}

      {view.kind === "share" && (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ShareView encoded={view.encoded} />
        </main>
      )}

      {view.kind === "pay" && (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <PaymentCard data={view.data} network={effectiveNetwork} />
        </main>
      )}

      {view.kind === "not_found" && <NotFoundView />}

      <SiteFooter />
    </div>
  );
}

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rainbowTheme} appInfo={{ appName: "KitePay" }}>
          <InnerApp />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
