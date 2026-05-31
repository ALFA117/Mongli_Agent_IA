export function shortAddress(addr = "") {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function explorerAddressUrl(addr) {
  return `https://explorer.mantle.xyz/address/${addr}`;
}

export function explorerTxUrl(hash) {
  return `https://explorer.mantle.xyz/tx/${hash}`;
}

export function formatTime(unix) {
  if (!unix) return "—";
  const diff = Math.floor((Date.now() - unix * 1000) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(unix * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const SIGNAL_STYLES = {
  SMART_MONEY_IN: {
    label:       "Smart Money In",
    color:       "text-accent",
    bg:          "bg-accent/10",
    border:      "border-accent/20",
    dot:         "bg-accent",
    rowClass:    "signal-row-smart",
    accentHex:   "#00ff88",
    cardClass:   "glass-card-accent",
    glowShadow:  "shadow-glow-sm",
  },
  WHALE_MOVE: {
    label:       "Whale Move",
    color:       "text-sky-400",
    bg:          "bg-sky-400/10",
    border:      "border-sky-400/20",
    dot:         "bg-sky-400",
    rowClass:    "signal-row-whale",
    accentHex:   "#38bdf8",
    cardClass:   "glass-card-whale",
    glowShadow:  "shadow-whale-sm",
  },
  ANOMALY: {
    label:       "Anomaly",
    color:       "text-amber-400",
    bg:          "bg-amber-400/10",
    border:      "border-amber-400/20",
    dot:         "bg-amber-400",
    rowClass:    "signal-row-anomaly",
    accentHex:   "#fbbf24",
    cardClass:   "glass-card-anomaly",
    glowShadow:  "shadow-anomaly-sm",
  },
};

export function getSignalStyle(type) {
  return (
    SIGNAL_STYLES[type] ?? {
      label: type, color: "text-slate-400", bg: "bg-slate-400/10",
      border: "border-slate-400/20", dot: "bg-slate-400",
      rowClass: "", accentHex: "#64748b", cardClass: "glass-card-accent", glowShadow: "",
    }
  );
}
