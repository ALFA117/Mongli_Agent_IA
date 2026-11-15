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

// One fixed colour per signal type, used only to encode that type.
export const SIGNAL_STYLES = {
  SMART_MONEY_IN: {
    label: "Smart Money In", short: "Smart money",
    text: "text-smart", bg: "bg-smart-soft", dot: "bg-smart", bar: "bg-smart",
    hex: "#0A6B4B",
  },
  WHALE_MOVE: {
    label: "Whale Move", short: "Whale",
    text: "text-whale", bg: "bg-whale-soft", dot: "bg-whale", bar: "bg-whale",
    hex: "#1D4F91",
  },
  ANOMALY: {
    label: "Anomaly", short: "Anomaly",
    text: "text-anomaly", bg: "bg-anomaly-soft", dot: "bg-anomaly", bar: "bg-anomaly",
    hex: "#8A5300",
  },
};

export function getSignalStyle(type) {
  return (
    SIGNAL_STYLES[type] ?? {
      label: type, short: type, text: "text-ink-2", bg: "bg-surface-2",
      dot: "bg-muted", bar: "bg-muted", hex: "#5E636D",
    }
  );
}

// Confidence bands: high = accent, medium = neutral ink, low = danger.
export function confidenceTone(n) {
  if (n >= 85) return { text: "text-accent-ink", bar: "bg-accent", word: "High" };
  if (n >= 70) return { text: "text-ink", bar: "bg-ink-2", word: "Medium" };
  return { text: "text-danger", bar: "bg-danger", word: "Low" };
}
