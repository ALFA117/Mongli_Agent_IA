import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, AlertTriangle, ArrowRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area,
} from "recharts";
import { fetchRecentSignals, IS_DEMO } from "../lib/contract";
import { SIGNAL_STYLES, shortAddress, confidenceTone } from "../lib/utils";
import SignalTypeBadge from "../components/SignalTypeBadge";
import StateBlock from "../components/StateBlock";

const INK = "#15171C", MUTED = "#5E636D", LINE = "#D9D7CE", ACCENT = "#0A6B4B";

const tooltip = {
  contentStyle: {
    background: "#FFFFFF", border: `1px solid ${INK}`, borderRadius: 4, boxShadow: `2px 2px 0 ${INK}`,
    fontSize: 13, fontFamily: '"IBM Plex Mono", monospace', color: INK, padding: "6px 10px",
  },
  labelStyle: { color: MUTED },
  cursor: { fill: "rgba(21,23,28,0.05)" },
};
const axis = {
  tick: { fill: MUTED, fontSize: 12, fontFamily: '"IBM Plex Mono", monospace' },
  axisLine: { stroke: LINE }, tickLine: false,
};

const PERIODS = [
  { label: "24h", hours: 24 },
  { label: "7d",  hours: 24 * 7 },
  { label: "30d", hours: 24 * 30 },
];

function Block({ title, note, span, i, children, flush }) {
  return (
    <section className={`block-card enter min-w-0 ${span}`} style={{ "--i": i }}>
      <div className={`flex flex-wrap items-baseline justify-between gap-2 ${flush ? "px-4 sm:px-5 py-4 border-b border-ink" : "px-5 pt-5"}`}>
        <h2 className="text-[19px] font-semibold">{title}</h2>
        {note && <span className="text-[13px] text-muted">{note}</span>}
      </div>
      <div className={flush ? "" : "p-5 pt-4"}>{children}</div>
    </section>
  );
}

