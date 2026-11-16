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
    'bg-[#0E7490] hover:bg-[#155E75] dark:bg-[#43D9E9] dark:hover:bg-[#2cc6d6] text-white dark:text-[#080D18] font-semibold border border-transparent shadow-xs disabled:bg-slate-200 disabled:text-slate-600 disabled:border-slate-300 disabled:shadow-none dark:disabled:bg-[#172438] dark:disabled:text-[#8493A8] dark:disabled:border-[#253448]',
  secondary:
    'bg-slate-100 hover:bg-slate-200 dark:bg-[#172438] dark:hover:bg-[#1e2f4a] text-slate-900 dark:text-[#F4F7FB] font-medium border border-slate-300/80 dark:border-[#253448] disabled:bg-slate-100 disabled:text-slate-600 disabled:border-slate-200 dark:disabled:bg-[#101C2C] dark:disabled:text-[#8493A8]',
  outline:
    'bg-transparent hover:bg-slate-100 dark:hover:bg-[#172438]/70 text-slate-800 dark:text-[#F4F7FB] font-medium border border-slate-300 dark:border-[#253448] disabled:text-slate-600 disabled:border-slate-200 dark:disabled:text-[#8493A8]',
  ghost:
    'bg-transparent hover:bg-slate-100 dark:hover:bg-[#172438]/70 text-slate-700 dark:text-[#A0AEC0] hover:text-slate-900 dark:hover:text-[#F4F7FB] font-medium border border-transparent disabled:text-slate-600 dark:disabled:text-[#8493A8]',
  danger:
    'bg-rose-600 hover:bg-rose-700 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 text-white dark:text-rose-300 font-semibold border border-transparent dark:border-rose-500/35 disabled:bg-slate-200 disabled:text-slate-600 dark:disabled:bg-[#172438] dark:disabled:text-[#8493A8]',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-xs gap-1.5 rounded-[8px]',
  md: 'h-10 px-4 text-xs sm:text-[13px] gap-2 rounded-[10px]',
  lg: 'h-11 px-5 text-sm gap-2 rounded-[10px]',
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
        className={`inline-flex items-center justify-center whitespace-nowrap shrink-0 font-ethiopic transition-[background-color,border-color,color,transform,box-shadow] duration-150 ease-out active:scale-[0.98] disabled:active:scale-100 motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#080D18] disabled:cursor-not-allowed cursor-pointer ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
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
  sm: 'w-9 h-9 rounded-[8px]',
  md: 'w-10 h-10 rounded-[10px]',
  lg: 'w-11 h-11 rounded-[10px]',
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
        className={`inline-flex items-center justify-center shrink-0 transition-[background-color,border-color,color,transform,box-shadow] duration-150 ease-out active:scale-[0.96] disabled:active:scale-100 motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#080D18] disabled:cursor-not-allowed cursor-pointer ${VARIANT_CLASSES[variant]} ${ICON_SIZE_CLASSES[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
