import { FlaskConical } from "lucide-react";
import { IS_DEMO } from "../lib/contract";

// Not dismissible on purpose: while the dashboard shows sample signals, every
// screen has to say so. Each figure built from them carries its own label too.
export default function DemoBanner() {
  if (!IS_DEMO) return null;
  return (
    <div className="border-b border-line bg-surface-2" role="status">
      <div className="max-w-6xl mx-auto flex items-start gap-3 px-4 sm:px-6 py-3">
        <span className="mt-0.5 inline-flex items-center gap-1.5 shrink-0 rounded-sm border border-ink bg-surface px-1.5 py-0.5 font-mono text-[12px] font-medium text-ink">
          <FlaskConical size={13} strokeWidth={2} aria-hidden="true" />
          Demo
        </span>
        <p className="text-[14px] leading-6 text-ink-2">
          These are sample signals, not live Mantle data. The signals contract is not deployed on
          this deployment yet, so wallets and hashes are placeholders.
        </p>
      </div>
    </div>
  );
}
