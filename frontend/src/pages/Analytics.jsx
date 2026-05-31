import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid,
} from "recharts";
import { fetchRecentSignals } from "../lib/contract";
import { SIGNAL_STYLES } from "../lib/utils";

const TYPE_COLORS = {
  SMART_MONEY_IN: "#4ade80",
  WHALE_MOVE: "#818cf8",
  ANOMALY: "#fbbf24",
};

const tooltipStyle = {
  contentStyle: {
    background: "rgba(13,31,45,0.95)",
    border: "1px solid rgba(74,222,128,0.15)",
    borderRadius: "10px",
    fontSize: "11px",
    fontFamily: "JetBrains Mono, monospace",
    color: "#cbd5e1",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
  cursor: { fill: "rgba(74,222,128,0.04)" },
  labelStyle: { color: "#64748b" },
};

const axisStyle = {
  tick: { fill: "#475569", fontSize: 11, fontFamily: "JetBrains Mono, monospace" },
  axisLine: false,
  tickLine: false,
};

function ChartCard({ title, children, span = "" }) {
  return (
    <div className={`glass rounded-2xl p-5 ${span}`}>
      <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-5">{title}</p>
      {children}
    </div>
  );
}

function ProgressBar({ type, label, value, color, pct }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-mono mb-1.5">
        <span className={color}>{label}</span>
        <span className="text-slate-600">{value} ({pct}%)</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: TYPE_COLORS[type] ?? "#4ade80" }}
        />
      </div>
    </div>
  );
}

export default function Analytics() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentSignals(100)
      .then(setSignals)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* Derived data */
  const typeCountMap = signals.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(typeCountMap).map(([key, value]) => ({
    name: SIGNAL_STYLES[key]?.label ?? key,
    value,
    key,
  }));

  const buckets = [
    { range: "50–59", count: 0 },
    { range: "60–69", count: 0 },
    { range: "70–79", count: 0 },
    { range: "80–89", count: 0 },
    { range: "90–100", count: 0 },
  ];
  signals.forEach(({ confidence: c }) => {
    if (c >= 90)      buckets[4].count++;
    else if (c >= 80) buckets[3].count++;
    else if (c >= 70) buckets[2].count++;
    else if (c >= 60) buckets[1].count++;
    else              buckets[0].count++;
  });

  const hourlyMap = {};
  signals.forEach(({ timestamp }) => {
    if (!timestamp) return;
    const d = new Date(timestamp * 1000);
    d.setMinutes(0, 0, 0);
    const key = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    hourlyMap[key] = (hourlyMap[key] || 0) + 1;
  });
  const lineData = Object.entries(hourlyMap)
    .slice(-12)
    .map(([time, count]) => ({ time, count }));

  /* Loading skeleton */
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="shimmer w-8 h-8 rounded-lg" />
          <div className="shimmer w-40 h-6 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass rounded-2xl h-64 shimmer" />
          ))}
        </div>
      </div>
    );
  }

  /* Empty state */
  if (signals.length === 0) {
    return (
      <div className="text-center py-32 font-mono">
        <BarChart3 size={36} className="mx-auto mb-4 text-slate-700" />
        <p className="text-slate-600 text-sm">No data yet.</p>
        <p className="text-slate-700 text-xs mt-1">Waiting for the agent to generate signals.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <h1
          className="text-xl font-bold text-slate-100 tracking-wide flex items-center gap-2.5"
          style={{ fontFamily: "Orbitron, monospace" }}
        >
          <span className="w-8 h-8 rounded-lg bg-green-400/10 border border-green-400/20 flex items-center justify-center">
            <BarChart3 size={16} className="text-green-400" />
          </span>
          Analytics
        </h1>
        <p className="text-xs font-mono text-slate-500 mt-1 ml-10">
          Signal distribution · last {signals.length} signals
        </p>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Pie — signal type */}
        <ChartCard title="Signal type distribution">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={78}
                innerRadius={38}
                paddingAngle={3}
                strokeWidth={0}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.key} fill={TYPE_COLORS[entry.key] ?? "#6b7280"} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend
                wrapperStyle={{
                  fontSize: "11px",
                  fontFamily: "JetBrains Mono, monospace",
                  color: "#64748b",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Bar — confidence distribution */}
        <ChartCard title="Confidence distribution">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={buckets} barSize={28}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(100,116,139,0.1)"
                vertical={false}
              />
              <XAxis dataKey="range" {...axisStyle} />
              <YAxis {...axisStyle} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" fill="#4ade80" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Line — signals over time */}
        <ChartCard title="Signals over time (hourly)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(100,116,139,0.1)"
                vertical={false}
              />
              <XAxis dataKey="time" {...axisStyle} />
              <YAxis {...axisStyle} />
              <Tooltip {...tooltipStyle} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#4ade80"
                strokeWidth={2}
                dot={{ fill: "#4ade80", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#4ade80", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Signal breakdown progress bars */}
        <ChartCard title="Signal breakdown">
          <div className="space-y-5 pt-2">
            {Object.entries(SIGNAL_STYLES).map(([type, style]) => {
              const count = typeCountMap[type] || 0;
              const pct = signals.length ? Math.round((count / signals.length) * 100) : 0;
              return (
                <ProgressBar
                  key={type}
                  type={type}
                  label={style.label}
                  value={count}
                  color={style.color}
                  pct={pct}
                />
              );
            })}

            <div className="pt-2 border-t border-slate-700/30">
              <div className="flex justify-between text-xs font-mono text-slate-600">
                <span>Total analyzed</span>
                <span>{signals.length} signals</span>
              </div>
            </div>
          </div>
        </ChartCard>

      </div>
    </div>
  );
}
