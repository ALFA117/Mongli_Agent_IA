export default function ConfidenceBadge({ value }) {
  const n = Number(value);
  const color =
    n >= 85 ? "rgb(var(--accent))" :
    n >= 70 ? "rgb(var(--anomaly))" :
              "rgb(var(--danger))";

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className="text-xs font-mono font-semibold tabular-nums shrink-0 w-7 text-right"
        style={{ color }}
      >
        {n}%
      </span>
      <div className="w-14 h-0.5 rounded-full bg-line/5 overflow-hidden shrink-0">
        <div
          className="h-full rounded-full"
          style={{ width: `${n}%`, backgroundColor: color, transition: "width 400ms ease-out" }}
        />
      </div>
    </div>
  );
}
