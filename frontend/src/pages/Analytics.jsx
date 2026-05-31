import { useEffect, useState } from "react";
import { BarChart3, ExternalLink } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid, Area, AreaChart,
} from "recharts";
import { fetchRecentSignals } from "../lib/contract";
import { SIGNAL_STYLES, shortAddress, explorerAddressUrl, getSignalStyle } from "../lib/utils";
import StatCard from "../components/StatCard";
import SignalTypeBadge from "../components/SignalTypeBadge";

const TYPE_COLOR = { SMART_MONEY_IN: "#00ff88", WHALE_MOVE: "#38bdf8", ANOMALY: "#fbbf24" };

const tooltip = {
  contentStyle: {
    background: "rgba(6,21,37,0.97)",
    border: "1px solid rgba(0,255,136,0.15)",
    borderRadius: "10px",
    fontSize: "11px",
    fontFamily: "JetBrains Mono, monospace",
    color: "#94a3b8",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    padding: "8px 12px",
  },
  cursor: { fill: "rgba(0,255,136,0.03)" },
  labelStyle: { color: "#475569" },
};

const axis = {
  tick: { fill: "#334155", fontSize: 11, fontFamily: "JetBrains Mono, monospace" },
  axisLine: false, tickLine: false,
};

function ChartCard({ title, children }) {
  return (
    <div className="glass-card glass-card-accent rounded-2xl p-5 overflow-hidden">
      <p className="section-label mb-5">{title}</p>
      {children}
    </div>
  );
}

const PERIODS = [
  { label: "24h", hours: 24 },
  { label: "7d",  hours: 24 * 7 },
  { label: "30d", hours: 24 * 30 },
];

