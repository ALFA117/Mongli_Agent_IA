import { useState } from "react";
import { ethers } from "ethers";
import { Search, ExternalLink, TrendingUp, ShieldCheck, AlertCircle } from "lucide-react";
import SignalTable from "../components/SignalTable";
import StatCard from "../components/StatCard";
import SignalTypeBadge from "../components/SignalTypeBadge";
import { fetchSignalsByWallet } from "../lib/contract";
import { shortAddress, explorerAddressUrl, SIGNAL_STYLES } from "../lib/utils";

function ScoreRing({ score }) {
  const color =
    score >= 70 ? "text-green-400" :
    score >= 40 ? "text-amber-400" :
                  "text-slate-500";
  const label =
    score >= 70 ? "High" :
    score >= 40 ? "Medium" :
                  "Low";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`text-3xl font-bold tabular-nums ${color}`} style={{ fontFamily: "Orbitron, monospace" }}>
        {score}%
      </div>
      <div className={`text-xs font-mono ${color} opacity-70`}>{label} conviction</div>
    </div>
  );
}

export default function WalletExplorer() {
  const [input, setInput] = useState("");
  const [signals, setSignals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function lookup(e) {
    e?.preventDefault();
    const addr = input.trim();
    setError("");
    setSignals(null);
    if (!ethers.isAddress(addr)) {
      setError("Enter a valid Ethereum / Mantle wallet address (0x...).");
      return;
    }
    setLoading(true);
    try {
      const result = await fetchSignalsByWallet(addr);
      setSignals(result);
    } catch (err) {
      setError(err?.message ?? "Failed to fetch signals. Check the RPC connection.");
    } finally {
      setLoading(false);
    }
  }

  const smartMoneyCount = signals?.filter((s) => s.type === "SMART_MONEY_IN").length ?? 0;
  const avgConf = signals?.length
    ? Math.round(signals.reduce((a, s) => a + s.confidence, 0) / signals.length)
    : 0;
  const smartMoneyScore = signals?.length
    ? Math.round((smartMoneyCount / signals.length) * 100)
    : 0;

  const typeCounts = signals
    ? Object.fromEntries(
        Object.keys(SIGNAL_STYLES).map((t) => [t, signals.filter((s) => s.type === t).length])
      )
    : {};

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div>
        <h1
          className="text-xl font-bold text-slate-100 tracking-wide flex items-center gap-2.5"
          style={{ fontFamily: "Orbitron, monospace" }}
        >
          <span className="w-8 h-8 rounded-lg bg-green-400/10 border border-green-400/20 flex items-center justify-center">
            <Search size={16} className="text-green-400" />
          </span>
          Wallet Explorer
        </h1>
        <p className="text-xs font-mono text-slate-500 mt-1 ml-10">
          Look up any wallet's on-chain signal history and SmartMoney score
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={lookup} className="glass rounded-2xl p-5 space-y-3">
        <label
          htmlFor="wallet-input"
          className="block text-xs font-mono text-slate-500 uppercase tracking-widest"
        >
          Wallet Address
        </label>
        <div className="flex gap-2">
          <input
            id="wallet-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="0x..."
            spellCheck={false}
            autoComplete="off"
            className="flex-1 bg-[#050f14] border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-200 placeholder-slate-700 focus:outline-none focus:border-green-400/40 focus:ring-1 focus:ring-green-400/15 transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-green-400/10 border border-green-400/20 text-green-400 text-sm font-mono hover:bg-green-400/15 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
          >
            <Search size={14} />
            {loading ? "Fetching..." : "Lookup"}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-xs font-mono">
            <AlertCircle size={13} />
            {error}
          </div>
        )}
      </form>

      {/* Results */}
      {signals !== null && !loading && (
        <div className="space-y-4 animate-fade_in">

          {/* Wallet summary card */}
          <div className="glass rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">

              {/* Address info */}
              <div className="flex-1">
                <p className="text-xs font-mono text-slate-500 mb-2 uppercase tracking-widest">Analyzed wallet</p>
                <a
                  href={explorerAddressUrl(input.trim())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-slate-200 font-mono text-sm hover:text-green-400 transition-colors cursor-pointer w-fit group"
                >
                  <span className="truncate">{shortAddress(input.trim())}</span>
                  <ExternalLink size={12} className="shrink-0 opacity-50 group-hover:opacity-100" />
                </a>

                {signals.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(typeCounts).map(([type, count]) =>
                      count > 0 ? (
                        <div key={type} className="flex items-center gap-1.5">
                          <SignalTypeBadge type={type} />
                          <span className="text-xs font-mono text-slate-600">×{count}</span>
                        </div>
                      ) : null
                    )}
                  </div>
                )}
              </div>

              {/* SmartMoney score */}
              {signals.length > 0 && (
                <div className="glass-sm rounded-xl px-6 py-4 border border-green-400/10 flex flex-col items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 uppercase tracking-widest">
                    <TrendingUp size={12} />
                    SmartMoney Score
                  </div>
                  <ScoreRing score={smartMoneyScore} />
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          {signals.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Total Signals" value={signals.length} accent="green" />
              <StatCard label="Smart Money In" value={smartMoneyCount} sub="of total signals" accent="green" />
              <StatCard label="Avg Confidence" value={`${avgConf}%`} accent="amber" />
            </div>
          )}

          {/* Signal table */}
          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
              Signal history
            </p>
            {signals.length === 0 ? (
              <div className="text-center py-12 text-slate-600 font-mono text-sm">
                <ShieldCheck size={28} className="mx-auto mb-3 text-slate-700" />
                No signals detected for this wallet
              </div>
            ) : (
              <SignalTable signals={signals} />
            )}
          </div>

        </div>
      )}
    </div>
  );
}
