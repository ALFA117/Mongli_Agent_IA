const ACCENT = {
  green: { value: "text-green-400", border: "border-green-400/15", glow: "shadow-[0_0_20px_rgba(74,222,128,0.06)]" },
  indigo: { value: "text-indigo-400", border: "border-indigo-400/15", glow: "" },
  amber: { value: "text-amber-400", border: "border-amber-400/15", glow: "" },
  slate: { value: "text-slate-300", border: "border-slate-600/30", glow: "" },
};

export default function StatCard({ label, value, sub, accent = "green", loading = false }) {
  const a = ACCENT[accent] ?? ACCENT.green;

  return (
    <div className={`glass-sm rounded-xl p-5 flex flex-col gap-1 border ${a.border} ${a.glow}`}>
      <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">{label}</span>
      {loading ? (
        <div className="shimmer h-8 w-24 rounded mt-1" />
      ) : (
        <span
          className={`text-2xl font-bold tabular-nums ${a.value}`}
          style={{ fontFamily: "Orbitron, monospace" }}
        >
          {value}
        </span>
      )}
      {sub && (
        <span className="text-xs font-mono text-slate-600">{sub}</span>
      )}
    </div>
  );
}
