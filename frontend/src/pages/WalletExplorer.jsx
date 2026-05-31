import { useState } from "react";
import { ethers } from "ethers";
import { Search, ExternalLink, TrendingUp, AlertCircle, ShieldCheck } from "lucide-react";
import SignalTable from "../components/SignalTable";
import SignalModal from "../components/SignalModal";
import StatCard from "../components/StatCard";
import SignalTypeBadge from "../components/SignalTypeBadge";
import { fetchSignalsByWallet } from "../lib/contract";
import { shortAddress, explorerAddressUrl, SIGNAL_STYLES } from "../lib/utils";

/* ── Score ring ─────────────────────────────────────────────────────── */
function ScoreRing({ score }) {
  const r    = 34;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const col  = score >= 70 ? "#00ff88" : score >= 40 ? "#fbbf24" : "#f87171";
  const label= score >= 70 ? "High" : score >= 40 ? "Medium" : "Low";
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-28 h-28">
        <div className="absolute inset-2 rounded-full" style={{ background:`radial-gradient(circle, ${col}12 0%, transparent 70%)` }} />
        <svg className="w-full h-full -rotate-90 absolute inset-0" viewBox="0 0 88 88">
          <circle cx={44} cy={44} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={7} />
          <circle cx={44} cy={44} r={r} fill="none" stroke={col} strokeWidth={7} strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition:"stroke-dasharray 1.1s cubic-bezier(0.16,1,0.3,1)", filter:`drop-shadow(0 0 6px ${col}90)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold tabular-nums" style={{ color:col }}>{score}</span>
          <span className="text-[9px] font-mono text-slate-600">/ 100</span>
        </div>
      </div>
      <div className="text-center">
        <span className="text-xs font-mono font-semibold" style={{ color:col }}>{label} conviction</span>
        <p className="text-[10px] font-mono text-slate-700 mt-0.5">SmartMoney Score</p>
      </div>
    </div>
  );
}

export default function WalletExplorer() {
  const [input,    setInput]    = useState("");
  const [signals,  setSignals]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [selected, setSelected] = useState(null);

  async function lookup(e) {
    e?.preventDefault();
    const addr = input.trim();
    setError(""); setSignals(null);
    if (!ethers.isAddress(addr)) { setError("Enter a valid Mantle / Ethereum address (0x…)."); return; }
    setLoading(true);
    try   { setSignals(await fetchSignalsByWallet(addr)); }
    catch (err) { setError(err?.message ?? "RPC error — check connection."); }
    finally { setLoading(false); }
  }

  const smartCount = signals?.filter((s) => s.type === "SMART_MONEY_IN").length ?? 0;
  const avgConf    = signals?.length ? Math.round(signals.reduce((a, s) => a + s.confidence, 0) / signals.length) : 0;
  const score      = signals?.length ? Math.round((smartCount / signals.length) * 100) : 0;
  const typeCounts = signals ? Object.fromEntries(Object.keys(SIGNAL_STYLES).map((t) => [t, signals.filter((s) => s.type === t).length])) : {};

  return (
    <div className="space-y-6 max-w-4xl">
      {selected && <SignalModal signal={selected} onClose={() => setSelected(null)} />}

      {/* Header */}
      <div className="flex items-center gap-3 animate-slideDown">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background:"rgba(0,255,136,0.1)", border:"1px solid rgba(0,255,136,0.25)", boxShadow:"0 0 16px rgba(0,255,136,0.12)" }}>
          <Search size={18} className="text-accent" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-slate-100 tracking-wide">Wallet Explorer</h1>
          <p className="text-xs font-mono text-slate-600 mt-0.5">Signal history + SmartMoney conviction for any wallet</p>
        </div>
      </div>

      {/* Search form */}
      <form onSubmit={lookup} className="glass-card glass-card-accent rounded-2xl p-5 space-y-3 animate-fadeUp" style={{ animationFillMode:"both" }}>
        <label htmlFor="wallet-input" className="section-label block">Wallet Address</label>
        <div className="flex gap-2">
          <input
            id="wallet-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="0x…"
            spellCheck={false} autoComplete="off"
            className="flex-1 rounded-xl px-4 py-3 text-sm font-mono text-slate-200 placeholder-slate-700 focus:outline-none transition-all"
            style={{ background:"rgba(2,13,24,0.9)", border:"1px solid rgba(0,255,136,0.12)", boxShadow:"inset 0 2px 8px rgba(0,0,0,0.3)" }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(0,255,136,0.35)")}
            onBlur={(e)  => (e.target.style.borderColor = "rgba(0,255,136,0.12)")}
          />
          <button type="submit" disabled={loading}
            className="px-5 py-3 rounded-xl font-mono text-sm font-semibold cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
            style={{ background:"rgba(0,255,136,0.12)", border:"1px solid rgba(0,255,136,0.25)", color:"#00ff88", boxShadow:"0 0 12px rgba(0,255,136,0.1)" }}
          >
            <Search size={14} />
            {loading ? "Fetching…" : "Lookup"}
          </button>
        </div>
        {error && <p className="flex items-center gap-2 text-red-400 text-xs font-mono" role="alert"><AlertCircle size={12} /> {error}</p>}
      </form>

      {/* Results */}
      {signals !== null && !loading && (
        <div className="space-y-4 animate-fadeUp" style={{ animationFillMode:"both" }}>

          {/* Summary card */}
          <div className="glass-card glass-card-accent rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex justify-center sm:justify-start shrink-0">
                <ScoreRing score={score} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="section-label mb-2">Analyzed wallet</p>
                <a href={explorerAddressUrl(input.trim())} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-mono text-sm text-slate-300 hover:text-accent transition-colors cursor-pointer w-fit group mb-4"
                >
                  {shortAddress(input.trim())}
                  <ExternalLink size={11} className="opacity-40 group-hover:opacity-100" />
                </a>
                {signals.length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {Object.entries(typeCounts).map(([type, count]) =>
                      count > 0 ? (
                        <div key={type} className="flex items-center gap-2">
                          <SignalTypeBadge type={type} />
                          <span className="text-xs font-mono text-slate-600">×{count}</span>
                        </div>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {signals.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Total Signals"  value={signals.length} accent="green" />
              <StatCard label="Smart Money In" value={smartCount} sub="of total" accent="green" />
              <StatCard label="Avg Confidence" value={`${avgConf}%`} accent="amber" />
            </div>
          )}

          <div className="glass-card glass-card-accent rounded-2xl overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-white/[0.04]">
              <p className="section-label">Signal history — click to verify</p>
            </div>
            {signals.length === 0 ? (
              <div className="py-16 text-center text-slate-700 font-mono text-sm">
                <ShieldCheck size={28} className="mx-auto mb-3 text-slate-800" />
                No signals detected for this wallet
              </div>
            ) : (
              <SignalTable signals={signals} onRowClick={setSelected} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
