import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  showHomeButton?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ROAR ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleRetry = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, error: null });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-[280px] w-full flex items-center justify-center p-6 bg-[#080808] text-white"
        >
          <div className="max-w-md w-full bg-[#111111] border border-white/10 rounded-2xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-[#FF5A1F]/10 border border-[#FF5A1F]/30 flex items-center justify-center mx-auto mb-4 text-[#FF5A1F]">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-heading font-black text-lg sm:text-xl uppercase tracking-wider text-white mb-2">
              {this.props.fallbackTitle || 'TEMPORARY DISPLAY ERROR'}
            </h3>

            <p className="text-xs sm:text-sm text-[#A0A0A0] mb-6 leading-relaxed">
              {this.props.fallbackMessage ||
                'An unexpected error occurred while rendering this section. Your training data is safe.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleRetry}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF5A1F] hover:bg-[#FF7545] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>

              {this.props.showHomeButton !== false && (
                <button
                  type="button"
                  onClick={this.handleGoHome}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Back to Home</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
