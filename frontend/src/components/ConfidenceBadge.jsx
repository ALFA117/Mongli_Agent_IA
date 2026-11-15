import { confidenceTone } from "../lib/utils";

export default function ConfidenceBadge({ value, wide = false }) {
  const n = Number(value);
  const t = confidenceTone(n);
  return (
    <div className="flex items-center gap-2.5 min-w-0" title={`${t.word} confidence`}>
      <span className={`num text-[14px] font-medium w-9 text-right shrink-0 ${t.text}`}>{n}%</span>
      <div className={`${wide ? "flex-1" : "w-16"} h-1.5 bg-surface-2 rounded-sm overflow-hidden shrink-0`}
        role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={n} aria-label="Confidence">
        <div className={`h-full ${t.bar}`} style={{ width: `${n}%`, transition: "width 500ms cubic-bezier(.2,.7,.2,1)" }} />
      </div>
    </div>
  );
}
