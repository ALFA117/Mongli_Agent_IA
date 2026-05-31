import { getSignalStyle } from "../lib/utils";

export default function SignalTypeBadge({ type, size = "sm" }) {
  const s = getSignalStyle(type);
  const py = size === "lg" ? "py-1" : "py-0.5";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 ${py} rounded-lg border text-xs font-mono whitespace-nowrap ${s.bg} ${s.border} ${s.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
      {s.label}
    </span>
  );
}
