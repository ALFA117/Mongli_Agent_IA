import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, AlertTriangle, ArrowRight, History } from "lucide-react";
import SignalTable from "../components/SignalTable";
import SignalModal from "../components/SignalModal";
import SignalTypeBadge from "../components/SignalTypeBadge";
import ConfidenceBadge from "../components/ConfidenceBadge";
import { fetchRecentSignals, fetchTotalSignals, IS_DEMO } from "../lib/contract";
import { getSignalStyle, shortAddress, formatTime, confidenceTone } from "../lib/utils";

const REFRESH_MS = 30_000;
const TYPES = ["SMART_MONEY_IN", "WHALE_MOVE", "ANOMALY"];

/* Lead block: the newest signal, readable without opening anything */
function LatestBlock({ signal, loading, onOpen }) {
  const navigate = useNavigate();
  return (
    <section className="block-lead enter relative overflow-hidden w-full flex flex-col" style={{ "--i": 0 }}
      aria-labelledby="latest-h">
      <div className="dots absolute right-0 top-0 h-28 w-40 opacity-70" aria-hidden="true" />
      <div className="relative p-5 sm:p-6 flex-1 flex flex-col">
        <p className="eyebrow">{IS_DEMO ? "Latest sample signal" : "Latest signal"}</p>
        {loading || !signal ? (
          <div className="mt-4 space-y-3" aria-hidden="true">
            <div className="skeleton h-7 w-40" />
            <div className="skeleton h-9 w-64" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-3/4" />
          </div>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <SignalTypeBadge type={signal.type} size="lg" />
              <span className="text-[14px] text-ink-2">#{signal.id} · {formatTime(signal.timestamp)}</span>
            </div>
            <h2 id="latest-h" className="mt-4 num !font-mono text-[26px] sm:text-[32px] font-medium tracking-tight text-ink">
              {shortAddress(signal.wallet)}
            </h2>
            <div className="mt-3 max-w-sm">
              <ConfidenceBadge value={signal.confidence} wide />
              <p className="mt-1 text-[13px] text-muted">{confidenceTone(signal.confidence).word} confidence</p>
            </div>
            {signal.reasoning && (
              <p className="mt-4 text-[16px] leading-7 text-ink-2 max-w-prose line-clamp-3">{signal.reasoning}</p>
            )}
            <div className="mt-auto pt-6 flex flex-col sm:flex-row gap-3">
              <button type="button" className="btn-primary" onClick={() => onOpen(signal)}>
                Read the agent's reasoning <ArrowRight size={16} aria-hidden="true" />
              </button>
              <button type="button" className="btn-secondary" onClick={() => navigate(`/wallet?address=${signal.wallet}`)}>
                <History size={16} aria-hidden="true" /> Wallet history
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* Signal mix: one stacked bar instead of three identical cards */
function MixBlock({ signals, loading }) {
  const total = signals.length;
  const counts = TYPES.map((t) => ({ t, n: signals.filter((s) => s.type === t).length }));
  return (
    <section className="block-card enter w-full p-5 sm:p-6" style={{ "--i": 1 }} aria-labelledby="mix-h">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="mix-h" className="text-[20px] font-semibold">Signal mix</h2>
        <span className="text-[13px] text-muted">last {total || 20} signals</span>
      </div>
      {loading ? (
        <div className="skeleton mt-5 h-3 w-full" />
      ) : (
        <div className="mt-5 flex h-3 w-full overflow-hidden rounded-sm bg-surface-2" role="img"
          aria-label={counts.map(({ t, n }) => `${getSignalStyle(t).label}: ${n}`).join(", ")}>
          {counts.map(({ t, n }) => n > 0 && (
            <div key={t} className={`${getSignalStyle(t).bar} h-full border-r-2 border-surface last:border-r-0`}
              style={{ width: `${(n / total) * 100}%` }} />
          ))}
        </div>
      )}
      <dl className="mt-5 grid grid-cols-3 gap-3">
        {counts.map(({ t, n }) => {
          const s = getSignalStyle(t);
          return (
            <div key={t} className="min-w-0">
              <dt className="flex items-center gap-1.5 text-[13px] text-ink-2">
                <span className={`h-2.5 w-2.5 rounded-sm shrink-0 ${s.dot}`} aria-hidden="true" />
                <span className="truncate">{s.short}</span>
              </dt>
              <dd className="mt-1 flex items-baseline gap-1.5">
                <span className="num text-[24px] font-medium text-ink">{loading ? "–" : n}</span>
                <span className="num text-[13px] text-muted">{loading || !total ? "" : `${Math.round((n / total) * 100)}%`}</span>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

function FigureBlock({ i, label, value, note, span, children }) {
  return (
    <section className={`block-card enter p-5 sm:p-6 ${span}`} style={{ "--i": i }}>
      <p className="label">{label}</p>
      <p className="mt-2 num text-[34px] leading-none font-medium text-ink">{value}</p>
      {children}
      <p className="mt-2 text-[13px] text-muted">{note}</p>
    </section>
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

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const [sigs, tot] = await Promise.all([fetchRecentSignals(20), fetchTotalSignals()]);
      setSignals(sigs);
      setTotal(tot);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      console.error("LiveFeed:", e);
      setError(e instanceof Error ? e.message : String(e));
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

  const avgConf = signals.length
    ? Math.round(signals.reduce((a, s) => a + s.confidence, 0) / signals.length) : 0;

  return (
    <div className="space-y-8">
      {selected && <SignalModal signal={selected} onClose={() => setSelected(null)} />}

      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow">Live feed · Mantle</p>
          <h1 className="mt-2 text-[34px] sm:text-[44px] leading-[1.1] font-semibold">Signal Intelligence</h1>
          <p className="mt-3 text-[17px] leading-7 text-ink-2">
            {IS_DEMO
              ? "Smart-money, whale and anomaly signals from the agent's sample set. Open any signal to read why the agent flagged it."
              : "Smart-money, whale and anomaly signals the agent records on Mantle. Open any signal to read the reasoning and verify it."}
          </p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing} className="btn-secondary self-start sm:self-auto">
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} aria-hidden="true" />
          {lastUpdated
            ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : "Loading…"}
        </button>
      </header>

      {error && (
        <div role="alert" className="flex flex-col sm:flex-row sm:items-center gap-3 rounded border border-danger bg-danger-soft p-4">
          <AlertTriangle size={18} className="text-danger shrink-0" aria-hidden="true" />
          <p className="flex-1 text-[15px] text-ink">
            <span className="font-semibold">Could not load signals.</span> {error}
          </p>
          <button onClick={() => load(true)} className="btn-secondary">Try again</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
        <div className="sm:col-span-2 lg:col-span-7 lg:row-span-2 flex">
          <LatestBlock signal={signals[0]} loading={loading} onOpen={setSelected} />
        </div>
        <div className="sm:col-span-2 lg:col-span-5 flex"><MixBlock signals={signals} loading={loading} /></div>
        <FigureBlock i={2} span="lg:col-span-2" label={IS_DEMO ? "Sample signals" : "On-chain signals"}
          value={loading ? "–" : total.toLocaleString()} note={IS_DEMO ? "demo set, not on-chain" : "recorded all time"} />
        <FigureBlock i={3} span="lg:col-span-3" label="Average confidence" value={loading ? "–" : `${avgConf}%`} note="across the last 20 signals">
          <div className="mt-3 h-1.5 bg-surface-2 rounded-sm overflow-hidden" aria-hidden="true">
            <div className={`h-full ${confidenceTone(avgConf).bar}`} style={{ width: `${avgConf}%` }} />
          </div>
        </FigureBlock>
      </div>

      <section className="block-card enter overflow-hidden" style={{ "--i": 4 }} aria-labelledby="recent-h">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 sm:px-5 py-4 border-b border-ink">
          <h2 id="recent-h" className="text-[20px] font-semibold">{IS_DEMO ? "Sample signals" : "Recent signals"}</h2>
          <p className="text-[13px] text-muted">Select a row for details · refreshes every 30 s</p>
        </div>
        <SignalTable signals={signals} loading={loading} onRowClick={setSelected} />
      </section>
    </div>
  );
}
