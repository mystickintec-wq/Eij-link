import React from 'react';

export type CardVariant = 'default' | 'elevated' | 'interactive' | 'dashed';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const CARD_VARIANTS: Record<CardVariant, string> = {
  default:
    'bg-white dark:bg-[#101C2C] border border-slate-200 dark:border-[#253448] transition-colors duration-150',
  elevated:
    'bg-slate-50 dark:bg-[#172438] border border-slate-200 dark:border-[#253448] transition-colors duration-150',
  interactive:
    'bg-white dark:bg-[#101C2C] border border-slate-200 dark:border-[#253448] hover:border-[#0E7490]/55 dark:hover:border-[#43D9E9]/55 hover:-translate-y-[1px] hover:shadow-sm motion-reduce:hover:translate-y-0 transition-[border-color,transform,box-shadow,background-color] duration-150 ease-out',
  dashed:
    'bg-white/60 dark:bg-[#101C2C]/60 border border-dashed border-slate-300 dark:border-[#253448] transition-colors duration-150',
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
  cyan: 'bg-[#0E7490]/10 dark:bg-[#43D9E9]/15 text-[#0E7490] dark:text-[#43D9E9]',
  violet: 'bg-[#4F46E5]/10 dark:bg-[#8585FF]/15 text-[#4F46E5] dark:text-[#8585FF]',
  emerald: 'bg-emerald-500/10 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-400',
  amber: 'bg-amber-500/10 dark:bg-amber-400/15 text-amber-700 dark:text-amber-400',
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
    <div className="p-5 sm:p-6 rounded-[16px] bg-white dark:bg-[#101C2C] border border-slate-200 dark:border-[#253448] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
