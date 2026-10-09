import { useState } from "react";
import { NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Activity, Wallet, BarChart3, Zap, Menu, X, Sun, Moon } from "lucide-react";
import { shortAddress, getSignalStyle, formatTime } from "../lib/utils";
import { useTheme } from "../lib/theme";

const NAV = [
  { to: "/",          label: "Live Feed",       Icon: Activity  },
  { to: "/wallet",    label: "Wallet Explorer", Icon: Wallet    },
  { to: "/analytics", label: "Analytics",       Icon: BarChart3 },
];

const spring = { type: "spring", stiffness: 400, damping: 22 };

function SonarDot({ active }) {
  if (!active) return <span className="w-2 h-2 rounded-full bg-amber-400" aria-hidden="true" />;
  return (
    <span className="relative flex items-center justify-center w-3 h-3" aria-hidden="true">
      <span className="absolute w-3 h-3 rounded-full bg-accent animate-sonar" />
      <span className="relative w-2 h-2 rounded-full bg-accent" />
    </span>
  );
}

function LatestBar({ signal, demo }) {
  if (!signal) return null;
  const s = getSignalStyle(signal.type);
  return (
    <div className="border-b border-accent/15 bg-accent/[0.03]">
      <div className="max-w-7xl mx-auto min-h-9 flex items-center px-4 sm:px-6 gap-3 overflow-hidden">
        <span className="font-mono text-xs text-muted shrink-0 tracking-widest uppercase">{demo ? "Latest · sample" : "Latest"}</span>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot} animate-pulseDot`} aria-hidden="true" />
        <span className="font-mono text-xs text-slate-400 truncate">
          <span className={s.color}>{s.label}</span>
          {" · "}{shortAddress(signal.wallet)}
          {" · "}{signal.confidence}% confidence
          {" · "}{formatTime(signal.timestamp)}
        </span>
      </div>
    </div>
  );
}

function ThemeButton() {
  const { theme, toggle } = useTheme();
  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileTap={{ scale: 0.92 }}
      transition={spring}
      className="flex items-center justify-center w-11 h-11 rounded-xl glass-panel text-slate-300 hover:text-ink cursor-pointer"
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          className="flex"
          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {theme === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

export default function Navbar({ agentActive = false, totalSignals = 0, latestSignal = null }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="glass-card rounded-none border-x-0 border-t-0 border-b border-accent/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <NavLink to="/" className="flex min-h-11 items-center gap-2.5 shrink-0 rounded-xl" aria-label="Mongli Agent IA, live feed">
            <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent/10 border border-accent/30">
              <Zap size={16} className="text-accent" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-sm font-bold tracking-[0.18em] text-accent">MONGLI</span>
              <span className="hidden min-[360px]:block font-mono text-xs text-muted tracking-widest pt-1">AGENT IA</span>
            </span>
          </NavLink>

          <nav aria-label="Main" className="hidden md:flex items-center gap-1 ml-2">
            {NAV.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} end={to === "/"} className="flex rounded-lg">
                {({ isActive }) => (
                  <span className={`relative flex items-center gap-2 min-h-11 px-3 rounded-lg text-sm font-medium cursor-pointer ${isActive ? "text-accent" : "nav-inactive"}`}>
                    {isActive && (
                      <motion.span layoutId="nav-active" className="absolute inset-0 rounded-lg nav-active" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                    )}
                    <Icon size={15} strokeWidth={isActive ? 2.5 : 2} className="relative" aria-hidden="true" />
                    <span className="relative">{label}</span>
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden lg:inline font-mono text-xs text-muted">
              {totalSignals.toLocaleString()} signals{!agentActive && " (sample)"}
            </span>
            <span
              className={`flex items-center gap-2 min-h-11 min-w-11 justify-center px-3 rounded-xl glass-panel font-mono text-xs tracking-widest ${agentActive ? "text-accent" : "text-amber-400"}`}
              title={agentActive ? "Reading live signals from the contract" : "Showing sample signals"}
            >
              <SonarDot active={agentActive} />
              <span className="hidden min-[360px]:inline">{agentActive ? "LIVE" : "DEMO"}</span>
              <span className="sr-only min-[360px]:hidden">{agentActive ? "Live data" : "Demo data"}</span>
            </span>
            <ThemeButton />
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              transition={spring}
              className="md:hidden flex items-center justify-center w-11 h-11 rounded-xl glass-panel text-slate-300 hover:text-ink cursor-pointer"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden glass-card rounded-none border-x-0 border-t-0 border-b border-accent/15"
          >
            <nav aria-label="Main" className="max-w-7xl mx-auto px-4 py-3 space-y-1">
              {NAV.map(({ to, label, Icon }) => (
                <NavLink key={to} to={to} end={to === "/"} onClick={() => setMobileOpen(false)} className="flex rounded-xl">
                  {({ isActive }) => (
                    <span className={`flex items-center gap-3 w-full min-h-12 px-4 rounded-xl text-base font-medium cursor-pointer ${isActive ? "nav-active" : "nav-inactive"}`}>
                      <Icon size={17} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
                      {label}
                    </span>
                  )}
                </NavLink>
              ))}
              <p className="pt-3 px-4 font-mono text-xs text-muted border-t border-line/[0.06]">
                {totalSignals.toLocaleString()} signals {agentActive ? "recorded" : "(sample data)"}
              </p>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <LatestBar signal={latestSignal} demo={!agentActive} />
    </header>
  );
}
