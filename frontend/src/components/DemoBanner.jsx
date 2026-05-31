import { useState } from "react";
import { FlaskConical, X } from "lucide-react";
import { IS_DEMO } from "../lib/contract";

export default function DemoBanner() {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem("demo-banner-dismissed") === "1"
  );

  if (!IS_DEMO || dismissed) return null;

  function dismiss() {
    sessionStorage.setItem("demo-banner-dismissed", "1");
    setDismissed(true);
  }

  return (
    <div
      className="flex items-center gap-3 px-5 py-2 border-b"
      style={{
        background: "rgba(251,191,36,0.05)",
        borderColor: "rgba(251,191,36,0.15)",
      }}
    >
      <FlaskConical size={13} className="text-amber-400 shrink-0" />
      <p className="text-xs font-mono text-amber-400/70 flex-1">
        <span className="text-amber-400 font-semibold">DEMO MODE</span>
        {" — "}
        <span className="text-slate-500">
          Showing sample signals. Set{" "}
          <code className="text-slate-400">VITE_CONTRACT_ADDRESS</code> to connect live data from Mantle.
        </span>
      </p>
      <button
        onClick={dismiss}
        className="text-slate-700 hover:text-slate-500 transition-colors cursor-pointer shrink-0"
        aria-label="Dismiss demo banner"
      >
        <X size={13} />
      </button>
    </div>
  );
}
