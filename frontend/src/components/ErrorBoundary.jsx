import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import StateBlock from "./StateBlock";

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
      <div className="block-card max-w-lg mx-auto mt-10">
        <StateBlock
          icon={AlertTriangle}
          tone="error"
          title="This page failed to render"
          action={
            <button onClick={() => window.location.reload()} className="btn-secondary">
              <RefreshCw size={16} aria-hidden="true" /> Reload page
            </button>
          }
        >
          <span className="font-mono text-[13px] break-words">{message}</span>
        </StateBlock>
      </div>
    );
  }
}
