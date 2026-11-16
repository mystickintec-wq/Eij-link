import React, { useId } from 'react';
import { Search, X } from 'lucide-react';

interface BaseFieldProps {
  label?: string;
  helperText?: string;
  error?: string;
  containerClassName?: string;
}

export interface TextFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    BaseFieldProps {
  leftIcon?: React.ReactNode;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, helperText, error, leftIcon, containerClassName = '', className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const describedBy = error ? `${inputId}-error` : helperText ? `${inputId}-help` : undefined;

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 dark:text-[#F4F7FB]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 dark:text-[#A0AEC0] pointer-events-none"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={describedBy}
            className={`w-full min-h-[42px] bg-slate-50 dark:bg-[#080D18] border rounded-[10px] py-2 text-sm text-slate-900 dark:text-[#F4F7FB] placeholder:text-slate-500 dark:placeholder:text-[#A0AEC0]/80 transition-colors focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-600 dark:disabled:bg-[#101C2C] dark:disabled:text-[#8493A8] disabled:cursor-not-allowed ${
              leftIcon ? 'pl-10 pr-3.5' : 'px-3.5'
            } ${
              error
                ? 'border-rose-500 focus:ring-rose-500/25 focus:border-rose-500'
                : 'border-slate-300/80 dark:border-[#253448] focus:ring-[#0E7490]/25 dark:focus:ring-[#43D9E9]/25 focus:border-[#0E7490] dark:focus:border-[#43D9E9]'
            } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-rose-700 dark:text-rose-400">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-help`} className="text-xs text-slate-600 dark:text-[#A0AEC0]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextField.displayName = 'TextField';

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>,
    BaseFieldProps {
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onClear, className = '', ...props }, ref) => {
    const hasValue = Boolean(value && String(value).length > 0);

    return (
      <div className="relative flex-1">
        <Search
          className="w-4 h-4 text-slate-600 dark:text-[#A0AEC0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={ref}
          type="search"
          value={value}
          className={`w-full min-h-[42px] bg-slate-50 dark:bg-[#080D18] border border-slate-300/80 dark:border-[#253448] rounded-[10px] pl-10 ${
            hasValue && onClear ? 'pr-9' : 'pr-3.5'
          } py-2 text-sm text-slate-900 dark:text-[#F4F7FB] placeholder:text-slate-500 dark:placeholder:text-[#A0AEC0]/80 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0E7490]/25 dark:focus:ring-[#43D9E9]/25 focus:border-[#0E7490] dark:focus:border-[#43D9E9] disabled:bg-slate-100 disabled:text-slate-600 dark:disabled:bg-[#101C2C] dark:disabled:text-[#8493A8] disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-[6px] text-slate-600 hover:text-slate-900 dark:text-[#A0AEC0] dark:hover:text-[#F4F7FB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    BaseFieldProps {
  headerRight?: React.ReactNode;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, helperText, error, headerRight, containerClassName = '', className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const describedBy = error ? `${textareaId}-error` : helperText ? `${textareaId}-help` : undefined;

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {(label || headerRight) && (
          <div className="flex items-center justify-between gap-2">
            {label && (
              <label
                htmlFor={textareaId}
                className="text-xs font-semibold text-slate-700 dark:text-[#F4F7FB]"
              >
                {label}
              </label>
            )}
            {headerRight && (
              <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-[#A0AEC0]">
                {headerRight}
              </span>
            )}
          </div>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className={`w-full bg-slate-50 dark:bg-[#080D18] border rounded-[10px] p-3.5 text-sm text-slate-900 dark:text-[#F4F7FB] placeholder:text-slate-500 dark:placeholder:text-[#A0AEC0]/80 transition-colors focus:outline-none focus:ring-2 resize-none leading-relaxed disabled:bg-slate-100 disabled:text-slate-600 dark:disabled:bg-[#101C2C] dark:disabled:text-[#8493A8] disabled:cursor-not-allowed ${
            error
              ? 'border-rose-500 focus:ring-rose-500/25 focus:border-rose-500'
              : 'border-slate-300/80 dark:border-[#253448] focus:ring-[#0E7490]/25 dark:focus:ring-[#43D9E9]/25 focus:border-[#0E7490] dark:focus:border-[#43D9E9]'
          } ${className}`}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="text-xs text-rose-700 dark:text-rose-400">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${textareaId}-help`} className="text-xs text-slate-600 dark:text-[#A0AEC0]">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export interface SelectFieldProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    BaseFieldProps {}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, helperText, error, containerClassName = '', className = '', id, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-slate-700 dark:text-[#F4F7FB]"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error) || undefined}
          className={`w-full min-h-[42px] bg-slate-50 dark:bg-[#080D18] border rounded-[10px] pl-3.5 pr-9 py-2 text-xs sm:text-sm font-medium text-slate-900 dark:text-[#F4F7FB] transition-colors focus:outline-none focus:ring-2 cursor-pointer disabled:bg-slate-100 disabled:text-slate-600 dark:disabled:bg-[#101C2C] dark:disabled:text-[#8493A8] disabled:cursor-not-allowed ${
            error
              ? 'border-rose-500 focus:ring-rose-500/25 focus:border-rose-500'
              : 'border-slate-300/80 dark:border-[#253448] focus:ring-[#0E7490]/25 dark:focus:ring-[#43D9E9]/25 focus:border-[#0E7490] dark:focus:border-[#43D9E9]'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-rose-700 dark:text-rose-400">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-slate-600 dark:text-[#A0AEC0]">{helperText}</p>
        )}
      </div>
    );
  }
);

SelectField.displayName = 'SelectField';
