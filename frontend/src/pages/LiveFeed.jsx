import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Radio } from "lucide-react";
import StatCard from "../components/StatCard";
import SignalTable from "../components/SignalTable";
import SignalTypeBadge from "../components/SignalTypeBadge";
import { fetchRecentSignals, fetchTotalSignals } from "../lib/contract";
import { SIGNAL_STYLES } from "../lib/utils";

const REFRESH_MS = 30_000;

function SectionHeader({ children }) {
  return (
    <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
      {children}
    </p>
  );
}

function BreakdownCard({ type, count, total }) {
  const s = SIGNAL_STYLES[type];
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className={`glass-sm rounded-xl px-4 py-4 border ${s.border}`}>
      <div className="flex items-center justify-between mb-3">
        <SignalTypeBadge type={type} />
        <span className={`font-mono text-xs ${s.color} opacity-60`}>{pct}%</span>
      </div>
      <div
        className={`text-2xl font-bold ${s.color}`}
        style={{ fontFamily: "Orbitron, monospace" }}
      >
        {count}
      </div>
      <div className="mt-2 h-1 rounded-full bg-slate-800/60 overflow-hidden">
        <div
          className={`h-full rounded-full ${s.dot} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function LiveFeed() {
  const [signals, setSignals] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const [sigs, tot] = await Promise.all([
        fetchRecentSignals(20),
        fetchTotalSignals(),
      ]);
      setSignals(sigs);
      setTotal(tot);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("LiveFeed:", err);
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
    ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
    : "Loading...";

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1
            className="text-xl font-bold text-slate-100 tracking-wide flex items-center gap-2.5"
            style={{ fontFamily: "Orbitron, monospace" }}
          >
            <span className="w-8 h-8 rounded-lg bg-green-400/10 border border-green-400/20 flex items-center justify-center">
              <Radio size={16} className="text-green-400" />
            </span>
            Live Signal Feed
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-1 ml-10">
            Real-time on-chain AI signals · Mantle Network
          </p>
        </div>

        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg glass-sm text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-40 self-start sm:self-auto"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          <span>{timeLabel}</span>
        </button>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Signals"
          value={total.toLocaleString()}
          sub="all time on-chain"
          accent="green"
          loading={loading}
        />
        <StatCard
          label="Avg Confidence"
          value={loading ? "—" : `${avgConf}%`}
          sub="last 20 signals"
          accent="amber"
          loading={loading}
        />
        <StatCard
          label="Smart Money"
          value={loading ? "—" : smartMoney}
          sub="last 20 signals"
          accent="green"
          loading={loading}
        />
        <StatCard
          label="Anomalies"
          value={loading ? "—" : anomalies}
          sub="last 20 signals"
          accent="slate"
          loading={loading}
        />
      </div>

      {/* Signal type breakdown */}
      <div>
        <SectionHeader>Signal breakdown · last 20</SectionHeader>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <BreakdownCard type="SMART_MONEY_IN" count={smartMoney} total={signals.length} />
          <BreakdownCard type="WHALE_MOVE"     count={whaleMoves} total={signals.length} />
          <BreakdownCard type="ANOMALY"        count={anomalies}  total={signals.length} />
        </div>
      </div>

      {/* Signal table */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader>Recent signals</SectionHeader>
          <span className="text-xs font-mono text-slate-700">auto-refresh 30s</span>
        </div>
        <SignalTable signals={signals} loading={loading} />
      </div>

    </div>
  );
}
