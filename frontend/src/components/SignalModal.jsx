import { useEffect, useCallback } from "react";
import { X, ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";
import SignalTypeBadge from "./SignalTypeBadge";
import ConfidenceBadge from "./ConfidenceBadge";
import { shortAddress, explorerAddressUrl, explorerTxUrl, formatTime, getSignalStyle } from "../lib/utils";

function HashRow({ label, value, explorerUrl }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const short = value.length > 20 ? `${value.slice(0, 12)}...${value.slice(-8)}` : value;

  return (
    <div>
      <p className="section-label mb-1.5">{label}</p>
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2.5"
        style={{ background: "rgba(2,13,24,0.8)", border: "1px solid rgba(0,255,136,0.08)" }}
      >
        <span className="text-xs font-mono text-slate-400 flex-1 break-all">{short}</span>
        <button
          onClick={copy}
          className="shrink-0 text-slate-600 hover:text-accent transition-colors cursor-pointer"
          aria-label="Copy to clipboard"
        >
          {copied ? <Check size={12} className="text-accent" /> : <Copy size={12} />}
        </button>
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-slate-600 hover:text-accent transition-colors cursor-pointer"
            aria-label="View on explorer"
          >
            <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}

export default function SignalModal({ signal, onClose }) {
  const handleKey = useCallback((e) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  if (!signal) return null;

  const s = getSignalStyle(signal.type);
  const isRealHash = signal.hash && signal.hash !== "0x" && signal.hash.length > 10;
  const isTxHash   = signal.hash?.length === 66;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 cursor-pointer"
        style={{ background: "rgba(2,13,24,0.75)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="glass-card glass-card-accent rounded-2xl p-6 max-w-lg w-full relative z-10 animate-slideDown"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
        role="dialog"
        aria-modal="true"
        aria-label="Signal details"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-600 hover:text-slate-300 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <SignalTypeBadge type={signal.type} size="lg" />
          <span className="text-slate-600 font-mono text-xs">Signal #{signal.id}</span>
          <span className="ml-auto text-slate-600 font-mono text-xs">
            {formatTime(signal.timestamp)}
          </span>
        </div>

        <div className="space-y-5">

          {/* Wallet */}
          <div>
            <p className="section-label mb-1.5">Target wallet</p>
            <a
              href={explorerAddressUrl(signal.wallet)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-mono text-sm text-slate-300 hover:text-accent transition-colors cursor-pointer group w-fit"
            >
              {shortAddress(signal.wallet)}
              <ExternalLink size={11} className="opacity-40 group-hover:opacity-100" />
            </a>
          </div>

          {/* Confidence */}
          <div>
            <p className="section-label mb-1.5">Confidence score</p>
            <div className="flex items-center gap-4">
              <ConfidenceBadge value={signal.confidence} />
              <div className="h-1.5 flex-1 rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${signal.confidence}%`, backgroundColor: signal.confidence >= 85 ? "#00ff88" : signal.confidence >= 70 ? "#fbbf24" : "#f87171", transition: "width 600ms ease-out" }}
                />
              </div>
            </div>
          </div>

          {/* Reasoning */}
          {signal.reasoning && (
            <div>
              <p className="section-label mb-1.5">Agent reasoning</p>
              <p className="text-xs font-mono text-slate-400 leading-relaxed">
                {signal.reasoning}
              </p>
            </div>
          )}

          {/* Data hash */}
          {isRealHash && (
            <HashRow
              label="Data hash (keccak256 of off-chain analysis)"
              value={signal.hash}
              explorerUrl={isTxHash ? explorerTxUrl(signal.hash) : null}
            />
          )}

          {/* Verification info */}
          <div
            className="rounded-xl px-4 py-3 text-xs font-mono"
            style={{ background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.08)" }}
          >
            <p className="text-accent/60 mb-1">On-chain verification</p>
            <p className="text-slate-600 leading-relaxed">
              The data hash is a SHA-256 of the full off-chain analysis JSON.
              Anyone can verify the agent's reasoning by recomputing the hash
              from the raw signal data and comparing with the on-chain record.
            </p>
          </div>

          {/* Explorer link */}
          <a
            href={explorerAddressUrl(signal.wallet)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-mono text-xs transition-all cursor-pointer"
            style={{
              background: `${s.accentHex}10`,
              border: `1px solid ${s.accentHex}25`,
              color: s.accentHex,
            }}
          >
            <ExternalLink size={12} />
            View wallet on Mantle Explorer
          </a>

        </div>
      </div>
    </div>
  );
}
