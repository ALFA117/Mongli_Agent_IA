import { FlaskConical } from "lucide-react";
import { IS_DEMO } from "../lib/contract";

// Not dismissible on purpose: while the dashboard shows sample signals, every
// screen has to say so. Each figure built from them carries its own label too.
export default function DemoBanner() {
  if (!IS_DEMO) return null;
  return (
    <div className="border-b border-amber-400/25 bg-amber-400/[0.07]" role="status">
      <div className="max-w-7xl mx-auto flex items-start gap-3 px-4 sm:px-6 lg:px-8 py-2.5">
        <FlaskConical size={16} className="text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-slate-300">
          <span className="font-mono font-semibold text-amber-400">Demo mode</span>
          {" — "}these are sample signals, not live Mantle data. The contract address is not configured
          on this deployment yet.
        </p>
      </div>
    </div>
  );
}