export default function Analytics() {
  const [allSignals, setAllSignals] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [period,     setPeriod]     = useState("7d");

  useEffect(() => {
    fetchRecentSignals(200)
      .then(setAllSignals).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* ── Filter by selected period ────────────────────────────────────── */
  const cutoff = Math.floor(Date.now() / 1000) - (PERIODS.find(p => p.label === period)?.hours ?? 168) * 3600;
  const signals = allSignals.filter(s => !s.timestamp || s.timestamp >= cutoff);

  /* ── Derived data ─────────────────────────────────────────────────── */
  const typeMap   = signals.reduce((a, s) => ({ ...a, [s.type]: (a[s.type] || 0) + 1 }), {});
  const pieData   = Object.entries(typeMap).map(([key, val]) => ({
    name: SIGNAL_STYLES[key]?.label ?? key, value: val, key,
  }));

  const buckets = [
    { range: "50–59", count: 0 }, { range: "60–69", count: 0 },
    { range: "70–79", count: 0 }, { range: "80–89", count: 0 },
    { range: "90–100",count: 0 },
  ];
  signals.forEach(({ confidence: c }) => {
    if      (c >= 90) buckets[4].count++;
    else if (c >= 80) buckets[3].count++;
    else if (c >= 70) buckets[2].count++;
    else if (c >= 60) buckets[1].count++;
    else              buckets[0].count++;
  });

  const hourMap = {};
  signals.forEach(({ timestamp }) => {
    if (!timestamp) return;
    const d = new Date(timestamp * 1000); d.setMinutes(0, 0, 0);
    const k = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    hourMap[k] = (hourMap[k] || 0) + 1;
  });
  const lineData = Object.entries(hourMap).slice(-14).map(([time, count]) => ({ time, count }));

  const smartPct = signals.length
    ? Math.round(((typeMap.SMART_MONEY_IN || 0) / signals.length) * 100) : 0;
  const avgConf  = signals.length
    ? Math.round(signals.reduce((a, s) => a + s.confidence, 0) / signals.length) : 0;

  /* ── Loading ─────────────────────────────────────────────────────── */
  if (loading) return (
    <div className="space-y-5">
      <div className="skeleton h-10 w-60 rounded-xl" />
      <div className="grid grid-cols-4 gap-3">{[...Array(4)].map((_,i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      <div className="grid grid-cols-2 gap-4">{[...Array(4)].map((_,i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}</div>
    </div>
  );

  /* ── Empty ───────────────────────────────────────────────────────── */
  if (!allSignals.length) return (
    <div className="text-center py-32 font-mono">
      <BarChart3 size={40} className="mx-auto mb-4 text-slate-800" />
      <p className="text-slate-700">No signals yet — waiting for agent data.</p>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3 animate-slideDown">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background:"rgba(0,255,136,0.1)", border:"1px solid rgba(0,255,136,0.25)", boxShadow:"0 0 16px rgba(0,255,136,0.12)" }}
        >
          <BarChart3 size={18} className="text-accent" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-slate-100 tracking-wide">Analytics</h1>
          <p className="text-xs font-mono text-slate-600 mt-0.5">
            Distribution & patterns · {signals.length} signals
          </p>
        </div>

        {/* ── Period filter ──────────────────────────────────────── */}
        <div className="ml-auto flex items-center gap-1 glass-panel rounded-xl p-1">
          {PERIODS.map(({ label }) => (
            <button
              key={label}
              onClick={() => setPeriod(label)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer transition-all duration-150 ${
                period === label ? "nav-active" : "nav-inactive text-slate-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:"Total Analyzed",    value: signals.length,           accent:"green" },
          { label:"Smart Money Rate",  value: `${smartPct}%`,           accent:"green" },
          { label:"Avg Confidence",    value: `${avgConf}%`,            accent:"amber" },
          { label:"Whale Moves",       value: typeMap.WHALE_MOVE || 0,  accent:"blue"  },
        ].map(({ label, value, accent }, i) => (
          <div key={label} className="animate-fadeUp" style={{ animationDelay:`${i*60}ms`, animationFillMode:"both" }}>
            <StatCard label={label} value={value} accent={accent} />
          </div>
        ))}
      </div>

      {/* Charts 2×2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Donut — type distribution */}
        <ChartCard title="Signal type distribution">
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name"
                cx="50%" cy="50%" outerRadius={82} innerRadius={44}
                paddingAngle={4} strokeWidth={0}
              >
                {pieData.map((e) => (
                  <Cell key={e.key} fill={TYPE_COLOR[e.key] ?? "#6b7280"} fillOpacity={0.85} />
                ))}
              </Pie>
              <Tooltip {...tooltip} />
              <Legend wrapperStyle={{ fontSize:"11px", fontFamily:"JetBrains Mono, monospace", color:"#475569" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Bar — confidence buckets */}
        <ChartCard title="Confidence distribution">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={buckets} barSize={26}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,136,0.04)" vertical={false} />
              <XAxis dataKey="range" {...axis} />
              <YAxis {...axis} />
              <Tooltip {...tooltip} />
              <Bar dataKey="count" fill="#00ff88" fillOpacity={0.75} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Area — signals over time */}
        <ChartCard title="Signal activity (hourly)">
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={lineData}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00ff88" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00ff88" stopOpacity={0.0}  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,136,0.04)" vertical={false} />
              <XAxis dataKey="time" {...axis} />
              <YAxis {...axis} />
              <Tooltip {...tooltip} />
              <Area
                type="monotone" dataKey="count"
                stroke="#00ff88" strokeWidth={2}
                fill="url(#areaGrad)"
                dot={{ fill:"#00ff88", r:3, strokeWidth:0 }}
                activeDot={{ r:5, fill:"#00ff88", strokeWidth:0, filter:"drop-shadow(0 0 4px #00ff88)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Progress bars — breakdown */}
        <ChartCard title="Signal breakdown">
          <div className="space-y-6 pt-1">
            {Object.entries(SIGNAL_STYLES).map(([type, s]) => {
              const count = typeMap[type] || 0;
              const pct   = signals.length ? Math.round((count / signals.length) * 100) : 0;
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-mono ${s.color}`}>{s.label}</span>
                    <span className="text-xs font-mono text-slate-600">{count} · {pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width:`${pct}%`, backgroundColor: s.accentHex, transition:"width 900ms cubic-bezier(0.16,1,0.3,1)", boxShadow:`0 0 8px ${s.accentHex}60` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="pt-2 border-t border-white/[0.04] flex justify-between text-xs font-mono text-slate-700">
              <span>Total analyzed</span>
              <span>{signals.length} signals</span>
            </div>
          </div>
        </ChartCard>

      </div>

      {/* ── Top Wallets ─────────────────────────────────────────────── */}
      <TopWallets signals={signals} />

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
      topType: Object.entries(d.types).sort(([,a],[,b]) => b - a)[0]?.[0] || "ANOMALY",
      smartPct: Math.round(((d.types["SMART_MONEY_IN"] || 0) / d.count) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  if (!top.length) return null;

  return (
    <div className="glass-card glass-card-accent rounded-2xl overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.04]">
        <p className="section-label">Top wallets · most signals detected</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-mono min-w-[560px]">
          <thead>
            <tr className="border-b border-white/[0.03]">
              {["Rank", "Wallet", "Signals", "Top Signal", "Max Conf", "SmartMoney"].map((h) => (
                <th key={h} className="text-left py-3 px-4 section-label font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {top.map((w, i) => {
              const s = getSignalStyle(w.topType);
              return (
                <tr key={w.wallet} className="signal-row border-b border-white/[0.03] last:border-0">
                  <td className="py-3 pl-4 pr-3 text-slate-700 text-xs tabular-nums">#{i + 1}</td>
                  <td className="py-3 pr-4">
                    <a href={explorerAddressUrl(w.wallet)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-slate-400 hover:text-accent transition-colors group cursor-pointer w-fit"
                    >
                      {shortAddress(w.wallet)}
                      <ExternalLink size={10} className="opacity-0 group-hover:opacity-60" />
                    </a>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="font-display text-sm font-bold text-slate-200">{w.count}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <SignalTypeBadge type={w.topType} />
                  </td>
                  <td className="py-3 pr-4">
                    <span style={{ color: w.maxConf >= 85 ? "#00ff88" : w.maxConf >= 70 ? "#fbbf24" : "#f87171" }}
                      className="text-xs font-mono tabular-nums">
                      {w.maxConf}%
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${w.smartPct}%` }} />
                      </div>
                      <span className="text-xs font-mono text-slate-500">{w.smartPct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
