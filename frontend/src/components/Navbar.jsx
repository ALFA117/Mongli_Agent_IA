import { NavLink } from "react-router-dom";
import { Activity, Wallet, BarChart3, Zap, Cpu } from "lucide-react";
import { shortAddress, getSignalStyle, formatTime } from "../lib/utils";

const NAV = [
  { to: "/",         label: "Live Feed",        Icon: Activity  },
  { to: "/wallet",   label: "Wallet Explorer",  Icon: Wallet    },
  { to: "/analytics",label: "Analytics",        Icon: BarChart3 },
];

function SonarDot({ active }) {
  if (!active) return (
    <span className="w-2 h-2 rounded-full bg-slate-700" />
  );
  return (
    <span className="relative flex items-center justify-center w-3 h-3">
      <span className="absolute w-3 h-3 rounded-full bg-accent animate-sonar" />
      <span className="relative w-2 h-2 rounded-full bg-accent shadow-glow-sm" />
    </span>
  );
}

function LatestBar({ signal }) {
  if (!signal) return null;
  const s = getSignalStyle(signal.type);
  return (
    <div
      className="h-7 border-b border-accent/10 flex items-center px-5 gap-3 overflow-hidden"
      style={{ background: "rgba(0,255,136,0.018)" }}
    >
      <span className="text-[10px] font-mono text-accent/40 shrink-0 tracking-widest uppercase">
        Latest
      </span>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot} animate-pulseDot`} />
      <span className="text-xs font-mono text-slate-500 truncate">
        <span className={s.color}>{s.label}</span>
        {" · "}{shortAddress(signal.wallet)}
        {" · "}{signal.confidence}% confidence
        {" · "}{formatTime(signal.timestamp)}
      </span>
      <span className="ml-auto text-[10px] font-mono text-slate-800 shrink-0 hidden sm:block">
        MANTLE NETWORK
      </span>
    </div>
  );
}

export default function Navbar({ agentActive = false, totalSignals = 0, latestSignal = null }) {
  return (
    <header className="sticky top-0 z-50">
      {/* ── Main bar ──────────────────────────────────────────────── */}
      <div className="glass-card rounded-none border-x-0 border-t-0 border-b border-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">

          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "rgba(0,255,136,0.1)",
                border: "1px solid rgba(0,255,136,0.3)",
                boxShadow: "0 0 12px rgba(0,255,136,0.15)",
              }}
            >
              <Zap size={15} className="text-accent" strokeWidth={2.5} />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-display text-[13px] font-bold tracking-[0.18em] text-accent">
                MONGLI
              </span>
              <span className="text-[9px] font-mono text-slate-600 tracking-widest">AGENT IA</span>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-5 bg-slate-800 mx-1" />

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {NAV.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} end={to === "/"} className="flex">
                {({ isActive }) => (
                  <span
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer transition-all duration-150 ${
                      isActive ? "nav-active" : "nav-inactive"
                    }`}
                  >
                    <Icon size={12} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="hidden md:block">{label}</span>
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-slate-600">
              <Cpu size={11} className="text-accent/40" />
              {totalSignals.toLocaleString()} signals
            </span>

            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{
                background: "rgba(10,30,48,0.7)",
                border: `1px solid ${agentActive ? "rgba(0,255,136,0.2)" : "rgba(71,85,105,0.3)"}`,
                boxShadow: agentActive ? "0 0 10px rgba(0,255,136,0.08)" : "none",
              }}
            >
              <SonarDot active={agentActive} />
              <span
                className="text-[10px] font-mono tracking-widest"
                style={{ color: agentActive ? "#00ff88" : "#475569" }}
              >
                {agentActive ? "LIVE" : "OFFLINE"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Latest signal ticker ───────────────────────────────────── */}
      <LatestBar signal={latestSignal} />
    </header>
  );
}
