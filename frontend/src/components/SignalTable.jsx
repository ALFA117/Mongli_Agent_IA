import { ExternalLink } from "lucide-react";
import SignalTypeBadge from "./SignalTypeBadge";
import ConfidenceBadge from "./ConfidenceBadge";
import { shortAddress, explorerAddressUrl, formatTime, getSignalStyle } from "../lib/utils";

function SkeletonRow({ i }) {
  return (
    <tr>
      <td className="py-3 pl-4 pr-3"><div className="skeleton h-3 w-5 rounded" style={{ animationDelay: `${i * 60}ms` }} /></td>
      <td className="py-3 pr-4"><div className="skeleton h-5 w-32 rounded-lg" style={{ animationDelay: `${i * 60}ms` }} /></td>
      <td className="py-3 pr-4"><div className="skeleton h-3 w-28 rounded" style={{ animationDelay: `${i * 60}ms` }} /></td>
      <td className="py-3 pr-4"><div className="skeleton h-3 w-20 rounded" style={{ animationDelay: `${i * 60}ms` }} /></td>
      <td className="py-3 pr-4"><div className="skeleton h-3 w-14 rounded" style={{ animationDelay: `${i * 60}ms` }} /></td>
    </tr>
  );
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={5}>
        <div className="text-center py-16 font-mono text-sm text-slate-700">
          <div className="text-4xl mb-3" style={{ fontFamily: "Orbitron, monospace", color: "#0f2840" }}>—</div>
          No signals recorded yet
        </div>
      </td>
    </tr>
  );
}

export default function SignalTable({ signals = [], loading = false, onRowClick }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-mono min-w-[560px]">
        <thead>
          <tr className="border-b border-white/[0.04]">
            {["#", "Type", "Wallet", "Confidence", "Time"].map((h) => (
              <th key={h} className="text-left pb-3 pr-4 first:pl-4 section-label font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} i={i} />)
            : signals.length === 0
            ? <EmptyState />
            : signals.map((s, idx) => {
                const style = getSignalStyle(s.type);
                return (
                  <tr
                    key={s.id}
                    onClick={() => onRowClick?.(s)}
                    className={`signal-row ${style.rowClass} animate-fadeUp ${onRowClick ? "cursor-pointer" : ""}`}
                    style={{ animationDelay: `${idx * 35}ms`, animationFillMode: "both" }}
                    title={onRowClick ? "Click to view signal details" : undefined}
                  >
                    <td className="py-3 pl-4 pr-3 text-xs text-slate-700 tabular-nums">{s.id}</td>
                    <td className="py-3 pr-4">
                      <SignalTypeBadge type={s.type} />
                    </td>
                    <td className="py-3 pr-4">
                      <a
                        href={explorerAddressUrl(s.wallet)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 w-fit text-slate-400 hover:text-accent transition-colors duration-150 group cursor-pointer"
                        aria-label={`View ${s.wallet} on explorer`}
                      >
                        {shortAddress(s.wallet)}
                        <ExternalLink size={10} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                      </a>
                    </td>
                    <td className="py-3 pr-4">
                      <ConfidenceBadge value={s.confidence} />
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-600">{formatTime(s.timestamp)}</td>
                  </tr>
                );
              })
          }
        </tbody>
      </table>
    </div>
  );
}
