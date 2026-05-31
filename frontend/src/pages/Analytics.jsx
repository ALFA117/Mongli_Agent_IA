import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid, Area, AreaChart,
} from "recharts";
import { fetchRecentSignals } from "../lib/contract";
import { SIGNAL_STYLES } from "../lib/utils";
import StatCard from "../components/StatCard";

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

export default function Analytics() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentSignals(100)
      .then(setSignals).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
  if (!signals.length) return (
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
            Distribution & patterns · last {signals.length} signals
          </p>
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
    </div>
  );
}
