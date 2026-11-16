import React from 'react';

export type CardVariant = 'default' | 'elevated' | 'interactive' | 'dashed';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const CARD_VARIANTS: Record<CardVariant, string> = {
  default:
    'bg-white/92 dark:bg-[#101C2C]/88 backdrop-blur-xl border border-slate-200/90 dark:border-[#253448] shadow-[0_2px_6px_rgba(14,116,144,0.04),0_12px_28px_-10px_rgba(15,23,42,0.08)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_8px_28px_-6px_rgba(0,0,0,0.42)] transition-[border-color,box-shadow,background-color] duration-200',
  elevated:
    'bg-gradient-to-br from-white via-sky-50/45 to-indigo-50/35 dark:bg-none dark:bg-[#152236]/92 backdrop-blur-xl border border-sky-200/80 dark:border-[#293B52] shadow-[0_2px_8px_rgba(14,116,144,0.05),0_12px_30px_-10px_rgba(79,70,229,0.08)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_10px_30px_-6px_rgba(0,0,0,0.45)] transition-[border-color,box-shadow,background-color] duration-200',
  interactive:
    'group bg-white/92 dark:bg-[#101C2C]/88 backdrop-blur-xl border border-slate-200/90 dark:border-[#253448] shadow-[0_2px_6px_rgba(14,116,144,0.04),0_12px_28px_-10px_rgba(15,23,42,0.08)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_8px_28px_-6px_rgba(0,0,0,0.42)] hover:border-cyan-500/60 dark:hover:border-[#43D9E9]/55 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-8px_rgba(8,145,178,0.20)] dark:hover:shadow-[inset_0_1px_0_0_rgba(67,217,233,0.12),0_12px_32px_-6px_rgba(67,217,233,0.16)] motion-reduce:hover:translate-y-0 transition-[border-color,transform,box-shadow,background-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
  dashed:
    'bg-sky-50/45 dark:bg-[#101C2C]/65 backdrop-blur-md border border-dashed border-cyan-300/80 dark:border-[#253448] transition-colors duration-200',
};

const CARD_PADDING: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-7',
};

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`rounded-[16px] ${CARD_VARIANTS[variant]} ${CARD_PADDING[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface StatCardProps {
  label: string;
  value: string | number;
  caption?: string;
  icon?: React.ReactNode;
  accent?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'neutral';
  className?: string;
}

const ACCENT_VALUE_CLASS: Record<NonNullable<StatCardProps['accent']>, string> = {
  cyan: 'text-[#0E7490] dark:text-[#43D9E9]',
  violet: 'text-[#4F46E5] dark:text-[#8585FF]',
  emerald: 'text-emerald-700 dark:text-emerald-400',
  amber: 'text-amber-700 dark:text-amber-400',
  neutral: 'text-slate-900 dark:text-[#F4F7FB]',
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  caption,
  icon,
  accent = 'cyan',
  className = '',
}) => {
  return (
    <div
      className={`p-4 sm:p-5 rounded-[14px] bg-slate-50 dark:bg-[#172438] border border-slate-200 dark:border-[#253448] ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-xs font-medium text-slate-600 dark:text-[#A0AEC0]">
          {label}
        </span>
        {icon && (
          <span className="text-slate-600 dark:text-[#A0AEC0]" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <div
        className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums tracking-tight ${ACCENT_VALUE_CLASS[accent]}`}
      >
        {value}
      </div>
      {caption && (
        <p className="text-[11px] text-slate-600 dark:text-[#A0AEC0] mt-1 leading-snug">
          {caption}
        </p>
      )}
    </div>
  );
};

export interface WorkspaceHeaderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  accent?: 'cyan' | 'violet' | 'emerald' | 'amber';
}

const HEADER_ICON_TONE: Record<NonNullable<WorkspaceHeaderProps['accent']>, string> = {
  cyan: 'bg-gradient-to-br from-cyan-500/18 to-sky-500/15 dark:from-[#43D9E9]/15 dark:to-[#43D9E9]/10 border border-cyan-500/25 dark:border-[#43D9E9]/25 text-[#0E7490] dark:text-[#43D9E9]',
  violet: 'bg-gradient-to-br from-indigo-500/18 to-violet-500/15 dark:from-[#8585FF]/15 dark:to-[#8585FF]/10 border border-indigo-500/25 dark:border-[#8585FF]/25 text-[#4F46E5] dark:text-[#8585FF]',
  emerald: 'bg-gradient-to-br from-emerald-500/18 to-teal-500/15 dark:from-emerald-400/15 dark:to-emerald-400/10 border border-emerald-500/25 dark:border-emerald-400/25 text-emerald-700 dark:text-emerald-400',
  amber: 'bg-gradient-to-br from-amber-500/18 to-orange-500/15 dark:from-amber-400/15 dark:to-amber-400/10 border border-amber-500/25 dark:border-amber-400/25 text-amber-700 dark:text-amber-400',
};

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  title,
  description,
  icon,
  meta,
  actions,
  accent = 'cyan',
}) => {
  return (
    <div className="p-5 sm:p-6 rounded-[16px] bg-gradient-to-r from-white via-sky-50/40 to-indigo-50/35 dark:bg-none dark:bg-[#101C2C] border border-slate-200/90 dark:border-[#253448] shadow-[0_2px_8px_rgba(14,116,144,0.04)] dark:shadow-none flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
        <div
          className={`w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0 ${HEADER_ICON_TONE[accent]}`}
          aria-hidden="true"
        >
          {icon}
        </div>
        <div className="min-w-0 space-y-0.5">
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F4F7FB] tracking-tight font-ethiopic">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#A0AEC0] leading-relaxed max-w-2xl font-ethiopic">
            {description}
          </p>
          {meta && (
            <div className="pt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-[#A0AEC0]">
              {meta}
            </div>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
