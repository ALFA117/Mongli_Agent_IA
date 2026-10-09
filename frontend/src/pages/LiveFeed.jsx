import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, stagger, useReducedMotion } from "motion/react";
import { RefreshCw, Layers, Wallet, BarChart3, WifiOff } from "lucide-react";
import SignalRadar from "../components/SignalRadar";
import StatCard from "../components/StatCard";
import SignalTable from "../components/SignalTable";
import SignalModal from "../components/SignalModal";
import SignalTypeBadge from "../components/SignalTypeBadge";
import { fetchRecentSignals, fetchTotalSignals, IS_DEMO } from "../lib/contract";
import { getSignalStyle, SIGNAL_STYLES } from "../lib/utils";

const REFRESH_MS = 30_000;

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
      <div className="h-1 rounded-full bg-line/5 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: s.accentHex, transition: "width 800ms ease-out" }} />
      </div>
    </div>
  );
}

export default function LiveFeed() {
  const [signals,     setSignals]     = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing,  setRefreshing]  = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [error,       setError]       = useState(null);
  const reduce = useReducedMotion();

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const [sigs, tot] = await Promise.all([fetchRecentSignals(20), fetchTotalSignals()]);
      setSignals(sigs);
      setTotal(tot);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) { setError(e?.message ?? "Could not load signals."); }
    finally { setLoading(false); setRefreshing(false); }
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
    ? Math.round(signals.reduce((a, s) => a + s.confidence, 0) / signals.length) : 0;

  return (
    <div className="space-y-7">
      {selected && <SignalModal signal={selected} onClose={() => setSelected(null)} />}

      {/* Hero */}
      <section className="grid items-center gap-10 pt-2 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.div
          initial={reduce ? false : "hidden"}
          animate="show"
          variants={{ hidden: {}, show: { transition: { delayChildren: stagger(0.08) } } }}
        >
          {[
            <p key="e" className="section-label text-accent">AI agent · Mantle Network</p>,
            <h1 key="h" className="t-display mt-4 text-ink">Follow the smart money <span className="text-accent">before it moves.</span></h1>,
            <p key="p" className="mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
              The agent watches Mantle wallets, scores each move with three models and writes every signal to a
              contract with a hash of its reasoning — so you can check it, not just trust it.
            </p>,
            <div key="c" className="mt-8 flex flex-col gap-3 min-[440px]:flex-row">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                <Link to="/wallet" className="btn-primary w-full"><Wallet size={16} aria-hidden="true" /> Explore a wallet</Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 400, damping: 22 }}>
                <Link to="/analytics" className="btn-ghost w-full"><BarChart3 size={16} aria-hidden="true" /> See analytics</Link>
              </motion.div>
            </div>,
          ].map((el) => (
            <motion.div key={el.key} variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } }}>
              {el}
            </motion.div>
          ))}
        </motion.div>
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 140, damping: 20, delay: 0.2 }}
        >
          {loading ? (
            <div className="skeleton mx-auto aspect-square w-full max-w-[380px] rounded-full" aria-hidden="true" />
          ) : (
            <SignalRadar signals={signals} demo={IS_DEMO} />
          )}
        </motion.div>
      </section>

      {error && (
        <div role="alert" className="glass-card rounded-2xl border border-red-400/40 p-5 flex flex-wrap items-center gap-4">
          <WifiOff size={20} className="text-red-400 shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-[220px]">
            <p className="font-semibold text-ink">Signals did not load</p>
            <p className="text-sm text-slate-400 mt-1">{error} Check the RPC and try again.</p>
          </div>
          <button type="button" onClick={() => load(true)} className="btn-ghost">
            <RefreshCw size={15} aria-hidden="true" /> Retry
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
        <h2 className="font-display text-lg font-bold tracking-wide text-ink">Signal intelligence</h2>
        <button onClick={() => load(true)} disabled={refreshing} className="btn-ghost font-mono text-xs text-slate-400">
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} aria-hidden="true" />
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", second:"2-digit" })}` : "Loading…"}
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: IS_DEMO ? "Sample signals" : "On-chain signals", value:total, sub: IS_DEMO ? "demo set, not on-chain" : "all time recorded", accent:"green" },
          { label:"Smart Money",      value:smartMoney, sub:`in last ${signals.length} signals${IS_DEMO ? " · sample" : ""}`,  accent:"green" },
          { label:"Avg Confidence",   value:loading ? "—" : `${avgConf}%`, sub:`last ${signals.length} signals${IS_DEMO ? " · sample" : ""}`, accent:"amber" },
          { label:"Anomalies",        value:anomalies,  sub:`in last ${signals.length} signals${IS_DEMO ? " · sample" : ""}`,  accent:"slate" },
        ].map(({ label, value, sub, accent }, i) => (
          <div key={label} className="animate-fadeUp" style={{ animationDelay:`${i*60}ms`, animationFillMode:"both" }}>
            <StatCard label={label} value={value} sub={sub} accent={accent} loading={loading} />
          </div>
        ))}
      </div>

      {/* Breakdown */}
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

      {/* Table */}
      <div className="glass-card glass-card-accent rounded-2xl overflow-hidden animate-fadeUp" style={{ animationDelay:"240ms", animationFillMode:"both" }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-line/[0.04]">
          <p className="section-label">Recent signals — click any row to verify</p>
          <span className="text-xs font-mono text-muted">{IS_DEMO ? "sample data" : "auto-refresh 30s"}</span>
        </div>
        <div className="pb-2">
          <SignalTable signals={signals} loading={loading} onRowClick={setSelected} />
        </div>
      </div>
    </div>
  );
}