export default function Analytics() {
  const [allSignals, setAllSignals] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [period,     setPeriod]     = useState("7d");

  const load = useCallback(() => {
    setLoading(true); setError("");
    fetchRecentSignals(200)
      .then(setAllSignals)
      .catch((e) => { console.error(e); setError(e?.message ?? "The RPC did not answer."); })
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, [load]);

  const cutoff  = Math.floor(Date.now() / 1000) - (PERIODS.find((p) => p.label === period)?.hours ?? 168) * 3600;
  const signals = allSignals.filter((s) => !s.timestamp || s.timestamp >= cutoff);

  const typeMap = signals.reduce((a, s) => ({ ...a, [s.type]: (a[s.type] || 0) + 1 }), {});
  const buckets = [
    { range: "50–59", count: 0 }, { range: "60–69", count: 0 }, { range: "70–79", count: 0 },
    { range: "80–89", count: 0 }, { range: "90–100", count: 0 },
  ];
  signals.forEach(({ confidence: c }) => {
    if (c >= 90) buckets[4].count++;
    else if (c >= 80) buckets[3].count++;
    else if (c >= 70) buckets[2].count++;
    else if (c >= 60) buckets[1].count++;
    else buckets[0].count++;
  });

  // Activity per day for 7d/30d, per hour for 24h, oldest first.
  const byDay = period !== "24h";
  const actMap = new Map();
  [...signals].sort((a, b) => a.timestamp - b.timestamp).forEach(({ timestamp }) => {
    if (!timestamp) return;
    const d = new Date(timestamp * 1000);
    const k = byDay
      ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }).replace(/:\d\d/, ":00");
    actMap.set(k, (actMap.get(k) || 0) + 1);
  });
  const actData = [...actMap].map(([time, count]) => ({ time, count }));

  const smartPct = signals.length ? Math.round(((typeMap.SMART_MONEY_IN || 0) / signals.length) * 100) : 0;
  const avgConf  = signals.length ? Math.round(signals.reduce((a, s) => a + s.confidence, 0) / signals.length) : 0;

  const header = (
    <header className="flex flex-col md:flex-row md:items-end justify-between gap-5">
      <div className="max-w-2xl">
        <p className="eyebrow">Analytics</p>
        <h1 className="mt-2 text-[34px] sm:text-[44px] leading-[1.1] font-semibold">Patterns across signals</h1>
        <p className="mt-3 text-[17px] leading-7 text-ink-2">
          {IS_DEMO
            ? "How the sample signals split by type, confidence and wallet. Figures come from the demo set, not from Mantle."
            : "How the agent's signals split by type, confidence and wallet over the selected period."}
        </p>
      </div>
      <div role="group" aria-label="Period" className="inline-flex self-start md:self-auto rounded border border-ink bg-surface p-1 shadow-hard-xs">
        {PERIODS.map(({ label }) => (
          <button
            key={label}
            onClick={() => setPeriod(label)}
            aria-pressed={period === label}
            className={`min-h-[40px] min-w-[56px] px-3 rounded-sm num text-[14px] transition-colors ${
              period === label ? "bg-ink text-white" : "text-ink-2 hover:bg-surface-2"}`}
          >
            {label}
          </button>
        ))}
      </div>
    </header>
  );

  if (loading)
    return (
      <div className="space-y-8">
        {header}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" aria-hidden="true">
          <div className="block-card p-6 lg:col-span-12"><div className="skeleton h-16 w-full" /></div>
          <div className="block-card p-6 lg:col-span-8"><div className="skeleton h-56 w-full" /></div>
          <div className="block-card p-6 lg:col-span-4"><div className="skeleton h-56 w-full" /></div>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="space-y-8">
        {header}
        <div className="block-card">
          <StateBlock icon={AlertTriangle} tone="error" title="Could not load analytics"
            action={<button className="btn-secondary" onClick={load}>Try again</button>}>{error}</StateBlock>
        </div>
      </div>
    );

  if (!allSignals.length)
    return (
      <div className="space-y-8">
        {header}
        <div className="block-card">
          <StateBlock icon={BarChart3} title="No signals yet">
            Charts appear once the agent records its first signal.
          </StateBlock>
        </div>
      </div>
    );

  return (
    <div className="space-y-8">
      {header}

      {signals.length === 0 ? (
        <div className="block-card">
          <StateBlock icon={BarChart3} title={`No signals in the last ${period}`}
            action={<button className="btn-secondary" onClick={() => setPeriod("30d")}>Show last 30 days</button>}>
            Pick a longer period to see the activity.
          </StateBlock>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Key figures in one strip, not four identical cards */}
          <section className="block-lead enter lg:col-span-12" style={{ "--i": 0 }} aria-label="Key figures">
            <dl className="grid grid-cols-2 md:grid-cols-4 divide-line [&>div]:p-5 sm:[&>div]:p-6 md:divide-x">
              <div className="border-b md:border-b-0 border-r md:border-r-0 border-line">
                <dt className="label">{IS_DEMO ? "Sample signals" : "Signals analyzed"}</dt>
                <dd className="mt-2 num text-[32px] leading-none">{signals.length}</dd>
              </div>
              <div className="border-b md:border-b-0 border-line">
                <dt className="label">Smart-money rate</dt>
                <dd className="mt-2 num text-[32px] leading-none text-smart">{smartPct}%</dd>
              </div>
              <div className="border-r md:border-r-0 border-line">
                <dt className="label">Average confidence</dt>
                <dd className={`mt-2 num text-[32px] leading-none ${confidenceTone(avgConf).text}`}>{avgConf}%</dd>
              </div>
              <div>
                <dt className="label">Whale moves</dt>
                <dd className="mt-2 num text-[32px] leading-none text-whale">{typeMap.WHALE_MOVE || 0}</dd>
              </div>
            </dl>
          </section>

          <Block title="Signal activity" note={byDay ? "signals per day" : "signals per hour"} span="lg:col-span-8" i={1}>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={actData} margin={{ top: 8, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke={LINE} strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="time" {...axis} minTickGap={16} />
                  <YAxis {...axis} allowDecimals={false} />
                  <Tooltip {...tooltip} />
                  <Area type="linear" dataKey="count" name="Signals" stroke={ACCENT} strokeWidth={2}
                    fill={ACCENT} fillOpacity={0.08} dot={{ r: 3, fill: ACCENT, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: ACCENT, stroke: INK, strokeWidth: 1 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Block>

          <Block title="By type" note={`${signals.length} signals`} span="lg:col-span-4" i={2}>
            <ul className="space-y-5">
              {Object.entries(SIGNAL_STYLES).map(([type, s]) => {
                const count = typeMap[type] || 0;
                const pct = Math.round((count / signals.length) * 100);
                return (
                  <li key={type}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <SignalTypeBadge type={type} />
                      <span className="num text-[14px] text-ink-2">{count} · {pct}%</span>
                    </div>
                    <div className="h-2 bg-surface-2 rounded-sm overflow-hidden">
                      <div className={`h-full ${s.bar}`} style={{ width: `${pct}%`, transition: "width 600ms cubic-bezier(.2,.7,.2,1)" }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Block>

          <Block title="Confidence" note="signals per score band" span="lg:col-span-5" i={3}>
            <div className="h-[220px] lg:h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buckets} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke={LINE} strokeDasharray="2 4" vertical={false} />
                  <XAxis dataKey="range" {...axis} interval={0} />
                  <YAxis {...axis} allowDecimals={false} />
                  <Tooltip {...tooltip} />
                  <Bar dataKey="count" name="Signals" fill={INK} barSize={28} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Block>

          <TopWallets signals={signals} />
        </div>
      )}
    </div>
  );
}

function TopWallets({ signals }) {
  const walletMap = signals.reduce((acc, s) => {
    if (!acc[s.wallet]) acc[s.wallet] = { count: 0, types: {}, maxConf: 0 };
    acc[s.wallet].count++;
    acc[s.wallet].types[s.type] = (acc[s.wallet].types[s.type] || 0) + 1;
    if (s.confidence > acc[s.wallet].maxConf) acc[s.wallet].maxConf = s.confidence;
    return acc;
  }, {});

  const top = Object.entries(walletMap)
    .map(([wallet, d]) => ({
      wallet,
      count: d.count,
      maxConf: d.maxConf,
      topType: Object.entries(d.types).sort(([, a], [, b]) => b - a)[0]?.[0] || "ANOMALY",
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  if (!top.length) return null;

  return (
    <Block title="Most-flagged wallets" note="by number of signals" span="lg:col-span-7" i={4} flush>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-line bg-surface-2/60">
            <th scope="col" className="label py-2.5 pl-4 sm:pl-5 pr-2 font-medium">Wallet</th>
            <th scope="col" className="label py-2.5 px-2 font-medium text-right">Signals</th>
            <th scope="col" className="label py-2.5 px-3 font-medium hidden sm:table-cell">Most frequent</th>
            <th scope="col" className="label py-2.5 pr-4 sm:pr-5 pl-2 font-medium text-right">Top conf.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {top.map((w) => (
            <tr key={w.wallet}>
              <td className="py-2 pl-4 sm:pl-5 pr-2">
                <Link to={`/wallet?address=${w.wallet}`} className="inline-flex min-h-[44px] items-center gap-1.5 num text-[14px] text-ink underline decoration-line underline-offset-4 hover:decoration-ink">
                  {shortAddress(w.wallet)} <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </td>
              <td className="py-2 px-2 num text-[15px] text-right">{w.count}</td>
              <td className="py-2 px-3 hidden sm:table-cell"><SignalTypeBadge type={w.topType} /></td>
              <td className={`py-2 pr-4 sm:pr-5 pl-2 num text-[14px] text-right ${confidenceTone(w.maxConf).text}`}>{w.maxConf}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Block>
  );
}
