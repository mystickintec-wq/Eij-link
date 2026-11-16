import React from 'react';
import {
  AlertCircle,
  Loader2,
  RefreshCw,
  ShieldAlert,
  WifiOff,
} from 'lucide-react';
import { Button } from './Button';

export interface LoadingStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Processing request...',
  description,
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`p-8 rounded-[14px] bg-slate-50 dark:bg-[#172438]/60 border border-slate-200 dark:border-[#253448] flex flex-col items-center justify-center text-center gap-2.5 ${className}`}
    >
      <Loader2 className="w-6 h-6 text-[#0E7490] dark:text-[#43D9E9] animate-spin" aria-hidden="true" />
      <p className="text-sm font-semibold text-slate-800 dark:text-[#F4F7FB] font-ethiopic">{title}</p>
      {description && (
        <p className="text-xs text-slate-600 dark:text-[#A0AEC0] max-w-sm font-ethiopic">{description}</p>
      )}
    </div>
  );
};

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`p-10 rounded-[14px] bg-slate-50/70 dark:bg-[#172438]/40 border border-dashed border-slate-300 dark:border-[#253448] flex flex-col items-center justify-center text-center gap-3 ${className}`}
    >
      <div
        className="w-11 h-11 rounded-[12px] bg-[#0E7490]/10 dark:bg-[#43D9E9]/15 text-[#0E7490] dark:text-[#43D9E9] flex items-center justify-center"
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F4F7FB] font-ethiopic">{title}</h3>
        <p className="text-xs text-slate-600 dark:text-[#A0AEC0] leading-relaxed font-ethiopic">
          {description}
        </p>
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`p-5 rounded-[14px] bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ejji-animate-fade-up ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-700 dark:text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-0.5">
          <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200 font-ethiopic">{title}</h4>
          <p className="text-xs text-rose-800 dark:text-rose-300/90 leading-relaxed font-ethiopic">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button
          variant="danger"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
};

export interface PermissionDeniedStateProps {
  device: 'camera' | 'microphone';
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const PermissionDeniedState: React.FC<PermissionDeniedStateProps> = ({
  device,
  message,
  onRetry,
  className = '',
}) => {
  const deviceLabel = device === 'camera' ? 'Camera' : 'Microphone';
  return (
    <div
      role="alert"
      className={`p-5 rounded-[14px] bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/35 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ejji-animate-fade-up ${className}`}
    >
      <div className="flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-amber-950 dark:text-amber-200 font-ethiopic">
            {deviceLabel} Access Unavailable
          </h4>
          <p className="text-xs text-amber-900/95 dark:text-amber-200/90 leading-relaxed font-ethiopic">
            {message} Check your browser site permissions in the address bar and allow {deviceLabel.toLowerCase()} access, then retry.
          </p>
        </div>
      </div>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Retry {deviceLabel}
        </Button>
      )}
    </div>
  );
};

export const OfflineNotice: React.FC<{
  message: string;
  onRetry?: () => void;
}> = ({ message, onRetry }) => {
  return (
    <div
      role="status"
      className="p-3.5 rounded-[12px] bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 ejji-animate-fade-up"
    >
      <div className="flex items-center gap-2 min-w-0">
        <WifiOff className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" aria-hidden="true" />
        <span className="font-medium leading-snug font-ethiopic">{message}</span>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Retry Cloud
        </Button>
      )}
    </div>
  );
};
