import { ExternalLink } from "lucide-react";
import ConfidenceBadge from "./ConfidenceBadge";
import SignalTypeBadge from "./SignalTypeBadge";
import { shortAddress, explorerAddressUrl, formatTime, getSignalStyle } from "../lib/utils";

function SkeletonRow({ delay = 0 }) {
  return (
    <tr style={{ animationDelay: `${delay}ms` }}>
      <td className="py-3 pr-4"><div className="shimmer h-3 w-6 rounded" /></td>
      <td className="py-3 pr-4"><div className="shimmer h-5 w-28 rounded" /></td>
      <td className="py-3 pr-4"><div className="shimmer h-3 w-32 rounded" /></td>
      <td className="py-3 pr-4"><div className="shimmer h-5 w-12 rounded" /></td>
      <td className="py-3"><div className="shimmer h-3 w-16 rounded" /></td>
    </tr>
  );
}

function EmptyRow() {
  return (
    <tr>
      <td colSpan={5}>
        <div className="text-center py-16 font-mono text-sm text-slate-600">
          <div className="text-3xl mb-3 text-slate-800">—</div>
          No signals recorded yet
        </div>
      </td>
    </tr>
  );
}

export default function SignalTable({ signals = [], loading = false }) {
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="border-b border-slate-700/40">
            <th className="text-left pb-3 pr-4 text-xs font-medium text-slate-600 uppercase tracking-widest">#</th>
            <th className="text-left pb-3 pr-4 text-xs font-medium text-slate-600 uppercase tracking-widest">Type</th>
            <th className="text-left pb-3 pr-4 text-xs font-medium text-slate-600 uppercase tracking-widest">Wallet</th>
            <th className="text-left pb-3 pr-4 text-xs font-medium text-slate-600 uppercase tracking-widest">Confidence</th>
            <th className="text-left pb-3 text-xs font-medium text-slate-600 uppercase tracking-widest">Time</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} delay={i * 60} />)
          ) : signals.length === 0 ? (
            <EmptyRow />
          ) : (
            signals.map((s) => {
              const style = getSignalStyle(s.type);
              return (
                <tr
                  key={s.id}
                  className={`signal-row ${style.rowAccent} animate-fade_in`}
                >
                  <td className="py-3 pr-4 text-slate-600 text-xs tabular-nums">{s.id}</td>
                  <td className="py-3 pr-4">
                    <SignalTypeBadge type={s.type} />
                  </td>
                  <td className="py-3 pr-4">
                    <a
                      href={explorerAddressUrl(s.wallet)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 w-fit text-slate-300 hover:text-green-400 transition-colors duration-150 group cursor-pointer"
                    >
                      {shortAddress(s.wallet)}
                      <ExternalLink
                        size={10}
                        className="opacity-0 group-hover:opacity-60 transition-opacity"
                      />
                    </a>
                  </td>
                  <td className="py-3 pr-4">
                    <ConfidenceBadge value={s.confidence} />
                  </td>
                  <td className="py-3 text-slate-500 text-xs">{formatTime(s.timestamp)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
