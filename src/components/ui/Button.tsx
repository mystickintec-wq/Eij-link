import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-[#0E7490] via-[#0891B2] to-[#2563EB] hover:from-[#0C647D] hover:via-[#0E7490] hover:to-[#1D4ED8] dark:bg-none dark:bg-[#43D9E9] dark:hover:bg-[#22D3EE] text-white dark:text-[#080D18] font-semibold border border-transparent shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),0_3px_10px_-2px_rgba(8,145,178,0.38)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45),0_2px_10px_-1px_rgba(67,217,233,0.3)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.28),0_8px_20px_-4px_rgba(37,99,235,0.42)] dark:hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5),0_6px_18px_-3px_rgba(67,217,233,0.4)] disabled:bg-none disabled:bg-slate-200 disabled:text-slate-600 disabled:border-slate-300 disabled:shadow-none dark:disabled:bg-[#172438] dark:disabled:text-[#8493A8] dark:disabled:border-[#253448]',
  secondary:
    'bg-white/95 hover:bg-sky-50/90 dark:bg-[#172438] dark:hover:bg-[#1e2f4a] text-slate-900 dark:text-[#F4F7FB] font-medium border border-slate-200/95 dark:border-[#253448] hover:border-cyan-400/70 dark:hover:border-[#364b68] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_1px_3px_rgba(14,116,144,0.06)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] hover:shadow-[0_4px_12px_-3px_rgba(14,116,144,0.14)] disabled:bg-slate-100 disabled:text-slate-600 disabled:border-slate-200 disabled:shadow-none dark:disabled:bg-[#101C2C] dark:disabled:text-[#8493A8]',
  outline:
    'bg-white/60 hover:bg-sky-50/80 dark:bg-transparent dark:hover:bg-[#172438]/70 text-slate-800 dark:text-[#F4F7FB] font-medium border border-slate-300/90 dark:border-[#253448] hover:border-[#0891B2]/60 dark:hover:border-[#43D9E9]/50 disabled:text-slate-600 disabled:border-slate-200 dark:disabled:text-[#8493A8]',
  ghost:
    'bg-transparent hover:bg-sky-100/60 dark:hover:bg-[#172438]/70 text-slate-700 dark:text-[#A0AEC0] hover:text-[#0E7490] dark:hover:text-[#F4F7FB] font-medium border border-transparent disabled:text-slate-600 dark:disabled:text-[#8493A8]',
  danger:
    'bg-rose-600 hover:bg-rose-700 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 text-white dark:text-rose-300 font-semibold border border-transparent dark:border-rose-500/35 shadow-sm shadow-rose-900/15 disabled:bg-slate-200 disabled:text-slate-600 disabled:shadow-none dark:disabled:bg-[#172438] dark:disabled:text-[#8493A8]',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-xs gap-1.5 rounded-[10px]',
  md: 'h-10 px-4 text-xs sm:text-[13px] gap-2 rounded-[11px]',
  lg: 'h-11 px-5 text-sm gap-2 rounded-[12px]',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        className={`relative overflow-hidden inline-flex items-center justify-center whitespace-nowrap shrink-0 font-ethiopic transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-out active:scale-[0.98] disabled:active:scale-100 motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#080D18] disabled:cursor-not-allowed cursor-pointer ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
        ) : leftIcon ? (
          <span className="shrink-0 inline-flex items-center" aria-hidden="true">
            {leftIcon}
          </span>
        ) : null}
        {children}
        {!isLoading && rightIcon && (
          <span className="shrink-0 inline-flex items-center" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
}

const ICON_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'w-9 h-9 rounded-[10px]',
  md: 'w-10 h-10 rounded-[11px]',
  lg: 'w-11 h-11 rounded-[12px]',
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      label,
      children,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        title={props.title || label}
        className={`inline-flex items-center justify-center shrink-0 transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-out active:scale-[0.96] disabled:active:scale-100 motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#080D18] disabled:cursor-not-allowed cursor-pointer ${VARIANT_CLASSES[variant]} ${ICON_SIZE_CLASSES[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
