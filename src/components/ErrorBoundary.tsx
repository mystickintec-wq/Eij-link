import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  title?: string;
  description?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('EjjiLink workspace ErrorBoundary caught an error:', error, info.componentStack);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }

      const message =
        this.props.description ||
        this.state.error?.message ||
        'An unexpected rendering issue occurred inside this module.';

      return (
        <div
          role="alert"
          className="rounded-[16px] border border-rose-300/80 dark:border-rose-500/35 bg-rose-50/90 dark:bg-[#121C2D] p-6 text-slate-900 dark:text-[#F4F7FB] shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-[10px] bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-700 dark:text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 space-y-1">
                <h3 className="font-heading text-base font-bold text-slate-900 dark:text-[#F4F7FB]">
                  {this.props.title || 'This workspace encountered a rendering issue'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-[#A0AEC0] leading-relaxed break-words">
                  {message}
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={this.handleReset}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="shrink-0"
            >
              Reload Module
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
