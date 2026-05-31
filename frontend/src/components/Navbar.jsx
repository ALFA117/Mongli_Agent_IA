import { NavLink } from "react-router-dom";
import { Activity, Wallet, BarChart3, Zap } from "lucide-react";

const NAV = [
  { to: "/", label: "Live Feed", Icon: Activity },
  { to: "/wallet", label: "Wallet Explorer", Icon: Wallet },
  { to: "/analytics", label: "Analytics", Icon: BarChart3 },
];

export default function Navbar({ agentActive = false, totalSignals = 0 }) {
  return (
    <header className="sticky top-0 z-50 glass border-b border-green-400/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-4">

        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0 mr-2">
          <div className="w-7 h-7 rounded-lg bg-green-400/10 border border-green-400/25 flex items-center justify-center">
            <Zap size={14} className="text-green-400" strokeWidth={2.5} />
          </div>
          <span
            className="text-sm font-bold tracking-widest text-green-400"
            style={{ fontFamily: "Orbitron, monospace" }}
          >
            MONGLI
          </span>
          <span className="hidden sm:block text-xs text-slate-600 font-mono">/ Agent IA</span>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {NAV.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} className="flex">
              {({ isActive }) => (
                <span
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-green-400/10 text-green-400 border border-green-400/20 shadow-brand-sm"
                      : "text-slate-500 hover:text-slate-200 hover:bg-slate-700/30 border border-transparent"
                  }`}
                >
                  <Icon size={13} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="hidden sm:block">{label}</span>
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden md:block text-xs font-mono text-slate-600">
            {totalSignals.toLocaleString()} signals recorded
          </span>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700/40">
            <span
              className={`w-2 h-2 rounded-full ${
                agentActive
                  ? "bg-green-400 animate-pulse_dot shadow-[0_0_6px_rgba(74,222,128,0.5)]"
                  : "bg-slate-600"
              }`}
            />
            <span
              className={`text-xs font-mono tracking-widest ${
                agentActive ? "text-green-400" : "text-slate-600"
              }`}
            >
              {agentActive ? "LIVE" : "OFFLINE"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
