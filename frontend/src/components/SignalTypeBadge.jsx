import { getSignalStyle } from "../lib/utils";

// Type is carried by text and a shape marker, colour is the third cue.
const MARK = {
  SMART_MONEY_IN: <path d="M5 1.5 9 8.5H1z" />,
  WHALE_MOVE:     <rect x="1.5" y="1.5" width="7" height="7" rx="1" />,
  ANOMALY:        <path d="M5 1 9 5 5 9 1 5z" />,
};

export default function SignalTypeBadge({ type, size = "sm" }) {
  const s = getSignalStyle(type);
  const pad = size === "lg" ? "px-2.5 py-1 text-[14px]" : "px-2 py-0.5 text-[13px]";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-sm font-medium whitespace-nowrap ${pad} ${s.bg} ${s.text}`}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
        {MARK[type] ?? <circle cx="5" cy="5" r="3.5" />}
      </svg>
      {s.label}
    </span>
  );
}
