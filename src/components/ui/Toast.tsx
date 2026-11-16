import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-2), { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] sm:w-auto pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`ejji-animate-toast pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-[12px] border shadow-xl text-xs font-medium backdrop-blur-md font-ethiopic ${
              toast.variant === 'success'
                ? 'bg-white/95 dark:bg-[#101C2C]/95 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                : toast.variant === 'error'
                ? 'bg-white/95 dark:bg-[#101C2C]/95 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-300'
                : 'bg-white/95 dark:bg-[#101C2C]/95 border-slate-200 dark:border-[#253448] text-slate-800 dark:text-[#F4F7FB]'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {toast.variant === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" aria-hidden="true" />
              ) : toast.variant === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" aria-hidden="true" />
              ) : (
                <Info className="w-4 h-4 text-[#0E7490] dark:text-[#43D9E9] shrink-0" aria-hidden="true" />
              )}
              <span className="truncate">{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="w-6 h-6 rounded-[6px] flex items-center justify-center opacity-80 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7490] dark:focus-visible:ring-[#43D9E9] cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
