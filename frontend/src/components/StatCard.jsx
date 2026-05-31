import { useCountUp } from "../hooks/useCountUp";

const THEMES = {
  green:  { top: "glass-card-accent",  text: "text-accent",    border: "border-accent/15"   },
  blue:   { top: "glass-card-whale",   text: "text-sky-400",   border: "border-sky-400/15"  },
  amber:  { top: "glass-card-anomaly", text: "text-amber-400", border: "border-amber-400/15"},
  slate:  { top: "glass-card-accent",  text: "text-slate-300", border: "border-slate-600/20"},
};

function AnimatedValue({ raw, theme }) {
  const numeric = typeof raw === "number" ? raw : parseInt(raw, 10);
  const isNumeric = !isNaN(numeric);
  const animated = useCountUp(isNumeric ? numeric : 0);

  if (!isNumeric) {
    return <span className={`font-display text-2xl font-bold ${theme.text}`}>{raw}</span>;
  }

  const prefix = typeof raw === "string" && raw.startsWith("$") ? "$" : "";
  const suffix = typeof raw === "string" && raw.endsWith("%") ? "%" : "";

  return (
    <span className={`font-display text-2xl font-bold tabular-nums ${theme.text}`}>
      {prefix}{animated.toLocaleString()}{suffix}
    </span>
  );
}

export default function StatCard({ label, value, sub, accent = "green", loading = false }) {
  const t = THEMES[accent] ?? THEMES.green;

  return (
    <div className={`glass-card ${t.top} rounded-2xl p-5 overflow-hidden border ${t.border}`}>
      <p className="section-label mb-2">{label}</p>
      {loading ? (
        <div className="skeleton h-8 w-28 rounded-lg mt-1" />
      ) : (
        <AnimatedValue raw={value} theme={t} />
      )}
      {sub && (
        <p className="text-xs font-mono text-slate-700 mt-1">{sub}</p>
      )}
    </div>
  );
}
