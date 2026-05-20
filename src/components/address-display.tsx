import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface AddressDisplayProps {
  address: string;
  charLimit?: number;
  className?: string;
  showFull?: boolean;
}

export function AddressDisplay({
  address,
  charLimit = 6,
  className = "",
  showFull = false,
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const displayAddress = showFull
    ? address
    : address.length > charLimit * 2
      ? `${address.substring(0, charLimit)}...${address.substring(address.length - 4)}`
      : address;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address", err);
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 font-mono text-sm ${className}`}>
      <span className="text-kite-fg/80">{displayAddress}</span>
      <button
        onClick={handleCopy}
        className="p-1 rounded hover:bg-kite-muted text-kite-fg/50 hover:text-kite-fg transition-colors duration-150 relative group"
        title="Copy address"
        aria-label="Copy address"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-kite-accent" />
        ) : (
          <Copy className="w-3.5 h-3.5 group-hover:scale-105 transition-transform" />
        )}
      </button>
    </div>
  );
}
