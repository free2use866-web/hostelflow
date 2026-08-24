import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  /** Changing this value resets the boundary (e.g. on tab switch). */
  resetKey: string;
}

interface State {
  error: Error | null;
}

/**
 * Scoped crash isolation: a runtime error in one dashboard view no longer
 * blanks the whole app (the root boundary used to be the only net).
 * Remounts — and therefore self-heals — whenever `resetKey` changes.
 */
export class ViewErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface to console for debugging; production would forward to telemetry.
    console.error("[ViewErrorBoundary]", error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    // Self-heal when the user navigates away from the crashed view.
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        role="alert"
        className="flex flex-col items-center rounded-xl border border-destructive/30 bg-card px-6 py-10 text-center"
      >
        <p className="text-sm font-semibold text-destructive">
          This section hit an unexpected error.
        </p>
        <p className="mt-1 max-w-md break-words text-xs text-muted-foreground">
          {error.message || "Unknown runtime error"}
        </p>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <RefreshCw className="size-3.5" aria-hidden />
          Try again
        </button>
      </div>
    );
  }
}
