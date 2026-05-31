import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] text-center px-4">

      {/* Icon */}
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{
          background: "rgba(251,191,36,0.08)",
          border: "1px solid rgba(251,191,36,0.2)",
          boxShadow: "0 0 32px rgba(251,191,36,0.08)",
        }}
      >
        <AlertTriangle size={36} className="text-amber-400" />
      </div>

      {/* Code */}
      <p
        className="font-display text-6xl font-bold mb-2"
        style={{ color: "rgba(251,191,36,0.9)" }}
      >
        404
      </p>

      {/* Message */}
      <p className="text-slate-400 font-mono text-sm mb-2">
        Page not found
      </p>
      <p className="text-slate-700 font-mono text-xs mb-8">
        The signal you're looking for doesn't exist on this network.
      </p>

      {/* CTA */}
      <Link
        to="/"
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-sm transition-all cursor-pointer"
        style={{
          background: "rgba(0,255,136,0.08)",
          border: "1px solid rgba(0,255,136,0.2)",
          color: "#00ff88",
          boxShadow: "0 0 12px rgba(0,255,136,0.08)",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,255,136,0.15)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,255,136,0.08)")}
      >
        <ArrowLeft size={14} />
        Back to Live Feed
      </Link>

    </div>
  );
}
