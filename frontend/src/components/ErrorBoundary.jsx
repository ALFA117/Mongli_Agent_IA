import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const message = this.state.error?.message || "An unexpected error occurred.";

    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] text-center px-4">
        <div className="glass-card glass-card-anomaly rounded-2xl p-8 max-w-md w-full">

          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}
          >
            <AlertTriangle size={26} className="text-amber-400" />
          </div>

          <p className="font-display text-lg font-bold text-slate-200 mb-2">
            Render Error
          </p>

          <p className="text-xs font-mono text-slate-500 mb-6 leading-relaxed break-words">
            {message}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg font-mono text-xs transition-all cursor-pointer"
            style={{
              background: "rgba(251,191,36,0.1)",
              border: "1px solid rgba(251,191,36,0.2)",
              color: "#fbbf24",
            }}
          >
            <RefreshCw size={12} />
            Reload page
          </button>

        </div>
      </div>
    );
  }
}
