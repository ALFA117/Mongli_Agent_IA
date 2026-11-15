import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ethers } from "ethers";
import { Search, ExternalLink, AlertCircle, ShieldQuestion, FlaskConical, ArrowRight } from "lucide-react";
import SignalTable from "../components/SignalTable";
import SignalModal from "../components/SignalModal";
import SignalTypeBadge from "../components/SignalTypeBadge";
import StateBlock from "../components/StateBlock";
import { fetchSignalsByWallet, IS_DEMO } from "../lib/contract";
import { shortAddress, explorerAddressUrl, SIGNAL_STYLES, confidenceTone } from "../lib/utils";

const DEMO_WALLETS = [
  { address: "0xd3aD4c7e8F9b2A1c3E5D7f0B8e2a4C6d8F0B2e4A", label: "Smart money · 5 signals" },
  { address: "0xA1b2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9b0", label: "Whale · 3 signals" },
  { address: "0xF0e1D2c3B4a5F6e7D8c9B0a1F2e3D4c5B6a7F8e9", label: "Mixed · 3 signals" },
  { address: "0xBb1a2C3d4E5f6A7b8C9d0E1f2A3b4C5d6E7f8A9c", label: "Smart money · 3 signals" },
];

/* Conviction gauge: share of this wallet's signals that are Smart Money In */
function ScoreRing({ score }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const tone = score >= 70 ? "rgb(var(--accent))" : score >= 40 ? "rgb(var(--ink-2))" : "rgb(var(--danger))";
  const label = score >= 70 ? "High" : score >= 40 ? "Medium" : "Low";
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-24 w-24 shrink-0">
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 88 88" aria-hidden="true">
          <circle cx={44} cy={44} r={r} fill="none" stroke="rgb(var(--surface-2))" strokeWidth={8} />
          <circle cx={44} cy={44} r={r} fill="none" stroke={tone} strokeWidth={8}
            strokeDasharray={`${(score / 100) * circ} ${circ}`}
            style={{ transition: "stroke-dasharray 700ms cubic-bezier(.2,.7,.2,1)" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="num text-[24px] font-medium">{score}</span>
        </div>
      </div>
      <div>
        <p className="text-[16px] font-semibold">{label} conviction</p>
        <p className="text-[13px] text-muted">SmartMoney score, 0–100</p>
      </div>
    </div>
  );
}

export default function WalletExplorer() {
  const [params, setParams] = useSearchParams();
  const [input,    setInput]    = useState(params.get("address") ?? "");
  const [address,  setAddress]  = useState("");
  const [signals,  setSignals]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [rpcError, setRpcError] = useState("");
  const [selected, setSelected] = useState(null);

  const lookup = useCallback(async (raw) => {
    const addr = (raw ?? "").trim();
    setError(""); setRpcError(""); setSignals(null);
    // Accept any 40-hex address regardless of checksum casing (the sample
    // wallets are not checksummed), then normalise it for the RPC call.
    if (!ethers.isAddress(addr.toLowerCase())) { setError("Enter a valid Mantle / Ethereum address: 0x followed by 40 hex characters."); return; }
    setInput(addr);
    setAddress(addr);
    setParams({ address: addr }, { replace: true });
    setLoading(true);
    try { setSignals(await fetchSignalsByWallet(ethers.getAddress(addr.toLowerCase()))); }
    catch (err) { setRpcError(err?.message ?? "The RPC did not answer."); }
    finally { setLoading(false); }
  }, [setParams]);

  // Arriving from a signal ("Wallet history") runs the lookup straight away.
  const fromUrl = params.get("address");
  useEffect(() => {
    if (fromUrl && fromUrl.toLowerCase() !== address.toLowerCase()) lookup(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromUrl]);

  const smartCount = signals?.filter((s) => s.type === "SMART_MONEY_IN").length ?? 0;
  const avgConf    = signals?.length ? Math.round(signals.reduce((a, s) => a + s.confidence, 0) / signals.length) : 0;
  const score      = signals?.length ? Math.round((smartCount / signals.length) * 100) : 0;
  const typeCounts = signals ? Object.keys(SIGNAL_STYLES).map((t) => [t, signals.filter((s) => s.type === t).length]) : [];

  return (
    <div className="space-y-8">
      {selected && <SignalModal signal={selected} onClose={() => setSelected(null)} showWalletLink={false} />}

      <header className="max-w-2xl">
        <p className="eyebrow">Wallet explorer</p>
        <h1 className="mt-2 text-[34px] sm:text-[44px] leading-[1.1] font-semibold">Look up a wallet</h1>
        <p className="mt-3 text-[17px] leading-7 text-ink-2">
          See every signal the agent has recorded for an address and how strongly it reads as smart money.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <form
          onSubmit={(e) => { e.preventDefault(); lookup(input); }}
          className="block-lead enter p-5 sm:p-6 lg:col-span-7 lg:self-start"
          style={{ "--i": 0 }}
          noValidate
        >
          <label htmlFor="wallet-input" className="text-[15px] font-medium">Wallet address</label>
          <div className="mt-2 flex flex-col sm:flex-row gap-3">
            <input
              id="wallet-input"
              value={input}
              onChange={(e) => { setInput(e.target.value); if (error) setError(""); }}
              placeholder="0x…"
              spellCheck={false}
              autoComplete="off"
              inputMode="text"
              className="input flex-1 min-w-0"
              aria-invalid={!!error}
              aria-describedby={error ? "wallet-error" : "wallet-help"}
            />
            <button type="submit" disabled={loading} className="btn-primary">
              <Search size={16} aria-hidden="true" />
              {loading ? "Looking up…" : "Look up"}
            </button>
          </div>
          {error ? (
            <p id="wallet-error" role="alert" className="mt-2 flex items-start gap-2 text-[14px] text-danger">
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" /> {error}
            </p>
          ) : (
            <p id="wallet-help" className="mt-2 text-[13px] text-muted">Paste any 0x address on Mantle.</p>
          )}
        </form>

        {IS_DEMO && (
          <section className="block-card enter p-5 sm:p-6 lg:col-span-5" style={{ "--i": 1 }} aria-labelledby="demo-w">
            <h2 id="demo-w" className="flex items-center gap-2 text-[18px] font-semibold">
              <FlaskConical size={18} aria-hidden="true" /> Try a sample wallet
            </h2>
            <p className="mt-1 text-[13px] text-muted">One tap loads its demo history.</p>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {DEMO_WALLETS.map((w) => (
                <li key={w.address}>
                  <button
                    type="button"
                    onClick={() => lookup(w.address)}
                    className="row-click w-full min-h-[48px] flex items-center gap-3 px-1 text-left"
                  >
                    <span className="num text-[14px] text-ink">{shortAddress(w.address)}</span>
                    <span className="text-[14px] text-ink-2 truncate">{w.label}</span>
                    <ArrowRight size={16} className="ml-auto shrink-0 text-muted" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" aria-hidden="true">
          <div className="block-card p-6 lg:col-span-5"><div className="skeleton h-24 w-full" /></div>
          <div className="block-card p-6 lg:col-span-7"><div className="skeleton h-24 w-full" /></div>
        </div>
      )}

      {rpcError && (
        <div className="block-card">
          <StateBlock icon={AlertCircle} tone="error" title="Could not read this wallet"
            action={<button className="btn-secondary" onClick={() => lookup(address)}>Try again</button>}>
            {rpcError}
          </StateBlock>
        </div>
      )}

      {signals !== null && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <section className="block-card enter p-5 sm:p-6 lg:col-span-5" style={{ "--i": 0 }}>
              <p className="label">Analyzed wallet</p>
              {IS_DEMO ? (
                <p className="mt-1 num text-[18px] break-all">{shortAddress(address)}</p>
              ) : (
                <a href={explorerAddressUrl(address)} target="_blank" rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 num text-[18px] underline decoration-line underline-offset-4 hover:decoration-ink">
                  {shortAddress(address)} <ExternalLink size={14} aria-hidden="true" />
                </a>
              )}
              {signals.length > 0 && <div className="mt-5"><ScoreRing score={score} /></div>}
            </section>

            {signals.length > 0 && (
              <section className="block-card enter p-5 sm:p-6 lg:col-span-7" style={{ "--i": 1 }}>
                <dl className="grid grid-cols-3 gap-4 border-b border-line pb-5">
                  <div>
                    <dt className="label">Signals</dt>
                    <dd className="mt-1 num text-[30px] leading-none">{signals.length}</dd>
                  </div>
                  <div>
                    <dt className="label">Smart money in</dt>
                    <dd className="mt-1 num text-[30px] leading-none">{smartCount}</dd>
                  </div>
                  <div>
                    <dt className="label">Avg. confidence</dt>
                    <dd className={`mt-1 num text-[30px] leading-none ${confidenceTone(avgConf).text}`}>{avgConf}%</dd>
                  </div>
                </dl>
                <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                  {typeCounts.map(([t, n]) => n > 0 && (
                    <li key={t} className="flex items-center gap-2">
                      <SignalTypeBadge type={t} />
                      <span className="num text-[14px] text-ink-2">× {n}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <section className="block-card overflow-hidden enter" style={{ "--i": 2 }} aria-labelledby="hist-h">
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 sm:px-5 py-4 border-b border-ink">
              <h2 id="hist-h" className="text-[20px] font-semibold">{IS_DEMO ? "Sample signal history" : "Signal history"}</h2>
              <p className="text-[13px] text-muted">Select a row for details</p>
            </div>
            {signals.length === 0 ? (
              <StateBlock icon={ShieldQuestion} title="No signals for this wallet">
                {IS_DEMO
                  ? "This address is not in the demo set. Try one of the sample wallets above."
                  : "The agent has not flagged this address. That is not a verdict on the wallet, only that nothing crossed its thresholds."}
              </StateBlock>
            ) : (
              <SignalTable signals={signals} onRowClick={setSelected} />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
