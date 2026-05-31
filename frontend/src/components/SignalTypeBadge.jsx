import { getSignalStyle } from "../lib/utils";

export default function SignalTypeBadge({ type }) {
  const s = getSignalStyle(type);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-mono whitespace-nowrap ${s.bg} ${s.border} ${s.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}
