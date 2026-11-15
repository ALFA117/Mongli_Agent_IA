import { ChevronRight, ExternalLink, Inbox } from "lucide-react";
import SignalTypeBadge from "./SignalTypeBadge";
import ConfidenceBadge from "./ConfidenceBadge";
import StateBlock from "./StateBlock";
import { shortAddress, explorerAddressUrl, formatTime } from "../lib/utils";
import { IS_DEMO } from "../lib/contract";

function Wallet({ address }) {
  // Sample wallets are placeholders, not real Mantle accounts — linking them
  // to the explorer would "verify" nothing.
  if (IS_DEMO) return <span className="num text-[14px] text-ink">{shortAddress(address)}</span>;
  return (
    <a
      href={explorerAddressUrl(address)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 num text-[14px] text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
      aria-label={`View ${address} on Mantle Explorer`}
    >
      {shortAddress(address)}
      <ExternalLink size={12} aria-hidden="true" />
    </a>
  );
}

function Skeleton() {
  return (
    <ul className="divide-y divide-line" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 px-4 sm:px-5 py-4">
          <div className="skeleton h-4 w-6" />
          <div className="skeleton h-6 w-32" />
          <div className="skeleton h-4 w-28 hidden sm:block" />
          <div className="skeleton h-4 w-24 ml-auto" />
        </li>
      ))}
    </ul>
  );
}

export default function SignalTable({ signals = [], loading = false, onRowClick, emptyText }) {
  if (loading) return <Skeleton />;
  if (signals.length === 0)
    return (
      <StateBlock icon={Inbox} title="No signals yet">
        {emptyText ?? "When the agent records a signal it will appear here."}
      </StateBlock>
    );

  const open = (s) => onRowClick?.(s);
  const onKey = (e, s) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(s); }
  };

  return (
    <>
      {/* Desktop / tablet: table */}
      <table className="hidden sm:table w-full text-left">
        <thead>
          <tr className="border-b border-line bg-surface-2/60">
            {["#", "Type", "Wallet", "Confidence", "Time", ""].map((h, i) => (
              <th key={i} scope="col" className="label py-2.5 px-4 first:pl-5 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {signals.map((s) => (
            <tr
              key={s.id}
              className={onRowClick ? "row-click" : ""}
              onClick={() => open(s)}
              onKeyDown={(e) => onKey(e, s)}
              tabIndex={onRowClick ? 0 : undefined}
              aria-label={onRowClick ? `Signal ${s.id}, open details` : undefined}
            >
              <td className="py-3.5 pl-5 pr-4 num text-[13px] text-muted">{s.id}</td>
              <td className="py-3.5 px-4"><SignalTypeBadge type={s.type} /></td>
              <td className="py-3.5 px-4"><Wallet address={s.wallet} /></td>
              <td className="py-3.5 px-4"><ConfidenceBadge value={s.confidence} /></td>
              <td className="py-3.5 px-4 text-[14px] text-ink-2 whitespace-nowrap">{formatTime(s.timestamp)}</td>
              <td className="py-3.5 pr-5 pl-2 text-right text-muted">
                {onRowClick && <ChevronRight size={16} aria-hidden="true" className="inline" />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Phone: one tappable row per signal */}
      <ul className="sm:hidden divide-y divide-line">
        {signals.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => open(s)}
              className="row-click w-full min-h-[64px] flex items-center gap-3 px-4 py-3 text-left"
            >
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <SignalTypeBadge type={s.type} />
                  <span className="text-[13px] text-ink-2 whitespace-nowrap">{formatTime(s.timestamp)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="num text-[14px] text-ink">{shortAddress(s.wallet)}</span>
                  <ConfidenceBadge value={s.confidence} />
                </div>
              </div>
              <ChevronRight size={18} className="text-muted shrink-0" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
