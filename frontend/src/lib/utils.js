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
  const d = new Date(unix * 1000);
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);

  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const SIGNAL_STYLES = {
  SMART_MONEY_IN: {
    label: "Smart Money In",
    color: "text-green-400",
    bg: "bg-green-400/10",
    border: "border-green-400/20",
    dot: "bg-green-400",
    rowAccent: "border-l-2 border-green-400/40",
  },
  WHALE_MOVE: {
    label: "Whale Move",
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
    border: "border-indigo-400/20",
    dot: "bg-indigo-400",
    rowAccent: "border-l-2 border-indigo-400/40",
  },
  ANOMALY: {
    label: "Anomaly",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    dot: "bg-amber-400",
    rowAccent: "border-l-2 border-amber-400/40",
  },
};

export function getSignalStyle(type) {
  return (
    SIGNAL_STYLES[type] ?? {
      label: type,
      color: "text-slate-400",
      bg: "bg-slate-400/10",
      border: "border-slate-400/20",
      dot: "bg-slate-400",
      rowAccent: "",
    }
  );
}
