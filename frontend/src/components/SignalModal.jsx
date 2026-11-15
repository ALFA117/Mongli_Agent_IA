import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ExternalLink, Copy, Check, History, FlaskConical, ShieldCheck } from "lucide-react";
import SignalTypeBadge from "./SignalTypeBadge";
import ConfidenceBadge from "./ConfidenceBadge";
import { shortAddress, explorerAddressUrl, explorerTxUrl, formatTime } from "../lib/utils";
import { IS_DEMO } from "../lib/contract";

function CopyField({ label, value, short, href }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  return (
    <div>
      <p className="label mb-1.5">{label}</p>
      <div className="flex items-center gap-1 rounded border border-line bg-surface-2 pl-3">
        <span className="num text-[14px] text-ink flex-1 min-w-0 truncate" title={value}>{short ?? value}</span>
        <button
          type="button"
          onClick={copy}
          className="h-11 w-11 shrink-0 inline-flex items-center justify-center text-ink-2 hover:text-ink"
          aria-label={copied ? "Copied" : `Copy ${label.toLowerCase()}`}
        >
          {copied ? <Check size={16} className="text-accent" /> : <Copy size={16} />}
        </button>
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 w-11 shrink-0 inline-flex items-center justify-center text-ink-2 hover:text-ink"
            aria-label="View on Mantle Explorer"
          >
            <ExternalLink size={16} />
          </a>
        )}
      </div>
    </div>
  );
}

export default function SignalModal({ signal, onClose, showWalletLink = true }) {
  const navigate = useNavigate();
  const closeRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const prev = document.activeElement;
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [onClose]);

  if (!signal) return null;

  const hasHash = signal.hash && signal.hash !== "0x" && signal.hash.length > 10;
  const isTxHash = signal.hash?.length === 66;
  const shortHash = hasHash ? `${signal.hash.slice(0, 12)}…${signal.hash.slice(-8)}` : "";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-ink/50 animate-fade" onClick={onClose} aria-hidden="true" />

      <div
        className="relative w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto bg-surface border border-ink rounded-t-md sm:rounded shadow-hard animate-rise"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signal-title"
      >
        <div className="sticky top-0 bg-surface border-b border-line flex items-center gap-3 pl-5 pr-2 py-2">
          <div className="flex-1 min-w-0">
            <p className="label">Signal #{signal.id} · {formatTime(signal.timestamp)}</p>
            <h2 id="signal-title" className="text-[20px] font-semibold leading-tight">Signal details</h2>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            className="h-11 w-11 inline-flex items-center justify-center rounded text-ink-2 hover:bg-surface-2 hover:text-ink"
            aria-label="Close details"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SignalTypeBadge type={signal.type} size="lg" />
            {IS_DEMO && (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-2">
                <FlaskConical size={14} aria-hidden="true" /> Sample signal
              </span>
            )}
          </div>

          <div>
            <p className="label mb-1.5">Confidence score</p>
            <ConfidenceBadge value={signal.confidence} wide />
          </div>

          {signal.reasoning && (
            <div>
              <p className="label mb-1.5">Agent reasoning</p>
              <p className="text-[16px] leading-7 text-ink">{signal.reasoning}</p>
            </div>
          )}

          <CopyField
            label="Target wallet"
            value={signal.wallet}
            short={shortAddress(signal.wallet)}
            href={IS_DEMO ? null : explorerAddressUrl(signal.wallet)}
          />

          {hasHash && (
            <CopyField
              label="Data hash (of the off-chain analysis)"
              value={signal.hash}
              short={shortHash}
              href={isTxHash && !IS_DEMO ? explorerTxUrl(signal.hash) : null}
            />
          )}

          <div className="flex gap-3 rounded border border-line bg-surface-2 p-4">
            {IS_DEMO
              ? <FlaskConical size={18} className="shrink-0 mt-0.5 text-ink-2" aria-hidden="true" />
              : <ShieldCheck size={18} className="shrink-0 mt-0.5 text-accent" aria-hidden="true" />}
            <p className="text-[14px] leading-6 text-ink-2">
              {IS_DEMO
                ? "This is demo data: the wallet and hash are placeholders, not a record on Mantle. Once the contract is deployed, each signal's data hash can be checked against the on-chain record."
                : "The data hash is a SHA-256 of the full off-chain analysis JSON. Anyone can verify the agent's reasoning by recomputing the hash from the raw signal data and comparing it with the on-chain record."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            {showWalletLink && (
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={() => { onClose(); navigate(`/wallet?address=${signal.wallet}`); }}
              >
                <History size={16} aria-hidden="true" /> Wallet history
              </button>
            )}
            {!IS_DEMO && (
              <a
                href={explorerAddressUrl(signal.wallet)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex-1"
              >
                <ExternalLink size={16} aria-hidden="true" /> Mantle Explorer
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
