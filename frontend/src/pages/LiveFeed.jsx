import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Radio, Layers } from "lucide-react";
import StatCard from "../components/StatCard";
import SignalTable from "../components/SignalTable";
import SignalTypeBadge from "../components/SignalTypeBadge";
import { fetchRecentSignals, fetchTotalSignals } from "../lib/contract";
import { SIGNAL_STYLES, getSignalStyle } from "../lib/utils";

const REFRESH_MS = 30_000;

/* ── Breakdown card ─────────────────────────────────────────────────── */
function BreakdownCard({ type, count, total, idx }) {
  const s = getSignalStyle(type);
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div
      className={`glass-card ${s.cardClass} rounded-2xl p-4 overflow-hidden border ${s.border} animate-fadeUp`}
      style={{ animationDelay: `${idx * 80}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-center justify-between mb-3">
        <SignalTypeBadge type={type} />
        <span className={`text-xs font-mono ${s.color} opacity-60`}>{pct}%</span>
      </div>
      <div className="flex items-end gap-2 mb-2">
        <span className={`font-display text-3xl font-bold ${s.color}`}>{count}</span>
        <span className="text-xs font-mono text-slate-600 mb-1">signals</span>
      </div>
      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: s.accentHex, transition: "width 800ms ease-out" }}
        />
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */
export default function LiveFeed() {
  const [signals,     setSignals]     = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing,  setRefreshing]  = useState(false);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const [sigs, tot] = await Promise.all([fetchRecentSignals(20), fetchTotalSignals()]);
      setSignals(sigs);
      setTotal(tot);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("LiveFeed:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const smartMoney = signals.filter((s) => s.type === "SMART_MONEY_IN").length;
  const whaleMoves = signals.filter((s) => s.type === "WHALE_MOVE").length;
  const anomalies  = signals.filter((s) => s.type === "ANOMALY").length;
  const avgConf    = signals.length
    ? Math.round(signals.reduce((a, s) => a + s.confidence, 0) / signals.length)
    : 0;
  const timeLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—";

  return (
    <div className="space-y-7">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slideDown">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.25)", boxShadow: "0 0 16px rgba(0,255,136,0.12)" }}
          >
            <Radio size={18} className="text-accent" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-slate-100 tracking-wide">
              Signal Intelligence
            </h1>
            <p className="text-xs font-mono text-slate-600 mt-0.5">
              Real-time on-chain AI monitoring · Mantle Network
            </p>
          </div>
        </div>

        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-xl glass-panel text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors cursor-pointer disabled:opacity-40 self-start sm:self-auto"
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
          Updated {timeLabel}
        </button>
      </div>

      {/* ── KPI row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "On-Chain Signals", value: total,    sub: "all time recorded",     accent: "green" },
          { label: "Smart Money",      value: smartMoney,sub: "in last 20 signals",   accent: "green" },
          { label: "Avg Confidence",   value: loading ? "—" : `${avgConf}%`, sub: "last 20 signals", accent: "amber" },
          { label: "Anomalies",        value: anomalies, sub: "in last 20 signals",   accent: "slate" },
        ].map(({ label, value, sub, accent }, i) => (
          <div key={label} className="animate-fadeUp" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
            <StatCard label={label} value={value} sub={sub} accent={accent} loading={loading} />
          </div>
        ))}
      </div>

      {/* ── Breakdown ───────────────────────────────────────────────── */}
      <div>
        <p className="section-label mb-3 flex items-center gap-2">
          <Layers size={11} className="text-accent/50" />
          Signal breakdown · last 20
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <BreakdownCard type="SMART_MONEY_IN" count={smartMoney} total={signals.length} idx={0} />
          <BreakdownCard type="WHALE_MOVE"     count={whaleMoves} total={signals.length} idx={1} />
          <BreakdownCard type="ANOMALY"        count={anomalies}  total={signals.length} idx={2} />
        </div>
      </div>

      {/* ── Signal table ────────────────────────────────────────────── */}
      <div className="glass-card glass-card-accent rounded-2xl overflow-hidden animate-fadeUp" style={{ animationDelay: "240ms", animationFillMode: "both" }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.04]">
          <p className="section-label">Recent signals</p>
          <span className="text-[10px] font-mono text-slate-800">auto-refresh 30s</span>
        </div>
        <div className="px-0 pb-2">
          <SignalTable signals={signals} loading={loading} />
        </div>
      </div>

    </div>
  );
}
