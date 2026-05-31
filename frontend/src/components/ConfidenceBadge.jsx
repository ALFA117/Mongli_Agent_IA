export default function ConfidenceBadge({ value }) {
  const n = Number(value);
  const style =
    n >= 85
      ? "text-green-400 bg-green-400/10 border-green-400/25"
      : n >= 70
      ? "text-amber-400 bg-amber-400/10 border-amber-400/25"
      : "text-red-400 bg-red-400/10 border-red-400/25";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-mono font-semibold tabular-nums ${style}`}
    >
      {n}%
    </span>
  );
}
