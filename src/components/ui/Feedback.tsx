import React, { useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  ShieldAlert,
  WifiOff,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Button } from './Button';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

export interface StatusBadgeProps {
  tone?: StatusTone;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const BADGE_CLASSES: Record<StatusTone, string> = {
  neutral: 'bg-slate-100 dark:bg-[#172438] text-slate-700 dark:text-[#A0AEC0] border-slate-300/80 dark:border-[#253448]',
  info: 'bg-cyan-50 dark:bg-[#43D9E9]/10 text-[#0E7490] dark:text-[#43D9E9] border-cyan-300/70 dark:border-[#43D9E9]/30',
  success: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/70 dark:border-emerald-500/30',
  warning: 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-300/70 dark:border-amber-500/30',
  error: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300/70 dark:border-rose-500/30',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  tone = 'neutral',
  icon,
  children,
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] border text-[11px] font-semibold whitespace-nowrap font-ethiopic ${BADGE_CLASSES[tone]} ${className}`}
    >
      {icon && <span aria-hidden="true" className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export type AlertVariant = 'info' | 'success' | 'warning' | 'error' | 'offline' | 'permission';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const ALERT_STYLES: Record<AlertVariant, { box: string; icon: React.ReactNode }> = {
  info: {
    box: 'bg-cyan-50/90 dark:bg-[#43D9E9]/10 border-cyan-300/70 dark:border-[#43D9E9]/30 text-slate-800 dark:text-[#F4F7FB]',
    icon: <Info className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9]" />,
  },
  success: {
    box: 'bg-emerald-50/90 dark:bg-emerald-500/10 border-emerald-300/70 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />,
  },
  warning: {
    box: 'bg-amber-50/90 dark:bg-amber-500/10 border-amber-300/70 dark:border-amber-500/30 text-amber-900 dark:text-amber-200',
    icon: <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />,
  },
  error: {
    box: 'bg-rose-50/95 dark:bg-rose-500/10 border-rose-300/70 dark:border-rose-500/30 text-rose-900 dark:text-rose-200',
    icon: <AlertCircle className="w-4 h-4 text-rose-700 dark:text-rose-400" />,
  },
  offline: {
    box: 'bg-amber-50/90 dark:bg-amber-500/10 border-amber-300/70 dark:border-amber-500/30 text-amber-900 dark:text-amber-200',
    icon: <WifiOff className="w-4 h-4 text-amber-700 dark:text-amber-400" />,
  },
  permission: {
    box: 'bg-rose-50/95 dark:bg-rose-500/10 border-rose-300/70 dark:border-rose-500/30 text-rose-900 dark:text-rose-200',
    icon: <ShieldAlert className="w-4 h-4 text-rose-700 dark:text-rose-400" />,
  },
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  action,
  onDismiss,
  className = '',
}) => {
  const style = ALERT_STYLES[variant];
  const role = variant === 'error' || variant === 'permission' ? 'alert' : 'status';

  return (
    <div
      role={role}
      className={`animate-slide-up p-3.5 rounded-[12px] border text-xs flex items-start justify-between gap-3 font-ethiopic ${style.box} ${className}`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <span className="shrink-0 mt-0.5" aria-hidden="true">
          {style.icon}
        </span>
        <div className="min-w-0 space-y-0.5 leading-relaxed">
          {title && <strong className="block font-semibold">{title}</strong>}
          <div>{children}</div>
        </div>
      </div>

      {(action || onDismiss) && (
        <div className="flex items-center gap-1.5 shrink-0">
          {action}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss alert"
              className="w-7 h-7 rounded-[6px] flex items-center justify-center opacity-80 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] transition-opacity cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  maxWidthClass?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  maxWidthClass = 'max-w-2xl',
  children,
  footer,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080D18]/80 backdrop-blur-md"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div
        className={`relative z-10 bg-white dark:bg-[#101C2C] border border-slate-200 dark:border-[#253448] rounded-[20px] ${maxWidthClass} w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-[#F4F7FB] ejji-animate-modal`}
      >
        <div className="px-6 py-4 border-b border-slate-200 dark:border-[#253448] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="w-10 h-10 rounded-[10px] bg-[#0E7490]/10 dark:bg-[#43D9E9]/15 text-[#0E7490] dark:text-[#43D9E9] flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-heading text-lg font-bold font-ethiopic leading-snug">{title}</h3>
              {description && (
                <p className="text-xs text-slate-600 dark:text-[#A0AEC0] font-ethiopic leading-snug">
                  {description}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="w-9 h-9 rounded-[10px] bg-slate-100 dark:bg-[#172438] hover:bg-slate-200 dark:hover:bg-[#1e2f4a] text-slate-600 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB] flex items-center justify-center transition-[colors,transform] duration-150 active:scale-95 motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-[#253448] bg-slate-50/60 dark:bg-[#0D1726]/80 flex items-center justify-between gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidthClass="max-w-md"
      footer={
        <div className="w-full flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-slate-600 dark:text-[#A0AEC0] leading-relaxed">
        {message}
      </p>
    </Modal>
  );
};

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  return (
    <span className="relative group inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-[8px] bg-slate-900 dark:bg-[#172438] text-white dark:text-[#F4F7FB] border border-slate-700 dark:border-[#253448] text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 shadow-lg z-50"
      >
        {content}
      </span>
    </span>
  );
};
